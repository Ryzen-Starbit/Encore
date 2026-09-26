import cron from 'node-cron';
import { db } from '../config/firebaseAdmin.js';
import { releaseSlotHold } from '../services/slotLockService.js';

export function startExpireHoldsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = Date.now();
      const snapshot = await db.collection('holds').where('status', '==', 'held').get();
      const expired = snapshot.docs.filter((doc) => doc.data().expiresAt <= now);
      if (expired.length === 0) return;
      for (const doc of expired) {
        const hold = doc.data();
        if (hold.slotId) {
          await releaseSlotHold(hold);
        }
        await doc.ref.delete();
      }
      console.log(`[expireHolds] cleared ${expired.length} expired hold(s)`);
    } catch (err) {
      console.error('[expireHolds] failed:', err);
    }
  });
}