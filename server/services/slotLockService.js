import { db } from '../config/firebaseAdmin.js';
import admin from '../config/firebaseAdmin.js';
import { notifyWaitlist } from './waitlistService.js';

const HOLD_DURATION_MS = 8 * 60 * 1000;

export async function holdSlotTickets({ eventId, slotId, quantity, userId }) {
  const eventRef = db.collection('events').doc(eventId);
  const holdRef = db.collection('holds').doc();
  const expiresAt = Date.now() + HOLD_DURATION_MS;
  await db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists) throw new Error('EVENT_NOT_FOUND');
    const event = eventSnap.data();
    const slotIndex = event.timeSlots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) throw new Error('SLOT_NOT_FOUND');
    const slot = event.timeSlots[slotIndex];
    const remaining = slot.remaining ?? slot.capacity;
    if (remaining < quantity) throw new Error(`INSUFFICIENT_CAPACITY:${remaining}`);
    const updatedSlots = [...event.timeSlots];
    updatedSlots[slotIndex] = { ...slot, remaining: remaining - quantity };
    transaction.update(eventRef, { timeSlots: updatedSlots });
    transaction.set(holdRef, {
      eventId, slotId, quantity, userId, status: 'held', expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { holdId: holdRef.id, expiresAt };
}

export async function releaseSlotHold(holdDoc) {
  const { eventId, slotId, quantity } = holdDoc;
  const eventRef = db.collection('events').doc(eventId);
  await db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists) return;
    const event = eventSnap.data();
    const slotIndex = event.timeSlots.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) return;
    const slot = event.timeSlots[slotIndex];
    const remaining = slot.remaining ?? slot.capacity;
    const updatedSlots = [...event.timeSlots];
    updatedSlots[slotIndex] = { ...slot, remaining: remaining + quantity };
    transaction.update(eventRef, { timeSlots: updatedSlots });
  });
  await notifyWaitlist({ eventId, slotId, count: quantity }).catch((err) =>
    console.error('[releaseSlotHold] waitlist notify failed:', err)
  );
}