import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { db } from '../config/firebaseAdmin.js';
import { razorpay } from '../config/razorpay.js';
import { verifyPaymentSignature } from '../services/paymentService.js';
import { createBooking } from '../services/bookingService.js';
import { computeSlotPrice } from '../utils/pricing.js';

const router = Router();

router.post('/create-order', authMiddleware, async (req, res) => {
  const { eventId, holdType, seatIds, slotId, quantity, holdIds } = req.body;
  try {
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return res.status(404).json({ error: 'Event not found' });
    const event = eventSnap.data();
    let amount;
    if (holdType === 'seat') {
      if (!Array.isArray(seatIds) || seatIds.length === 0 || !Array.isArray(holdIds)) {
        return res.status(400).json({ error: 'seatIds and holdIds are required for seat holds' });
      }
      const holdSnaps = await Promise.all(holdIds.map((id) => db.collection('holds').doc(id).get()));
      const valid = holdSnaps.every(
        (snap) => snap.exists && snap.data().userId === req.user.uid &&
          snap.data().status === 'held' && snap.data().expiresAt > Date.now()
      );
      if (!valid) return res.status(410).json({ error: 'One or more holds have expired. Please re-select your seats.' });
      amount = seatIds.length * event.seatMap.price;
    } else if (holdType === 'slot') {
      if (!slotId || !quantity || !holdIds) {
        return res.status(400).json({ error: 'slotId, quantity, and holdIds are required for slot holds' });
      }
      const holdSnap = await db.collection('holds').doc(holdIds).get();
      const valid = holdSnap.exists && holdSnap.data().userId === req.user.uid &&
        holdSnap.data().status === 'held' && holdSnap.data().expiresAt > Date.now();
      if (!valid) return res.status(410).json({ error: 'Your hold has expired. Please re-select your tickets.' });
      const slot = event.timeSlots.find((s) => s.id === slotId);
      amount = quantity * computeSlotPrice(slot);
    } else {
      return res.status(400).json({ error: 'holdType must be "seat" or "slot"' });
    }
    const order = await razorpay.orders.create({
      amount: amount * 100, currency: 'INR', receipt: `rcpt_${Date.now()}`,
    });
    res.json({
      orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, eventTitle: event.title,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

router.post('/verify', authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,
    eventId, holdType, seatIds, slotId, quantity, holdIds, amount } = req.body;
  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature,
  });
  if (!isValid) return res.status(400).json({ error: 'Payment verification failed. Please contact support if money was deducted.' });
  try {
    const booking = await createBooking({
      eventId, userId: req.user.uid, userEmail: req.user.email,
      holdType, seatIds, slotId, quantity, holdIds, amount: amount / 100,
      razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
    });
    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verified, but booking could not be created. Please contact support.' });
  }
});

export default router;