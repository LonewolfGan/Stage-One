---
name: pstagev1-context
description: Project context for PSTAGEV1 — a SaaS beauty booking platform for Moroccan salons/institutes. Load when working on any feature of this project: UI components, booking flow, dashboard, design tokens, mock data, or backend routes. Contains design system tokens, page structure, UX conventions, and architecture decisions.
---

# PSTAGEV1 — Project Context Skill

## What this project is

PSTAGEV1 is a Moroccan beauty booking SaaS platform (salons + beauty institutes), modeled after Planity (France). Two audiences:
- **Clients**: discover providers, view profiles, book appointments online with payment
- **Providers**: manage agenda, staff, services catalog, view analytics

Two provider types: `establishment` (multi-staff salon) and `individual` (solo freelancer, auto-creates 1 staff member).

## Current Phase

**Phase 1 = UI only** — all data mocked in `artifacts/pstagev1/src/lib/mock-data.ts`. No real API, no DB, no auth. Backend routes are stubbed.

Phase 2 onward: wire up real API routes following the OpenAPI-first workflow.

## Design System — CSS Tokens

### Signature color: Rose #D4547A
```
--accent-rose: #D4547A        → Primary CTAs, active states, selected slots
--accent-rose-hover: #C04268  → Hover state for rose buttons
--accent-rose-light: #FAF0F3  → Selected date/slot background
--accent-rose-border: #F0C4CF → Accent context borders
```

### Never use black for primary buttons — always use rose #D4547A.

### Full palette
```
Canvas: #FFFFFF (--canvas), #FAFAFA (--canvas-subtle), #F5F5F5 (--canvas-muted)
Ink: #1A1A1A (primary text), #6B6B6B (secondary), #9E9E9E (tertiary)
Borders: #F0F0F0 (light), #E0E0E0 (medium), #C4C4C4 (strong)
Rating: #F5A623 (stars only)
Success: #43A047 / Error: #E53935
```

### Typography: Inter (Google Fonts)
- Display hero: 40px, font-semibold, letter-spacing: -0.02em
- Heading: 24px, font-semibold
- Subheading: 18px, font-medium
- Body: 15px, font-normal, color: #6B6B6B
- Caption: 13px, color: #9E9E9E

### Radii: 6px, 8px, 14px, 20px, 9999px (full)
### Shadows: sm (cards), md (elevated cards), xl (modals)

## Critical index.css Rule

The scaffold ships all CSS variables as `red`. You MUST fully rewrite `:root` and `.dark` blocks.
Google Fonts `@import url(...)` MUST be the VERY FIRST LINE of index.css — before all other imports.

## Mock Data (Phase 1)

File: `artifacts/pstagev1/src/lib/mock-data.ts`

Three providers:
1. **Salon Atlas** (establishment, Marrakech, 3 staff: Fatima/Youssef/Sara, 5 services)
2. **Institut Élégance** (establishment, Casablanca, 3 staff: Nadia/Karima/Houda, 5 services)
3. **Sara à domicile** (individual, Rabat, 1 staff: Sara herself, 3 services)

Key helpers:
- `generateSlots(date, provider)` — returns TimeSlot[] with ~60% fill rate
- `getNextAvailable(provider)` — returns "Disponible à 14h30" or "lun. 10:00"
- Prices: stored in `priceCents` (MAD centimes), display by dividing by 100: "180 MAD"

## Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | HomePage | Landing with SearchPill + CategoryGrid |
| `/search` | SearchPage | Results list + map placeholder |
| `/:slug` | ProviderProfilePage | Public profile + services + reviews |
| `/booking/:slug` | BookingPage | Service → staff → time → confirmation |
| `/dashboard/agenda` | AgendaPage | Staff timeline with booking blocks |
| `/dashboard/services` | ServicesPage | Service catalog management |
| `/dashboard/staff` | StaffPage | Staff management |
| `/dashboard/analytics` | AnalyticsPage | Stats + recharts bar chart |

## Key UX Innovations vs Planity

1. **SalonCard "Disponible à X"**: Shows next available time in rose prominently — not just an anonymous slot grid.
2. **Booking widget 2-col desktop**: Left = selection (service → staff → date/time), Right = live summary card.
3. **Dashboard**: Linear-inspired sidebar with rose left-border on active item.
4. **Rose badge "Populaire"**: On the most popular service of each provider.

## Routing (wouter)

```tsx
// Always use wouter hooks:
import { useParams, useSearch, useLocation } from "wouter";

// Navigate programmatically:
const [, setLocation] = useLocation();
setLocation('/search');

// Get slug:
const { slug } = useParams();

// Get query params:
const search = useSearch(); // returns "?category=coiffeur&city=Marrakech"
```

## Component Organization

```
src/
├── lib/mock-data.ts          — all mock data + helpers
├── components/
│   ├── layout/TopBar.tsx     — sticky nav with logo + categories
│   ├── layout/Footer.tsx
│   ├── public/SalonCard.tsx  — core card for search results
│   ├── public/ServiceCard.tsx
│   ├── public/PhotoGallery.tsx
│   ├── public/TimeSlotGrid.tsx
│   ├── public/StaffSelector.tsx
│   └── dashboard/
│       ├── DashboardSidebar.tsx  — 240px Linear-style sidebar
│       ├── AgendaView.tsx
│       └── StatCard.tsx
└── pages/ ...
```

## Backend (Phase 2+)

Data model lives in `attached_assets/PROJECT_1782420678452.md`. Key tables:
- `providers`, `staff`, `business_hours`, `schedule_blocks`, `services`, `service_staff`
- `bookings` (anti-double-booking with GIST exclusion constraint — NEVER remove)
- `reviews`, `subscriptions`

Anti-double-booking: 3 layers — Redis lock → PG transaction → GIST constraint.
Slot engine: BusinessHours − ScheduleBlocks − Bookings = available slots. Redis cache 5min TTL.

## When working on this project

1. Read `attached_assets/DESIGN_SYSTEM_1782420727754.md` for pixel-perfect component specs
2. Read `attached_assets/REPLIT_CONTEXT_1782420688230.md` for UX flows and component hierarchy
3. Read `attached_assets/PROJECT_1782420678452.md` for data models and business rules
4. All Phase 1 UI work goes in `artifacts/pstagev1/src/`
5. Phase 2+ backend work goes in `artifacts/api-server/src/routes/` + `lib/db/src/schema/`
6. Run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
