import { db } from '../config/firebaseAdmin.js';
import { generateTicketQR } from './ticketService.js';
import { sendBookingConfirmationEmail } from './emailService.js';

export async function createBooking({
  eventId, userId, userEmail, holdType, seatIds, slotId, quantity, holdIds,
  amount, razorpayOrderId, razorpayPaymentId,
}) {
  const eventSnap = await db.collection('events').doc(eventId).get();
  if (!eventSnap.exists) throw new Error('EVENT_NOT_FOUND');
  const event = eventSnap.data();
  const bookingRef = db.collection('bookings').doc();
  const normalizedHoldIds = Array.isArray(holdIds) ? holdIds : [holdIds];
  await db.runTransaction(async (transaction) => {
    const holdRefs = normalizedHoldIds.map((id) => db.collection('holds').doc(id));
    const holdSnaps = await Promise.all(holdRefs.map((ref) => transaction.get(ref)));
    holdSnaps.forEach((snap, i) => {
      if (!snap.exists) throw new Error('HOLD_NOT_FOUND');
      const hold = snap.data();
      if (hold.userId !== userId) throw new Error('HOLD_OWNERSHIP_MISMATCH');
      transaction.update(holdRefs[i], { status: 'confirmed' });
    });
    transaction.set(bookingRef, {
      eventId,
      eventTitle: event.title,
      eventType: event.type,
      venueName: event.venueName,
      city: event.city,
      dateTime: event.dateTime,
      userId,
      userEmail,
      holdType,
      holdIds: normalizedHoldIds,
      seatIds: seatIds || null,
      slotId: slotId || null,
      quantity: quantity || null,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      status: 'confirmed',
      checkedIn: false,
      checkedInAt: null,
      reminderSent: false,
      createdAt: new Date().toISOString(),
    });
  });
  const qrCode = await generateTicketQR(bookingRef.id);
  await bookingRef.update({ qrCode });
  await sendBookingConfirmationEmail({
    id: bookingRef.id, eventTitle: event.title, venueName: event.venueName,
    city: event.city, dateTime: event.dateTime, holdType, seatIds, quantity, amount, userEmail,
  });

  return { id: bookingRef.id, qrCode };
}