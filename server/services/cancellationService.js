import { db } from '../config/firebaseAdmin.js';
import { razorpay } from '../config/razorpay.js';
import { releaseSlotHold } from './slotLockService.js';
import { sendCancellationEmail } from './emailService.js';
import { notifyWaitlist } from './waitlistService.js';

const CANCEL_CUTOFF_MS = 24 * 60 * 60 * 1000;

export async function cancelBooking({ bookingId, userId }) {
  const ref = db.collection('bookings').doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('BOOKING_NOT_FOUND');
  const booking = snap.data();
  if (booking.userId !== userId) throw new Error('NOT_OWNER');
  if (booking.status === 'cancelled') throw new Error('ALREADY_CANCELLED');
  const eventTime = new Date(booking.dateTime).getTime();
  if (Date.now() > eventTime - CANCEL_CUTOFF_MS) throw new Error('CANCEL_WINDOW_CLOSED');
  const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
    amount: Math.round(booking.amount * 100),
  });
  if (booking.holdType === 'slot') {
    await releaseSlotHold({ eventId: booking.eventId, slotId: booking.slotId, quantity: booking.quantity });
  }
  if (Array.isArray(booking.holdIds)) {
    await Promise.all(booking.holdIds.map((id) => db.collection('holds').doc(id).delete()));
  }
  if (booking.holdType === 'seat') {
    await notifyWaitlist({ eventId: booking.eventId, slotId: null, count: booking.seatIds?.length || 1 }).catch(
      (err) => console.error('[cancelBooking] waitlist notify failed:', err)
    );
  }
  
  await ref.update({
    status: 'cancelled', cancelledAt: new Date().toISOString(),
    refundId: refund.id, refundAmount: booking.amount,
  });
  await sendCancellationEmail({ ...booking, id: bookingId });
  return { refundId: refund.id, refundAmount: booking.amount };
}