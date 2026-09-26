import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { validateEvent, checkEditWindow } from '../middleware/validateEvent.js';
import { db } from '../config/firebaseAdmin.js';
import { computeSlotPrice } from '../utils/pricing.js';

const router = Router();
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    let query = db.collection('events');
    const { type, category, city, includePast } = req.query;
    if (type) query = query.where('type', '==', type);
    if (category) query = query.where('category', '==', category);
    if (city) query = query.where('city', '==', city);
    const snapshot = await query.limit(100).get();
    let events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (!includePast) {
      const now = Date.now();
      events = events.filter((e) => new Date(e.dateTime).getTime() > now);
    }
    events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Event not found' });
    const event = { id: doc.id, ...doc.data() };
    if (event.type === 'fare' && Array.isArray(event.timeSlots)) {
      event.timeSlots = event.timeSlots.map((s) => ({ ...s, effectivePrice: computeSlotPrice(s) }));
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.get('/whoami/check', authMiddleware, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email });
});

router.post('/', authMiddleware, adminMiddleware, validateEvent, async (req, res) => {
  try {
    const ref = await db.collection('events').add({
      ...req.body, createdBy: req.user.uid, createdAt: new Date().toISOString(),
    });
    res.status(201).json({ id: ref.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, checkEditWindow, validateEvent, async (req, res) => {
  try {
    const ref = db.collection('events').doc(req.params.id);
    await ref.update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, checkEditWindow, async (req, res) => {
  try {
    await db.collection('events').doc(req.params.id).delete();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;