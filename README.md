# Encore — Event & Fair Booking Platform

A full-stack ticketing platform for reserved-seat shows (comedy, poetry, music)
and limited-quantity fairs (book fairs, anime fests), with real-time seat/stock
locking to prevent double-booking under concurrent demand.

## Phase 1 — Foundation (this phase)

What's included:
- Firebase Authentication wired up on the client (email/password + Google)
- Firestore Admin SDK wired up on the server
- Express skeleton with CORS, rate limiting, logging, error handling
- `authMiddleware` to verify Firebase ID tokens on protected routes
- `adminMiddleware` to gate admin-only routes via a custom claim
- React app shell with routing, a Navbar, Login page, and a placeholder
  Home page that calls the backend

## Setup

### 1. Create a Firebase project
Go to the [Firebase console](https://console.firebase.google.com/), create a
project, then:
- Enable **Authentication** → Email/Password and Google sign-in providers
- Enable **Firestore Database** (start in test mode for now)
- Go to Project Settings → General → "Your apps" → add a Web app, copy the
  config values into `client/.env` (copy from `client/.env.example`)
- Go to Project Settings → Service Accounts → Generate new private key →
  save as `server/serviceAccountKey.json` (already gitignored)

### 2. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 3. Run both apps

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Client runs at `http://localhost:5173`, server at `http://localhost:5000`.

### 4. Verify the wiring
- Visit `http://localhost:5173`, sign up with email or Google
- Check `http://localhost:5000/api/events` returns `{ "events": [] }`
- Once signed in, the app can call `/api/events/whoami` (protected route) via
  the `api` service, which auto-attaches your Firebase ID token

### 5. Make yourself an admin (optional, for testing admin routes later)
You'll need a small one-off Node script using the Admin SDK:
```js
await auth.setCustomUserClaims('<your-firebase-uid>', { admin: true });
```
Sign out and back in afterward so the new claim shows up in your token.

## What's next (Phase 2)
Firestore schema for `events` (shows vs fares), admin CRUD, and the real
event browsing/detail pages.
