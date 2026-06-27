---
name: Phase 2 implementation
description: All 7 PRD priorities implemented — what needs credentials vs what's fully live.
---

## Done (no credentials needed)
- Socket.io-client: `src/lib/socket.ts` singleton, `useSlotSync` + `useBookingNotifications` hooks, wired on booking.tsx, agenda.tsx
- GIST constraint: applied to DB, versioned in `artifacts/api-server/src/db/migrations/001_gist_constraint.sql`
- SELECT FOR UPDATE inside `db.transaction()` in `POST /api/bookings`
- Helmet + express-rate-limit (5/15min on /auth/*) + CORS restricted via FRONTEND_URL env
- Agenda click handler: empty cell click → block modal (staff, duration, reason) → `POST /dashboard/blocks`
- /account/bookings page at `/account/bookings` with cancel dialog (2h policy enforced)
- Booking confirmation page at `/booking/confirmation?id=...`
- Sonner toaster added alongside shadcn Toaster in App.tsx

## Degraded (code live, needs env vars to activate)
- **Stripe**: set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLISHABLE_KEY. Without them → mock flow (Simuler le paiement button)
- **Redis**: set REDIS_URL. Without it → no distributed lock (SELECT FOR UPDATE still runs), setInterval fallback for BullMQ
- **Firebase OTP**: set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL. Without → /verify-phone accepts any code

## Key architectural decisions
- Stripe webhook registered BEFORE express.json() in app.ts so raw Buffer is preserved
- Socket.io path: `/ws/socket.io` (matches server config)
- BullMQ conditionally activates when Redis is available; graceful setInterval fallback
- `booking/confirmation` route MUST be before `/booking/:slug` in App.tsx router to avoid slug capturing "confirmation"
- Stripe mock path: isMock flag from API → "Simuler le paiement" button → POST /:id/confirm
