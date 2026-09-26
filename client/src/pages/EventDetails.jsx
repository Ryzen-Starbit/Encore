import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import SeatMap from '../components/SeatMap/SeatMap.jsx';
import SlotSelector from '../components/SlotSelector/SlotSelector.jsx';
import Countdown from '../components/Countdown/Countdown.jsx';

export default function EventDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeHold, setActiveHold] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [booking, setBooking] = useState(null);
  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => {
        console.error('Failed to fetch event:', err);
        setError('Event not found.');
      })
      .finally(() => setLoading(false));
  }, [id]);
  if (loading) return <p className="px-8 py-12 text-ink/50 text-sm">Loading…</p>;
  if (error) return <p className="px-8 py-12 text-red-600 text-sm">{error}</p>;
  const dateLabel = new Date(event.dateTime).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  });
  const handlePayment = async () => {
    setPaying(true);
    setPayError('');
    try {
      const orderPayload = {
        eventId: event.id,
        holdType: activeHold.type,
        seatIds: activeHold.seatIds,
        slotId: activeHold.slotId,
        quantity: activeHold.quantity,
        holdIds: activeHold.type === 'seat' ? activeHold.holdIds : activeHold.holdId,
      };
      const { data: order } = await api.post('/payments/create-order', orderPayload);
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Encore',
        description: order.eventTitle,
        order_id: order.orderId,
        prefill: { email: currentUser?.email },
        theme: { color: '#5B4EE5' },
        handler: async (response) => {
          try {
            const { data: confirmedBooking } = await api.post('/payments/verify', {
              ...response,
              ...orderPayload,
              amount: order.amount,
            });
            setBooking(confirmedBooking);
            setActiveHold(null);
          } catch (err) {
            console.error(err);
            setPayError(err.response?.data?.error || 'Payment succeeded but confirmation failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.on('payment.failed', (resp) => {
        setPayError(resp.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.error || 'Could not start payment. Your hold may have expired.');
      setPaying(false);
    }
  };
  if (booking) {
    return (
      <div className="px-8 py-12 max-w-md mx-auto text-center">
        <h1 className="text-2xl mb-2">Booking confirmed 🎉</h1>
        <p className="text-ink/60 mb-6">{event.title} · {dateLabel}</p>
        <img src={booking.qrCode} alt="Ticket QR code" className="mx-auto rounded-lg border border-ink/10 mb-4" />
        <p className="text-xs text-ink/50 mb-6">Booking ID: {booking.id}</p>
        <a href="/profile" className="text-accent text-sm font-medium hover:underline">
          View in My Bookings
        </a>
      </div>
    );
  }

  return (
    <div className="px-8 py-12 max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-wide text-accent mb-2">
        {event.category?.replace('-', ' ')}
      </p>
      <h1 className="text-3xl mb-2">{event.title}</h1>
      <p className="text-ink/60 mb-1">{event.venueName}, {event.city}</p>
      <p className="text-ink/50 text-sm mb-8">{dateLabel}</p>
      {event.description && <p className="mb-8 text-ink/80">{event.description}</p>}
      {activeHold ? (
        <div className="border border-accent/30 bg-accent/5 rounded-xl p-6">
          <h3 className="text-lg mb-1">Held — complete payment to confirm</h3>
          <p className="text-sm text-ink/60 mb-4">
            Your seats/tickets are reserved for{' '}
            <Countdown expiresAt={activeHold.expiresAt} onExpire={() => setActiveHold(null)} />.
          </p>
          {payError && <p className="text-red-600 text-sm mb-4">{payError}</p>}
          <button
            onClick={handlePayment}
            disabled={paying}
            className="bg-ink text-canvas rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50"
          >
            {paying ? 'Opening checkout…' : 'Proceed to payment'}
          </button>
        </div>
      ) : (
        <div className="border border-ink/10 rounded-xl p-6">
          <h3 className="text-lg mb-4">
            {event.type === 'show' ? 'Select your seats' : 'Choose an entry slot'}
          </h3>
          {event.type === 'show' ? (
            <SeatMap event={event} onHold={setActiveHold} />
          ) : (
            <SlotSelector event={event} onHold={setActiveHold} />
          )}
        </div>
      )}
    </div>
  );
}