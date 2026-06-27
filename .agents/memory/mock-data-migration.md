---
name: Mock data migration
description: Status of Phase 1 → Phase 2 mock-data removal; which patterns to use for real API data.
---

## Status (completed)

`artifacts/pstagev1/src/lib/mock-data.ts` — **DELETED**. All data comes from the real API.

## Pattern used throughout

```typescript
// In pages — fetch with React Query
const { data: rawProviders } = useQuery({
  queryKey: ["providers", ...],
  queryFn: () => api.searchProviders({ ... }),
  staleTime: 60_000,
});
// Adapt API shape → internal Provider type
const providers = adaptProviderList(rawProviders ?? []);
```

For provider detail: `api.getProvider(slug)` → `adaptProvider(raw)`.
For dashboard: `api.getDashboardProvider()`, `api.getDashboardBookings({ date })`, `api.getAnalytics()`.

## Auth situation

Dashboard endpoints (`/api/dashboard/*`) return 401 when no session cookie present. This is expected. Seed accounts: `atlas@salon.ma / password123` (owner), `yasmine@client.ma / password123` (client).

**Why:** Phase 2 wires real auth (JWT session). For Phase 1/2 handoff, dashboard pages show empty states gracefully when not authenticated.

## Deleted dead files

- `src/lib/mock-data.ts` — gone
- `src/pages/auth-placeholder.tsx` — gone (replaced by real `auth/login.tsx`, `auth/register.tsx`)
- `src/components/ui/badge.tsx` (shadcn, never imported by any file)
- `src/components/ui/Input.tsx` (custom, never imported by any page)
