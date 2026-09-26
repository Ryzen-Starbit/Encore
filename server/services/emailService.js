import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
async function sendMail({ to, subject, html }) {
  if (!to) return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
  } catch (err) {
    console.error('[emailService] failed to send:', err.message);
  }
}

export function sendBookingConfirmationEmail(booking) {
  const details = booking.holdType === 'seat'
    ? `Seats: ${booking.seatIds.join(', ')}`
    : `${booking.quantity} ticket(s)`;
  return sendMail({
    to: booking.userEmail,
    subject: `Booking confirmed: ${booking.eventTitle}`,
    html: `
      <h2>You're booked in!</h2>
      <p><strong>${booking.eventTitle}</strong></p>
      <p>${booking.venueName}, ${booking.city}</p>
      <p>${new Date(booking.dateTime).toLocaleString('en-IN')}</p>
      <p>${details}</p>
      <p>Amount paid: ₹${booking.amount}</p>
      <p style="color:#888;font-size:12px">Booking ID: ${booking.id}</p>
    `,
  });
}

export function sendCancellationEmail(booking) {
  return sendMail({
    to: booking.userEmail,
    subject: `Booking cancelled: ${booking.eventTitle}`,
    html: `
      <h2>Your booking has been cancelled</h2>
      <p><strong>${booking.eventTitle}</strong></p>
      <p>A refund of ₹${booking.amount} has been initiated to your original payment method.</p>
      <p style="color:#888;font-size:12px">Booking ID: ${booking.id}</p>
    `,
  });
}

export function sendReminderEmail(booking) {
  return sendMail({
    to: booking.userEmail,
    subject: `Reminder: ${booking.eventTitle} starts in 2 hours`,
    html: `
      <h2>See you soon!</h2>
      <p><strong>${booking.eventTitle}</strong> starts in about 2 hours.</p>
      <p>${booking.venueName}, ${booking.city}</p>
      <p>${new Date(booking.dateTime).toLocaleString('en-IN')}</p>
      <p style="color:#888;font-size:12px">Booking ID: ${booking.id}</p>
    `,
  });
}

export function sendWaitlistEmail(entry) {
  return sendMail({
    to: entry.userEmail,
    subject: 'A spot just opened up!',
    html: `<h2>Good news — a ticket just became available.</h2><p>Head back to Encore and book before it's gone again.</p>`,
  });
}