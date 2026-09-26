import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { joinWaitlist } from '../services/waitlistService.js';

const router = Router();
router.post('/', authMiddleware, async (req, res) => {
  const { eventId, slotId } = req.body;
  try {
    const result = await joinWaitlist({ eventId, slotId, userId: req.user.uid, userEmail: req.user.email });
    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'ALREADY_ON_WAITLIST') {
      return res.status(409).json({ error: "You're already on the waitlist for this." });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});
export default router;