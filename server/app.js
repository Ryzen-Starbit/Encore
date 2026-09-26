import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import eventsRouter from './routes/events.routes.js';
import holdsRouter from './routes/holds.routes.js';
import paymentsRouter from './routes/payments.routes.js';
import bookingsRouter from './routes/bookings.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import waitlistRouter from './routes/waitlist.routes.js';
import { startExpireHoldsJob } from './jobs/expireHolds.js';
import { startReminderJob } from './jobs/sendReminders.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(generalLimiter);

const holdLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/holds/seat', holdLimiter);
app.use('/api/holds/slot', holdLimiter);
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/events', eventsRouter);
app.use('/api/holds', holdsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});
startExpireHoldsJob();
startReminderJob();
export default app;