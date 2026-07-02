# PSTAGEV1 — Plateforme de Réservation Beauté (Maroc)

Plateforme SaaS verticale de réservation en ligne pour salons de coiffure et instituts de beauté au Maroc, inspirée de Planity (France). Projet de stage ingénieur (2e année, ENSIASDT).

---

## Quickstart

```bash
# 1. Installer les dépendances
pnpm install

# 2. Démarrer le frontend (port 5000)
pnpm --filter @workspace/pstagev1 run dev

# 3. Démarrer l'API (port 3000)
pnpm --filter @workspace/api-server run dev

# 4. Pousser le schéma DB vers la base dev
pnpm --filter @workspace/db run push

# 5. Régénérer les hooks API et schémas Zod depuis l'OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

**Secrets requis** (gérés via Replit Secrets) :
- `DATABASE_URL` — chaîne de connexion PostgreSQL (auto-provisionnée)
- `SESSION_SECRET` — secret session Express
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — paiements (optionnel, mock si absent)
- `REDIS_URL` — locking distribué (optionnel, mock si absent)
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` — OTP téléphone (optionnel, mock si absent)

---

## Architecture monorepo (pnpm workspaces)

```
workspace/
├── artifacts/
│   ├── pstagev1/         ← Frontend React + Vite (@workspace/pstagev1)
│   └── api-server/       ← Backend Express 5 (@workspace/api-server)
├── lib/
│   ├── api-spec/         ← Spec OpenAPI (source de vérité)
│   ├── api-client-react/ ← Hooks React Query générés par Orval
│   ├── api-zod/          ← Schémas Zod générés par Orval
│   └── db/               ← Drizzle ORM schema + migrations
├── scripts/              ← post-merge.sh (pnpm install + db push)
├── pnpm-workspace.yaml   ← Catalog de versions, overrides
└── tsconfig.json         ← Solution file TypeScript
```

**Routing** : frontend sur `/`, API sur `/api`. Vite proxie `/api` → `localhost:3000`.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 7, Wouter, Tailwind CSS v4, shadcn/ui |
| Animations | Framer Motion (`lib/motion.ts`) |
| Charts | Recharts |
| Dates | date-fns |
| Icônes | Lucide React |
| API client | @tanstack/react-query |
| Backend | Express 5, pino |
| ORM | Drizzle ORM |
| Base de données | PostgreSQL (Replit natif) |
| Validation | Zod v4, drizzle-zod |
| Codegen | Orval (OpenAPI → hooks + Zod) |
| Build serveur | esbuild |
| TypeScript | 5.9 strict |
| Node.js | 24 |
| Package manager | pnpm 9 |

---

## Design System — tokens et règles absolues

**Référence canonique** :
- `attached_assets/DESIGN_SYSTEM_1782420727754.md` — tokens CSS et specs composants
- `attached_assets/PSTAGEV1-PRD_1782594133959.md` — PRD complet
- `artifacts/pstagev1/src/lib/design-system.ts` — source de vérité couleurs en TypeScript

### Palette de tokens CSS
```
--canvas:         #FBFBFC   ← fond de page (jamais #FFFFFF pur)
--canvas-pure:    #FFFFFF   ← surfaces flottantes (cards, inputs)
--surface-2:      #F4F5F7   ← hover de card, sidebar
--surface-3:      #ECEDF0   ← sélectionné, zone dense
--surface-4:      #E2E4E8   ← pressed, dividers

--ink:            #0E0E12   ← headlines (jamais #000000)
--ink-secondary:  #53565C   ← corps de texte
--ink-tertiary:   #8A8D93   ← meta, captions

--accent:         #D4466E   ← CTA primaire (boutons d'action)
--accent-hover:   #B8345B
--accent-tint:    #FBEEF1   ← fond badge actif

--hairline:       rgba(10,10,15,0.08)
--hairline-strong:rgba(10,10,15,0.14)

--rating:         #E8A33D   ← étoiles uniquement
```

### Règles absolues
1. **ZÉRO `box-shadow`** sur card/button/input/panel
2. **ZÉRO `translateY` au hover** d'une card
3. **ZÉRO `font-bold`** — poids max 600 (font-semibold)
4. **Tracking négatif** obligatoire sur tout texte ≥ 18px
5. **CTA primaire = `var(--accent)` #D4466E** — boutons d'action principaux en rose pill (`border-radius: 9999px`)
6. **Skeleton** : `bg-[#ECEDF0] animate-pulse` (jamais `bg-gray-200`)
7. **Pas d'état vide blanc** — toujours icône + titre + sous-titre
8. **ZÉRO `border-left`/`border-right` coloré** (one-side border) ni color dot

### Typographie
```
display   → 56px / 600 / lh:1.08 / tracking:-0.025em
heading-l → 36px / 600 / lh:1.15 / tracking:-0.02em
heading-m → 24px / 600 / lh:1.20 / tracking:-0.015em
heading-s → 18px / 500 / lh:1.30 / tracking:-0.01em
body-l    → 17px / 400 / lh:1.55
body      → 15px / 400 / lh:1.55
body-s    → 13px / 400 / lh:1.45
label     → 14px / 500 / lh:1
caption   → 12px / 400 / lh:1.4 / tracking:+0.01em
```

---

## Phases du projet

### Phase 2 — Backend + Auth (ACTUELLE)
- Auth JWT via `/api/auth` (bcrypt + jose). Comptes de test dans le seed.
- 4 prestataires seedés : Salon Atlas, Institut Élégance, Sara à domicile, Hammam Zitoun
- Booking expiry job, email worker, socket.io (temps réel)

### Phase 3 — Paiement + Production
- Stripe (code présent, mock si `STRIPE_SECRET_KEY` absent)
- Notifications email/SMS réelles (SMTP)
- SEO : pages statiques par ville × catégorie

---

## Routes frontend (Wouter)

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/search` | Résultats de recherche |
| `/categorie/:slug` | Catégorie |
| `/:slug` | Profil prestataire |
| `/booking/:slug` | Réservation 3 étapes |
| `/booking-confirmation` | Confirmation |
| `/auth/login` | Connexion |
| `/auth/register` | Inscription |
| `/account/bookings` | Mes réservations (client) |
| `/account/profile` | Mon profil |
| `/verify-email` | Vérification email |
| `/dashboard/agenda` | Agenda (staff view) |
| `/dashboard/reservations` | Vue semaine |
| `/dashboard/services` | Catalogue prestations |
| `/dashboard/staff` | Gestion équipe |
| `/dashboard/analytics` | Stats |
| `/dashboard/reviews` | Avis |
| `/dashboard/settings` | Paramètres prestataire |
| `/dashboard/subscription` | Abonnement |
| `/page/:slug` | Pages statiques (CGU, etc.) |

---

## Structure des fichiers frontend

```
artifacts/pstagev1/src/
├── lib/
│   ├── api.ts              ← appels fetch centralisés
│   ├── auth-store.ts       ← état auth (Zustand-like)
│   ├── cities.ts           ← liste villes Maroc
│   ├── design-system.ts    ← tokens couleurs TypeScript
│   ├── motion.ts           ← variants Framer Motion partagés
│   ├── provider-adapter.ts ← adaptateur API → types frontend
│   ├── socket.ts           ← client socket.io
│   ├── types.ts            ← types partagés
│   └── utils.ts            ← cn(), formatPrice(), etc.
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx      ← navbar sticky
│   │   └── Footer.tsx
│   ├── public/
│   │   ├── HeroSection.tsx ← hero + search pill
│   │   ├── ReviewCard.tsx
│   │   ├── StaffSelector.tsx
│   │   └── TimeSlotGrid.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx ← layout + sidebar + notifs
│   │   ├── DashboardSidebar.tsx
│   │   └── WeekCalendar.tsx
│   └── ui/                 ← composants atomiques (button, input, etc.)
├── pages/
│   ├── home.tsx
│   ├── search.tsx
│   ├── category.tsx
│   ├── provider-profile.tsx
│   ├── booking.tsx
│   ├── booking-confirmation.tsx
│   ├── not-found.tsx
│   ├── static-page.tsx
│   ├── verify-email.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── account/
│   │   ├── bookings.tsx
│   │   └── profile.tsx
│   └── dashboard/
│       ├── agenda.tsx
│       ├── analytics.tsx
│       ├── reservations.tsx
│       ├── reviews.tsx
│       ├── services.tsx
│       ├── settings.tsx
│       ├── staff.tsx
│       └── subscription.tsx
├── App.tsx                 ← routing + providers
├── index.css               ← tokens CSS + Tailwind
└── main.tsx
```

---

## Modèle de données

Référence complète : `attached_assets/PROJECT_1782420678452.md`

Tables : `providers`, `staff`, `business_hours`, `schedule_blocks`, `services`, `service_staff`, `bookings`, `reviews`, `subscriptions`, `notifications`, `email_verification_tokens`, `users`

**Anti-double-booking (NE JAMAIS SUPPRIMER)** :
```sql
EXCLUDE USING gist (staff_id WITH =, tsrange(start_at, end_at) WITH &&)
WHERE (status != 'cancelled');
```
3 couches : Redis lock → PG transaction → GIST constraint.

---

## API

Spec OpenAPI : `lib/api-spec/openapi.yaml` — source de vérité unique.

```bash
# Après modification du spec :
pnpm --filter @workspace/api-spec run codegen
```

Logging backend : `req.log` dans les routes, `logger` ailleurs. Jamais `console.log`.

Comptes de test (seedés automatiquement) :
- Client : `yasmine@client.ma` / `password123`
- Owner Salon Atlas : `atlas@salon.ma` / `password123`
- Owner Institut Élégance : `elegance@salon.ma` / `password123`
- Owner Sara : `sara@domicile.ma` / `password123`
- Owner Hammam Zitoun : `zitoun@hammam.ma` / `password123`

---

## Gotchas importants

- **index.css** : Le `:root` entier doit être réécrit (shadcn génère tout en rouge par défaut).
- **Google Fonts** : `@import url(...)` DOIT être la première ligne de `index.css`.
- **Wouter** : utiliser `useParams`, `useSearch`, `useLocation`. Jamais `window.location`.
- **pnpm** : toujours `pnpm --filter @workspace/<slug> run <script>`, jamais `cd`.
- **TypeScript** : `pnpm run typecheck` = source de vérité.
- **Ports** : lire `process.env.PORT`. Ne jamais hardcoder.
- **BASE_PATH** : le frontend lit `import.meta.env.BASE_URL`.

---

## User preferences

- Langue UI : **français** (plateforme marocaine)
- Pas d'emojis dans l'UI — seulement icônes Lucide React
- Design : Awwwards-level, Linear/Resend en light mode
- Boutons primaires : `var(--accent)` #D4466E, forme pill (`border-radius: 9999px`)
- Radius boutons secondaires : `--radius-control` (8px), pas pill
- Prix en MAD : `priceCents / 100` + "MAD"
- Sections majeures : `py-24` (96px) de séparation

### Règle de processus design (obligatoire)

**À chaque modification du frontend, le skill `impeccable` doit être invoqué** pour maintenir la qualité design. Lire `.agents/skills/impeccable/SKILL.md` avant d'implémenter.

Contexte produit : `artifacts/pstagev1/PRODUCT.md`

---

## Références

- `attached_assets/PROJECT_1782420678452.md` — modèle de données et règles métier
- `attached_assets/DESIGN_SYSTEM_1782420727754.md` — tokens CSS et specs composants
- `attached_assets/REPLIT_CONTEXT_1782420688230.md` — flows UX
- `attached_assets/PSTAGEV1-PRD_1782594133959.md` — PRD complet
- `.agents/skills/pstagev1-context/SKILL.md` — context rapide pour les agents
