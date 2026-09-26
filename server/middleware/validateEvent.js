import { STATES } from '../data/indianCities.js';

export function validateEvent(req, res, next) {
  const { title, category, type, venueName, city, state, dateTime } = req.body;
  const errors = [];
  if (!title || typeof title !== 'string') errors.push('title is required');
  if (!['comedy', 'poetry', 'music', 'book-fair', 'anime-fair'].includes(category)) {
    errors.push('category must be one of comedy, poetry, music, book-fair, anime-fair');
  }
  if (!['show', 'fare'].includes(type)) errors.push('type must be "show" or "fare"');
  if (!venueName || typeof venueName !== 'string') errors.push('venueName is required');
  if (!state || !STATES.includes(state)) errors.push('state must be a valid Indian state/UT');
  if (!city || typeof city !== 'string') errors.push('city is required');
  if (!dateTime || isNaN(Date.parse(dateTime))) errors.push('dateTime must be a valid date string');
  if (type === 'show') {
    const { seatMap } = req.body;
    if (!seatMap || !seatMap.rows || !seatMap.seatsPerRow || !seatMap.price) {
      errors.push('show events require seatMap: { rows, seatsPerRow, price }');
    }
  }
  if (type === 'fare') {
    const { timeSlots } = req.body;
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      errors.push('fare events require a non-empty timeSlots array');
    } else {
      timeSlots.forEach((slot, i) => {
        if (!slot.label || !slot.startTime || !slot.capacity || !slot.price) {
          errors.push(`timeSlots[${i}] must have label, startTime, capacity, and price`);
        }
      });
    }
  }
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  next();
}

export async function checkEditWindow(req, res, next) {
  try {
    const { db } = await import('../config/firebaseAdmin.js');
    const doc = await db.collection('events').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Event not found' });
    const eventTime = new Date(doc.data().dateTime).getTime();
    const cutoff = eventTime - 24 * 60 * 60 * 1000;
    if (Date.now() > cutoff) {
      return res.status(403).json({
        error: 'This event starts within 24 hours and can no longer be edited or deleted.',
      });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check edit window' });
  }
}