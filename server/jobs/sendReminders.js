import cron from 'node-cron';
import { db } from '../config/firebaseAdmin.js';
import { sendReminderEmail } from '../services/emailService.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
export function startReminderJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const snapshot = await db.collection('bookings').where('status', '==', 'confirmed').get();
      const now = Date.now();
      const due = snapshot.docs.filter((doc) => {
        const b = doc.data();
        if (b.reminderSent) return false;
        const timeUntil = new Date(b.dateTime).getTime() - now;
        return timeUntil > 0 && timeUntil <= TWO_HOURS_MS;
      });
      for (const doc of due) {
        const booking = { id: doc.id, ...doc.data() };
        await sendReminderEmail(booking);
        await doc.ref.update({ reminderSent: true });
      }
      if (due.length > 0) console.log(`[sendReminders] sent ${due.length} reminder(s)`);
    } catch (err) {
      console.error('[sendReminders] failed:', err);
    }
  });
}