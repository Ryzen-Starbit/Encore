import { db } from '../config/firebaseAdmin.js';
import { sendWaitlistEmail } from './emailService.js';

export async function joinWaitlist({ eventId, slotId, userId, userEmail }) {
  const key = `${eventId}_${slotId || 'show'}_${userId}`;
  const ref = db.collection('waitlists').doc(key);
  const existing = await ref.get();
  if (existing.exists && !existing.data().notified) {
    throw new Error('ALREADY_ON_WAITLIST');
  }
  await ref.set({
    eventId, slotId: slotId || null, userId, userEmail,
    notified: false, createdAt: new Date().toISOString(),
  });
  return { joined: true };
}
export async function notifyWaitlist({ eventId, slotId, count = 1 }) {
  const snapshot = await db.collection('waitlists')
    .where('eventId', '==', eventId)
    .where('slotId', '==', slotId || null)
    .where('notified', '==', false)
    .get();
  const entries = snapshot.docs
    .map((doc) => ({ ref: doc.ref, ...doc.data() }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, count);
  for (const entry of entries) {
    await sendWaitlistEmail(entry);
    await entry.ref.update({ notified: true, notifiedAt: new Date().toISOString() });
  }
}