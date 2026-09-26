import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import TicketModal from '../components/TicketModal.jsx';
import SkeletonTicketRow from '../components/SkeletonTicketRow.jsx';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export default function Profile() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('active');
  const [showOlder, setShowOlder] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const loadBookings = () => {
    api.get('/bookings/mine')
      .then((res) => setBookings(res.data.bookings))
      .catch((err) => console.error('Failed to fetch bookings:', err))
      .finally(() => setLoading(false));
  };
  useEffect(loadBookings, []);
  const handleCancel = async (e, bookingId) => {
    e.stopPropagation(); // don't open the modal when clicking Cancel
    if (!confirm('Cancel this booking and request a refund?')) return;
    setCancelling(bookingId);
    setMessage('');
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setMessage('Booking cancelled. Refund initiated.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not cancel this booking.');
    } finally {
      setCancelling(null);
    }
  };
  const now = Date.now();
  const active = bookings.filter((b) => b.status === 'confirmed' && new Date(b.dateTime).getTime() > now);
  const expiredAll = bookings.filter((b) => b.status === 'confirmed' && new Date(b.dateTime).getTime() <= now);
  const expiredRecent = expiredAll.filter((b) => now - new Date(b.dateTime).getTime() <= THIRTY_DAYS_MS);
  const expiredOlder = expiredAll.filter((b) => now - new Date(b.dateTime).getTime() > THIRTY_DAYS_MS);
  const cancelled = bookings.filter((b) => b.status === 'cancelled');
  const TABS = [
    { key: 'active', label: 'Active', list: active },
    { key: 'expired', label: 'Expired', list: showOlder ? expiredAll : expiredRecent },
    { key: 'cancelled', label: 'Cancelled', list: cancelled },
  ];
  const currentList = TABS.find((t) => t.key === tab)?.list || [];
  return (
    <div className="px-8 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl mb-2">My Bookings</h1>
      <p className="text-ink/60 mb-6 text-sm">Signed in as {currentUser?.email}</p>
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              tab === t.key ? 'bg-marquee text-stage border-marquee' : 'border-white/15 hover:border-white/40'
            }`}
          >
            {t.label} <span className="opacity-60">({t.list.length})</span>
          </button>
        ))}
      </div>
      {message && <p className="text-sm text-marquee mb-4">{message}</p>}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonTicketRow key={i} />)}
        </div>
      )}
      {!loading && currentList.length === 0 && <p className="text-ink/50 text-sm">Nothing here yet.</p>}
      {!loading && (
      <div className="flex flex-col gap-4">
        {currentList.map((b) => {
          const isCancelled = b.status === 'cancelled';
          const eventPassed = new Date(b.dateTime).getTime() < now;
          const withinCancelWindow = new Date(b.dateTime).getTime() - now > 24 * 60 * 60 * 1000;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className={`flex gap-4 border rounded-xl p-4 bg-surface border-white/10 hover:border-marquee/40 transition-colors text-left ${isCancelled ? 'opacity-60' : ''}`}
            >
              <img src={b.qrCode} alt="Ticket QR" className="w-20 h-20 rounded bg-white p-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{b.eventTitle}</p>
                  {isCancelled && <span className="text-xs bg-velvet/20 text-velvet px-2 py-0.5 rounded-full">Cancelled</span>}
                  {b.checkedIn && !isCancelled && <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Checked in</span>}
                  {!isCancelled && !b.checkedIn && eventPassed && <span className="text-xs bg-white/10 text-ink/50 px-2 py-0.5 rounded-full">Expired</span>}
                </div>
                <p className="text-xs text-ink/50">{b.venueName}, {b.city}</p>
                <p className="text-xs text-ink/50">
                  {new Date(b.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-xs text-ink/50 mt-1 font-mono">
                  {b.holdType === 'seat' ? `Seats: ${b.seatIds?.join(', ')}` : `${b.quantity} ticket(s)`} · ₹{b.amount}
                </p>
                {!isCancelled && !eventPassed && withinCancelWindow && (
                  <span onClick={(e) => handleCancel(e, b.id)} className="text-xs text-velvet hover:underline mt-2 inline-block">
                    {cancelling === b.id ? 'Cancelling…' : 'Cancel & refund'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      )}
      {tab === 'expired' && expiredOlder.length > 0 && (
        <button onClick={() => setShowOlder(!showOlder)} className="mt-4 text-sm text-marquee hover:underline">
          {showOlder ? 'Hide older tickets' : `View older tickets (${expiredOlder.length})`}
        </button>
      )}
      <TicketModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}