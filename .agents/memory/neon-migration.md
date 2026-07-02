---
name: Neon database migration
description: Database migrated from Replit built-in Postgres to Neon; secret naming and fallback logic.
---

# Neon Migration

## Rule
Use `NEON_DATABASE_URL` (Replit secret) for local dev — NOT `DATABASE_URL`, which is runtime-managed by Replit and cannot be overridden manually.

## How it works
`drizzle.config.ts` and `lib/db/src/index.ts` both resolve:
```ts
const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
```
- Replit dev: `NEON_DATABASE_URL` secret → Neon cloud Postgres
- Render/production: `DATABASE_URL` env var → Neon or another Postgres

**Why:** Replit blocks setting `DATABASE_URL` (runtime-managed key). Using a separate `NEON_DATABASE_URL` secret sidesteps the restriction without touching production config.

## Verified
- PostGIS extension available on Neon ✓
- All BullMQ jobs start correctly (email worker, reminder cron, booking expiry) ✓
- `/api/providers` returns seeded Salon Atlas data ✓
