import { db } from '../config/firebaseAdmin.js';
import admin from '../config/firebaseAdmin.js';

const HOLD_DURATION_MS = 8 * 60 * 1000; // 8 minutes to complete payment

export async function holdSeats({ eventId, seatIds, userId }) {
  const holdRefs = seatIds.map((seatId) =>
    db.collection('holds').doc(`${eventId}_seat_${seatId}`)
  );
  const expiresAt = Date.now() + HOLD_DURATION_MS;
  await db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(holdRefs.map((ref) => transaction.get(ref)));
    const conflicts = [];
    snapshots.forEach((snap, i) => {
      if (snap.exists) {
        const data = snap.data();
        const isActive = data.status === 'confirmed' || data.expiresAt > Date.now();
        if (isActive) conflicts.push(seatIds[i]);
      }
    });
    if (conflicts.length > 0) {
      throw new Error(`SEATS_UNAVAILABLE:${conflicts.join(',')}`);
    }
    snapshots.forEach((_, i) => {
      transaction.set(holdRefs[i], {
        eventId,
        seatId: seatIds[i],
        userId,
        status: 'held',
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  });
  return { expiresAt, holdIds: seatIds.map((seatId) => `${eventId}_seat_${seatId}`) }; 
}

export async function getUnavailableSeats(eventId) {
  const snapshot = await db
    .collection('holds')
    .where('eventId', '==', eventId)
    .get();
  const now = Date.now();
  return snapshot.docs
    .map((doc) => doc.data())
    .filter((h) => h.status === 'confirmed' || h.expiresAt > now)
    .map((h) => h.seatId);
}