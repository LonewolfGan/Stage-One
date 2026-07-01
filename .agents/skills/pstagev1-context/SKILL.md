---
name: pstagev1-context
description: Project context for PSTAGEV1 — a SaaS beauty booking platform for Moroccan salons/institutes. Load when working on any feature of this project.
---

# PSTAGEV1 — Project Context Skill

## What this project is

PSTAGEV1 is a Moroccan beauty booking SaaS platform (salons + beauty institutes), modeled after Planity (France). Two audiences:
- **Clients**: discover providers, view profiles, book appointments
- **Providers**: manage agenda, staff, services catalog, view analytics

Two provider types: `establishment` (multi-staff salon) and `individual` (solo freelancer).

## Current Phase

**Phase 2 — Backend + Auth** is active. Real API, real DB (PostgreSQL), real JWT auth.

Comptes de test seedés automatiquement :
- Client : `yasmine@client.ma` / `password123`
- Owner Salon Atlas : `atlas@salon.ma` / `password123`
- Owner Institut Élégance : `elegance@salon.ma` / `password123`
- Owner Sara : `sara@domicile.ma` / `password123`
- Owner Hammam Zitoun : `zitoun@hammam.ma` / `password123`

## Design System

**Source de vérité couleurs TypeScript** : `artifacts/pstagev1/src/lib/design-system.ts`

### Tokens CSS (dans `artifacts/pstagev1/src/index.css`)
```
--canvas:         #FBFBFC   ← fond de page
--canvas-pure:    #FFFFFF   ← surfaces flottantes
--surface-2:      #F4F5F7   ← hover, sidebar
--surface-3:      #ECEDF0   ← sélectionné
--surface-4:      #E2E4E8   ← pressed, dividers

--ink:            #0E0E12   ← headlines
--ink-secondary:  #53565C   ← corps de texte
--ink-tertiary:   #8A8D93   ← captions

--accent:         #D4466E   ← brand, sémantique uniquement
--accent-hover:   #B8345B
--accent-tint:    #FBEEF1

--hairline:       rgba(10,10,15,0.08)
--rating:         #E8A33D
```

### Règles absolues
1. ZÉRO `box-shadow` sur card/button/input/panel
2. ZÉRO `translateY` au hover d'une card
3. ZÉRO `font-bold` — poids max 600
4. Tracking négatif obligatoire sur tout texte ≥ 18px
5. Accent rose < 8% de la surface visible
6. Skeleton : `bg-[#ECEDF0] animate-pulse`
7. Pas d'état vide blanc — icône + titre + sous-titre
8. ZÉRO `border-left`/`border-right` coloré, ni color dot

### Typographie (Inter, Google Fonts)
```
display   → 56px / 600 / tracking:-0.025em
heading-l → 36px / 600 / tracking:-0.02em
heading-m → 24px / 600 / tracking:-0.015em
heading-s → 18px / 500 / tracking:-0.01em
body-l    → 17px / 400
body      → 15px / 400
body-s    → 13px / 400
label     → 14px / 500
caption   → 12px / 400
```

## Architecture

```
workspace/
├── artifacts/
│   ├── pstagev1/     ← Frontend React 19 + Vite 7 (port 5000)
│   └── api-server/   ← Backend Express 5 (port 3000)
├── lib/
│   ├── db/           ← Drizzle ORM + schema PostgreSQL
│   ├── api-spec/     ← OpenAPI source de vérité
│   ├── api-client-react/ ← hooks générés Orval
│   └── api-zod/      ← schémas Zod générés
```

## Structure frontend

```
artifacts/pstagev1/src/
├── lib/
│   ├── api.ts              ← appels fetch centralisés
│   ├── auth-store.ts       ← état auth
│   ├── cities.ts           ← villes Maroc
│   ├── design-system.ts    ← tokens couleurs TS
│   ├── motion.ts           ← variants Framer Motion
│   ├── provider-adapter.ts ← API → types frontend
│   ├── socket.ts           ← client socket.io
│   ├── types.ts            ← types partagés
│   └── utils.ts            ← cn(), formatPrice(), etc.
├── components/
│   ├── layout/TopBar.tsx
│   ├── layout/Footer.tsx
│   ├── public/HeroSection.tsx
│   ├── public/ReviewCard.tsx
│   ├── public/StaffSelector.tsx
│   ├── public/TimeSlotGrid.tsx
│   ├── dashboard/DashboardLayout.tsx
│   ├── dashboard/DashboardSidebar.tsx
│   ├── dashboard/WeekCalendar.tsx
│   └── ui/              ← composants atomiques
├── pages/
│   ├── home.tsx, search.tsx, category.tsx
│   ├── provider-profile.tsx, booking.tsx
│   ├── booking-confirmation.tsx, not-found.tsx
│   ├── static-page.tsx, verify-email.tsx
│   ├── auth/ (login.tsx, register.tsx)
│   ├── account/ (bookings.tsx, profile.tsx)
│   └── dashboard/ (agenda, analytics, reservations,
│                    reviews, services, settings,
│                    staff, subscription)
└── App.tsx, index.css, main.tsx
```

## Routes API backend

```
GET/POST /api/auth/*          ← login, register, refresh, me, verify-phone
GET      /api/providers       ← liste prestataires
GET      /api/providers/:slug ← profil + services + staff
GET      /api/providers/:slug/slots ← créneaux disponibles
GET/POST /api/bookings        ← créer/lister réservations
GET      /api/dashboard/*     ← dashboard owner (requireOwner)
GET      /api/reviews/*
POST     /api/webhooks/stripe
GET      /api/health
```

## Backend lib

- `lib/auth.ts` — signToken / verifyToken (jose JWT)
- `lib/stripe.ts` — Stripe (mock si STRIPE_SECRET_KEY absent)
- `lib/redis.ts` — Redis/ioredis (mock si REDIS_URL absent)
- `lib/firebase.ts` — Firebase Admin (mock si creds absentes)
- `lib/email-worker.ts` — worker email (BullMQ ou setTimeout fallback)
- `lib/socket.ts` — socket.io serveur
- `lib/slot-engine.ts` — calcul créneaux disponibles
- `lib/postgis-setup.ts` — setup extension PostGIS

## Data model key points

- `attached_assets/PROJECT_1782420678452.md` — référence complète
- Anti-double-booking : Redis lock → PG transaction → GIST constraint (NE JAMAIS SUPPRIMER)
- Prix : stockés en centimes MAD (`price_cents`), afficher `price_cents / 100 + " MAD"`

## Routing (wouter)

```tsx
import { useParams, useSearch, useLocation } from "wouter";
const [, setLocation] = useLocation();
setLocation('/search');
```

## When working on this project

1. Lire `attached_assets/DESIGN_SYSTEM_1782420727754.md` pour les specs composants
2. Lire `attached_assets/REPLIT_CONTEXT_1782420688230.md` pour les flows UX
3. Lire `attached_assets/PROJECT_1782420678452.md` pour le modèle de données
4. Invoquer le skill `impeccable` avant/après toute modification frontend
5. Après modif OpenAPI : `pnpm --filter @workspace/api-spec run codegen`
6. Logging backend : `req.log` dans routes, `logger` ailleurs, jamais `console.log`
