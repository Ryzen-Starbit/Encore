# Encore — Event & Fair Ticketing Platform

I wanted a portfolio project that went beyond another movie-ticket clone, so I built Encore around comedy shows, poetry nights, music gigs, and book/anime fairs instead — which meant solving two different booking problems in one app: reserved-seat concurrency for shows, and limited-quantity inventory for fairs. Everything is built to survive real concurrent demand, not just look right in a single-user demo.

![Home page — marquee hero and event grid](screenshots/home.png)

---

## The problem I was trying to solve

Most student ticketing projects stop at "create a booking in the database" and never actually handle the hard part:

- Two people can select the same seat at the same instant and both "succeed"
- Payment confirmation is trusted from the client instead of verified server-side
- Cancellations don't actually free up the inventory they claim to
- There's no real admin workflow — just a raw CRUD form
- Nothing tells a user their ticket is about to expire, or reminds them the event is starting soon

Encore is built specifically to close these gaps with Firestore transactions, HMAC payment verification, and a full admin/notification layer.

---

## What it does

### Browsing & discovery
Events are split into two types — **Shows** (comedy, poetry, music, with reserved seating) and **Fares** (book/anime fairs, with limited-quantity time slots). The Explore page has category filters and a fuzzy search bar across event title, city, and venue, and automatically hides events once they've passed.

![Explore page with category filters and search](screenshots/explore-search.png)

### Concurrency-safe seat & slot holds
This is the part I spent the most time on. Selecting seats or fare tickets creates a Firestore **transaction**-backed hold with an 8-minute countdown before payment must complete. Two users racing for the same seat, or the last ticket in a sold-out slot, can't both succeed — I tested this directly with two simultaneous browser sessions, and only one hold ever goes through, with the other getting a clean rejection instead of silently overwriting the first.

![Seat map with live occupancy bar](screenshots/seat-map.png)

Fare slots use dynamic demand pricing — price rises up to 50% as a slot fills, computed server-side so it can't be tampered with from the client.

![Slot selector with surge pricing](screenshots/slot-selector.png)

### Payments & tickets
Checkout runs through Razorpay. The backend independently recomputes and verifies the payment signature before ever creating a booking — the frontend's "payment succeeded" callback is never trusted on its own. Every confirmed booking gets a QR-code e-ticket, viewable in an expandable ticket modal with download-as-image and native share support.

![Ticket modal with QR code, download, and share](screenshots/ticket-modal.png)
![Test Mode Razorpay Gateway](screenshots/payment.png)

### My Bookings
Bookings are split into Active, Expired, and Cancelled tabs, with expired tickets automatically archived after 30 days (with a "view older" toggle to see the full history). Cancelling within the allowed window triggers a real Razorpay refund and frees the seat/slot back up for other users — including notifying anyone on the waitlist for that show or slot.

![My Bookings with status tabs](screenshots/my-bookings.png)

### Admin panel
A proper admin hub rather than a bare form — separate cards for managing events, running the check-in scanner, and viewing analytics. Event creation cascades State → City dropdowns across every Indian state, and editing/deleting locks automatically once an event is within 24 hours of starting.

![Admin hub](screenshots/admin-hub.png)
![Manage Events form](screenshots/manage-events1.png)
![Manage Events form](screenshots/manage-events2.png)

### QR check-in scanner
A camera-based scanner for venue entry. Scanning a valid ticket shows a full-page confirmation with seat/ticket details; scanning an already-used or cancelled ticket is rejected outright. Start/stop controls release the camera when not in use.

### Analytics dashboard
Revenue by event, occupancy percentage, and a 14-day booking trend, all computed live from Firestore rather than cached.

![Analytics dashboard](screenshots/analytics1.png)
![Analytics dashboard](screenshots/analytics2.png)

### Notifications
Email confirmations and cancellation notices via Gmail SMTP, plus an automatic reminder email 2 hours before an event starts — all handled by background cron jobs that also expire stale holds every minute.

### Visual identity
A dark, marquee-theater design — chase-light borders, ticket-stub cards with punch-hole perforations, curtain-wipe page transitions, and a slow drift of translucent film-reel/ticket icons across the background.

---

## Architecture

Browser (React + Vite)
│
▼
Vite Dev Server (5173)
│
├── /api/* ──────────────────────► Node + Express API (5000)
│ │
│ ├── /api/events (browse, admin CRUD)
│ ├── /api/holds (seat/slot locking, transactions)
│ ├── /api/payments (Razorpay order + signature verify)
│ ├── /api/bookings (mine, cancel, check-in)
│ ├── /api/waitlist (join, auto-notify)
│ └── /api/analytics (revenue, occupancy, trends)
│ │
│ Firebase Admin SDK
│ │
│ ┌─────────────────┼─────────────────┐
│ ▼ ▼ ▼
│ Firestore Razorpay API Gmail SMTP
│ (events, holds, (orders, refund, (Nodemailer:
│ bookings, waitlists) signature verify) confirmations,
│ cancellations,
├── Firebase Auth ──────► Email / Google sign-in reminders)
│ + custom admin claim
│
└── node-cron ─────────► expireHolds (every 1 min)
sendReminders (every 5 min)


---

## Tech stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Framer Motion (page transitions)
- Recharts (analytics charts)
- html2canvas (ticket download/share)
- html5-qrcode (check-in scanner)
- React Router DOM

**Backend**
- Node.js + Express
- Firebase Admin SDK (Auth + Firestore)
- Razorpay Node SDK
- Nodemailer (Gmail SMTP)
- node-cron
- express-rate-limit
- qrcode (ticket generation)

---

## Getting it running

### 1. Clone it

```bash
git clone https://github.com/<your-username>/encore.git
cd encore
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com), create a project
2. Enable **Authentication** → Email/Password + Google
3. Enable **Firestore Database** (test mode is fine locally)
4. Project Settings → General → add a Web app → copy the config
5. Project Settings → Service Accounts → Generate new private key → save as `server/serviceAccountKey.json` (already gitignored)

### 3. Set up Razorpay

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com), switch to **Test Mode**
2. Account & Settings → API Keys → Generate Test Key
3. Copy the Key ID and Key Secret

### 4. Set up email

1. Enable 2-Step Verification on a Gmail account
2. Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### 5. Environment files

`client/.env`:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000/api


`server/.env`:

PORT=5000
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Encore youraddress@gmail.com"


### 6. Install and run

```bash
cd server && npm install && npm run dev
```
```bash
# new terminal
cd client && npm install && npm run dev
```

Open `http://localhost:5173`.

---

## How to use it

1. Sign up and make yourself an admin: `node server/scripts/setAdmin.js your@email.com`, then sign out/in
2. Create a Show (reserved seating) and a Fare (limited-quantity slots) from `/admin/events`
3. Book one from the Explore page — hold a seat or slot, pay with Razorpay's test card (`4111 1111 1111 1111`, any future expiry/CVV)
4. Check `/profile` for the confirmed booking and QR ticket
5. Try the check-in scanner at `/admin/scanner` against your own ticket's QR
6. Check `/admin/analytics` for the revenue/occupancy breakdown
7. Cancel a booking to see the refund flow and waitlist notification in action

---

## Project structure

booking-app/
├── client/
│ └── src/
│ ├── components/
│ │ ├── Navbar/, EventCard.jsx, TicketModal.jsx, TicketLookup.jsx
│ │ ├── SeatMap/, SlotSelector/, Countdown/
│ │ ├── Loader.jsx, SkeletonCard.jsx, SkeletonTicketRow.jsx
│ │ ├── FloatingDecor.jsx, CurtainTransition.jsx
│ │ ├── ProtectedRoute.jsx, AdminRoute.jsx
│ ├── pages/
│ │ ├── Home.jsx, Login.jsx, Profile.jsx, EventDetails.jsx
│ │ └── admin/ (AdminHome, ManageEvents, ScannerPage, AdminAnalytics)
│ ├── context/AuthContext.jsx
│ ├── services/ (firebase.js, api.js)
│ └── data/indianCities.js
│
├── server/
│ ├── config/ (firebaseAdmin.js, razorpay.js)
│ ├── middleware/ (authMiddleware, adminMiddleware, validateEvent)
│ ├── routes/ (events, holds, payments, bookings, analytics, waitlist)
│ ├── services/ (seatLockService, slotLockService, bookingService,
│ │ cancellationService, waitlistService, emailService,
│ │ paymentService, ticketService)
│ ├── jobs/ (expireHolds.js, sendReminders.js)
│ ├── utils/pricing.js
│ └── scripts/setAdmin.js
│
└── firebase/firestore.rules


---

## Known limitations / things I'd improve

- Cron jobs (hold expiry, reminders) only run while the backend process is alive — on a free-tier host that sleeps, this needs an external keep-alive ping
- Seat-map polling is a 10-second interval rather than a true real-time Firestore listener — swappable later for `onSnapshot`
- No pagination yet on the admin's event list

---

## Contributing

Contributions and suggestions are welcome.

- Fork the repository
- Create a feature branch
- Commit your changes
- Push to your branch
- Submit a pull request
