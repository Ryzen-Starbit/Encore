import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { db } from '../config/firebaseAdmin.js';

const router = Router();
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [eventsSnap, bookingsSnap] = await Promise.all([
      db.collection('events').get(),
      db.collection('bookings').get(),
    ]);
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const bookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const perEvent = events.map((event) => {
      const eventBookings = bookings.filter((b) => b.eventId === event.id);
      const active = eventBookings.filter((b) => b.status !== 'cancelled');
      const revenue = active.reduce((sum, b) => sum + (b.amount || 0), 0);
      const ticketsSold = active.reduce(
        (sum, b) => sum + (b.holdType === 'seat' ? (b.seatIds?.length || 0) : (b.quantity || 0)),
        0
      );
      const capacity = event.type === 'show'
        ? event.seatMap.rows * event.seatMap.seatsPerRow
        : event.timeSlots.reduce((sum, s) => sum + s.capacity, 0);
      return {
        eventId: event.id,
        title: event.title,
        revenue,
        ticketsSold,
        capacity,
        occupancy: capacity > 0 ? Math.round((ticketsSold / capacity) * 100) : 0,
        cancelled: eventBookings.length - active.length,
      };
    });

    const totalRevenue = perEvent.reduce((sum, e) => sum + e.revenue, 0);
    const totalBookings = bookings.filter((b) => b.status !== 'cancelled').length;
    const totalCancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const dayBuckets = {};
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const day = b.createdAt?.slice(0, 10);
      if (!day) return;
      dayBuckets[day] = (dayBuckets[day] || 0) + 1;
    });
    const bookingsOverTime = Object.entries(dayBuckets)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));

    res.json({ perEvent, totalRevenue, totalBookings, totalCancelled, bookingsOverTime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});
export default router;