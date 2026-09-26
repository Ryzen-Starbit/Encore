import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { db } from '../config/firebaseAdmin.js';
import { cancelBooking } from '../services/cancellationService.js';

const router = Router();
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('bookings').where('userId', '==', req.user.uid).get();
    const bookings = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your bookings' });
  }
});

router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await cancelBooking({ bookingId: req.params.id, userId: req.user.uid });
    res.json(result);
  } catch (err) {
    const messages = {
      BOOKING_NOT_FOUND: [404, 'Booking not found'],
      NOT_OWNER: [403, 'This is not your booking'],
      ALREADY_CANCELLED: [400, 'This booking is already cancelled'],
      CANCEL_WINDOW_CLOSED: [403, 'Cancellations are not allowed within 24 hours of the event'],
    };
    const [status, message] = messages[err.message] || [500, 'Failed to cancel booking'];
    if (status === 500) console.error(err);
    res.status(status).json({ error: message });
  }
});

router.post('/:id/check-in', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ref = db.collection('bookings').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Booking not found' });
    const booking = snap.data();
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'This booking was cancelled and is not valid for entry.' });
    }
    if (booking.checkedIn) {
      return res.status(409).json({ error: `Already checked in at ${booking.checkedInAt}` });
    }
    await ref.update({ checkedIn: true, checkedInAt: new Date().toISOString() });
    res.json({
      eventTitle: booking.eventTitle,
      seatIds: booking.seatIds,
      quantity: booking.quantity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in booking' });
  }
});

export default router;