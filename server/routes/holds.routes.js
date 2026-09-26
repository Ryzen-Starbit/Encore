import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { db } from '../config/firebaseAdmin.js';
import { holdSeats, getUnavailableSeats } from '../services/seatLockService.js';
import { holdSlotTickets } from '../services/slotLockService.js';

const router = Router();
router.post('/seat', authMiddleware, async (req, res) => {
  const { eventId, seatIds } = req.body;
  if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'eventId and a non-empty seatIds array are required' });
  }
  try {
    const result = await holdSeats({ eventId, seatIds, userId: req.user.uid });
    res.status(201).json(result);
  } catch (err) {
    if (err.message.startsWith('SEATS_UNAVAILABLE:')) {
      const seats = err.message.split(':')[1];
      return res.status(409).json({ error: `Seat(s) no longer available: ${seats}` });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to hold seats' });
  }
});

router.post('/slot', authMiddleware, async (req, res) => {
  const { eventId, slotId, quantity } = req.body;
  if (!eventId || !slotId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'eventId, slotId, and a positive quantity are required' });
  }
  try {
    const result = await holdSlotTickets({ eventId, slotId, quantity, userId: req.user.uid });
    res.status(201).json(result);
  } catch (err) {
    if (err.message.startsWith('INSUFFICIENT_CAPACITY:')) {
      const remaining = err.message.split(':')[1];
      return res.status(409).json({ error: `Only ${remaining} ticket(s) left in this slot` });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to hold tickets' });
  }
});

router.get('/event/:eventId/unavailable-seats', async (req, res) => {
  try {
    const seatIds = await getUnavailableSeats(req.params.eventId);
    res.json({ seatIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unavailable seats' });
  }
});

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db
      .collection('holds')
      .where('userId', '==', req.user.uid)
      .where('status', '==', 'held')
      .get();
    const holds = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((h) => h.expiresAt > Date.now());
    res.json({ holds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your holds' });
  }
});

export default router;