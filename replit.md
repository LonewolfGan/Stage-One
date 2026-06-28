# PSTAGEV1 — Plateforme de Réservation Beauté (Maroc)

Plateforme SaaS verticale de réservation en ligne pour salons de coiffure et instituts de beauté au Maroc, inspirée de Planity (France). Projet de stage ingénieur (2e année, ENSIASDT).

---

## Quickstart pour une nouvelle équipe

```bash
# 1. Installer les dépendances
pnpm install

# 2. Démarrer le frontend (port auto-assigné par workflow Replit)
pnpm --filter @workspace/pstagev1 run dev

# 3. Démarrer l'API (port auto-assigné)
pnpm --filter @workspace/api-server run dev

# 4. (Phase 2+) Pousser le schéma DB vers la base dev
pnpm --filter @workspace/db run push

# 5. (Phase 2+) Régénérer les hooks API et schémas Zod depuis l'OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

**Variables d'environnement requises** (fichier `.env` à la racine) :
- `DATABASE_URL` — chaîne de connexion PostgreSQL (Phase 2+)
- `SESSION_SECRET` — secret session Express (Phase 2+)

> Phase 1 = **UI only**. Aucune variable env n'est nécessaire pour le frontend.

---

## Architecture monorepo (pnpm workspaces)

```
artifacts-monorepo/
├── artifacts/
│   ├── pstagev1/         ← Frontend React + Vite (package: @workspace/pstagev1)
│   └── api-server/       ← Backend Express 5 (package: @workspace/api-server)
├── lib/
│   ├── api-spec/         ← Spec OpenAPI (source de vérité backend/frontend)
│   ├── api-client-react/ ← React Query hooks générés par Orval
│   ├── api-zod/          ← Schémas Zod générés par Orval
│   └── db/               ← Drizzle ORM schema + migrations
├── scripts/              ← Scripts utilitaires partagés
├── pnpm-workspace.yaml   ← Catalog de versions, overrides
├── tsconfig.base.json    ← Config TypeScript partagée (strict)
└── tsconfig.json         ← Solution file pour les libs composites
```

**Règle de routing** : un reverse proxy global route par path. Le frontend est sur `/`, l'API sur `/api`. Voir `.replit-artifact/artifact.toml` de chaque artifact.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite 7, Wouter (routing SPA), Tailwind CSS v4, shadcn/ui |
| Animations | Framer Motion |
| Dashboard charts | Recharts |
| Dates | date-fns |
| Icônes | Lucide React |
| API client | @tanstack/react-query + hooks générés Orval |
| Backend | Express 5, pino (logging) |
| ORM | Drizzle ORM |
| Base de données | PostgreSQL |
| Validation | Zod (zod/v4), drizzle-zod |
| Codegen | Orval (OpenAPI → React Query + Zod) |
| Build serveur | esbuild (bundle CJS) |
| TypeScript | 5.9, mode strict |
| Node.js | 24 |
| Package manager | pnpm 9 |

---

## Design System — tokens et règles absolues

**Référence** : `attached_assets/DESIGN_SYSTEM_*.md` + `attached_assets/PSTAGEV1-PRD_*.md`

### Palette de tokens
```
--canvas:         #FBFBFC   ← fond de page (jamais #FFFFFF pur en fond)
--canvas-pure:    #FFFFFF   ← surfaces "flottantes" (cards, inputs)
--surface-1:      #FFFFFF   ← cards par défaut
--surface-2:      #F4F5F7   ← hover de card, sidebar dashboard
--surface-3:      #ECEDF0   ← sélectionné, zone dense
--surface-4:      #E2E4E8   ← pressed, dividers structurels

--ink:            #0E0E12   ← headlines (jamais #000000)
--ink-secondary:  #53565C   ← corps de texte
--ink-tertiary:   #8A8D93   ← meta, captions

--accent:         #D4466E   ← CTA primaire, brand mark, liens actifs UNIQUEMENT
--accent-hover:   #B8345B
--accent-tint:    #FBEEF1   ← fond badge actif, ligne sélectionnée

--hairline:       rgba(10,10,15,0.08)   ← bordure card par défaut
--hairline-strong:rgba(10,10,15,0.14)   ← bordure hover

--rating:         #E8A33D   ← étoiles uniquement
```

### Règles absolues (vérifiables par grep)
1. **ZÉRO `box-shadow`** sur card/button/input/panel — seule exception : SearchPill
2. **ZÉRO `translateY` au hover** d'une card
3. **ZÉRO `font-bold`** — poids max 600 (font-semibold)
4. **Tracking négatif** obligatoire sur tout texte ≥ 18px
5. **L'accent rose** sur < 8% de la surface visible d'un écran
6. **Skeleton loading** avec `bg-[#ECEDF0] animate-pulse` (jamais `bg-gray-200`)
7. **Pas d'état vide blanc** — toujours icône + titre + sous-titre

### Typographie
```
display   → 56px / 600 / lh:1.08 / tracking:-0.025em  (1 par page max)
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

### Phase 1 — UI seulement (ACTUELLE)
- Toutes les données viennent de `artifacts/pstagev1/src/lib/mock-data.ts`
- Aucun appel API réel, aucune authentification, aucune base de données
- 3 prestataires mock : Salon Atlas (Marrakech), Institut Élégance (Casablanca), Sara à domicile (Rabat)

### Phase 2 — Backend + Auth
- Brancher les routes API Express sur les hooks React Query générés
- Auth : JWT sessions + middleware Express
- DB : Drizzle ORM + PostgreSQL
- Anti-double-booking : Redis lock → PG transaction → GIST exclusion constraint

### Phase 3 — Paiement + Production
- Intégration paiement (Stripe ou CMI Maroc)
- Dashboard analytics réel
- Notifications email/SMS
- SEO : pages statiques par ville × catégorie

---

## Routes frontend (Wouter)

| Path | Composant | Description |
|------|-----------|-------------|
| `/` | `pages/home.tsx` | Landing page avec hero animé |
| `/search` | `pages/search.tsx` | Résultats + carte interactive (placeholder Phase 1) |
| `/:slug` | `pages/provider-profile.tsx` | Profil public prestataire |
| `/booking/:slug` | `pages/booking.tsx` | Widget de réservation 3 étapes |
| `/dashboard/agenda` | `pages/dashboard/agenda.tsx` | Agenda staff (vue jour) |
| `/dashboard/services` | `pages/dashboard/services.tsx` | Catalogue de prestations |
| `/dashboard/staff` | `pages/dashboard/staff.tsx` | Gestion équipe |
| `/dashboard/analytics` | `pages/dashboard/analytics.tsx` | Stats + graphiques |
| `/auth/register` | `pages/auth-placeholder.tsx` | Placeholder Phase 1 |
| `/auth/login` | `pages/auth-placeholder.tsx` | Placeholder Phase 1 |

---

## Structure des fichiers frontend

```
artifacts/pstagev1/src/
├── lib/
│   └── mock-data.ts              ← données Phase 1, types TypeScript, helpers
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx            ← navbar sticky, modale "Commencer"
│   │   └── Footer.tsx            ← footer light (#FBFBFC)
│   ├── public/
│   │   ├── HeroSection.tsx       ← hero sombre animé + mosaïque photos
│   │   ├── SalonCard.tsx         ← carte prestataire (composant principal)
│   │   ├── ServiceCard.tsx
│   │   ├── PhotoGallery.tsx      ← galerie 2×4 (profil prestataire)
│   │   ├── TimeSlotGrid.tsx      ← grille créneaux horaires
│   │   ├── StaffSelector.tsx     ← chips de sélection collaborateur
│   │   └── ReviewCard.tsx
│   └── dashboard/
│       ├── DashboardSidebar.tsx  ← sidebar Linear-style 220px
│       ├── AgendaView.tsx        ← timeline horaire staff
│       ├── BookingBlock.tsx      ← bloc RDV dans l'agenda
│       └── StatCard.tsx
├── pages/
│   ├── home.tsx
│   ├── search.tsx
│   ├── provider-profile.tsx
│   ├── booking.tsx
│   ├── auth-placeholder.tsx
│   └── dashboard/
│       ├── agenda.tsx
│       ├── services.tsx
│       ├── staff.tsx
│       └── analytics.tsx
├── App.tsx                       ← routing + providers
├── index.css                     ← tokens CSS + shadcn vars
└── main.tsx
```

---

## Données mock (Phase 1)

**Fichier** : `artifacts/pstagev1/src/lib/mock-data.ts`

**Types exportés** : `Provider`, `StaffMember`, `Service`, `BusinessHours`, `TimeSlot`

**Helpers** :
- `generateSlots(date, provider)` → `TimeSlot[]` (~60% de remplissage)
- `getNextAvailable(provider)` → `"Disponible à 14h30"` ou `"lun. 10:00"`

**Prix** : stockés en centimes MAD (`priceCents`). Affichage : `priceCents / 100` → `"180 MAD"`

---

## Modèle de données (Phase 2+)

Référence complète : `attached_assets/PROJECT_1782420678452.md`

Tables principales :
- `providers` (id, type, slug, name, city, category, subscription_plan)
- `staff` (id, provider_id, first_name, speciality)
- `business_hours` (provider_id, day_of_week, open_time, close_time)
- `schedule_blocks` (staff_id, start_at, end_at, reason) — blocages manuels
- `services` (id, provider_id, name, duration_minutes, price_cents)
- `service_staff` (service_id, staff_id) — liaison N:N
- `bookings` (id, client_id, service_id, staff_id, start_at, end_at, status)
- `reviews` (id, booking_id, rating, comment)
- `subscriptions` (provider_id, plan, status)

**Anti-double-booking** (Phase 2, NE JAMAIS SUPPRIMER) :
```sql
-- Contrainte GIST sur bookings (dernier filet de sécurité)
EXCLUDE USING gist (staff_id WITH =, tsrange(start_at, end_at) WITH &&)
WHERE (status != 'cancelled');
```
3 couches de protection : Redis lock → PostgreSQL transaction → GIST constraint.

---

## API (Phase 2+)

Spec OpenAPI : `lib/api-spec/openapi.yaml` — source de vérité unique.

```bash
# Après modification du spec :
pnpm --filter @workspace/api-spec run codegen
# Génère dans :
# lib/api-client-react/src/generated/   ← hooks React Query
# lib/api-zod/src/generated/            ← schémas Zod
```

Logging backend : toujours `req.log` dans les routes, `logger` ailleurs. Jamais `console.log`.

---

## Gotchas importants

- **index.css** : Le scaffold shadcn génère toutes les vars CSS en `red`. Toujours réécrire le `:root` entier avant tout composant ou tout s'affiche en rouge.
- **Google Fonts** : Le `@import url(...)` DOIT être la toute première ligne de `index.css` — PostCSS échoue silencieusement sinon.
- **Wouter routing** : Utiliser `useParams`, `useSearch`, `useLocation` de `wouter`. Jamais `window.location` pour la navigation SPA.
- **pnpm** : Ne jamais `cd` dans un sous-package, toujours `pnpm --filter @workspace/<slug> run <script>`.
- **TypeScript** : `pnpm run typecheck` = source de vérité. Ne pas se fier à l'éditeur si les deux divergent.
- **Ports** : Toujours lire `process.env.PORT` — Replit assigne les ports dynamiquement. Ne jamais hardcoder 3000/8080/etc.
- **BASE_PATH** : Le frontend lit `import.meta.env.BASE_URL` pour les URLs relatives (déjà configuré dans Vite).

---

## User preferences

- Langue UI : **français** (plateforme marocaine)
- Pas d'emojis dans l'UI — seulement icônes Lucide React
- Design : Awwwards-level, Linear/Resend en light mode
- Boutons primaires : **ink `#0C0C0E`** (jamais rose sur les CTAs)
- Accent rose `#D4466E` : max 1 élément par écran, uniquement sémantique (pastille notif, cœur favori)
- Prix en MAD : toujours `priceCents / 100` + "MAD"
- Sections majeures : `py-24` (96px) de séparation

### Règle de processus design (obligatoire)

**À chaque modification du frontend (`artifacts/pstagev1/src/`), le skill `impeccable` doit être invoqué** pour s'assurer que la qualité design est maintenue. Cela inclut : toute création ou modification de composant, page, ou token CSS. Lire `.agents/skills/impeccable/SKILL.md` avant d'implémenter, puis effectuer un audit post-implémentation.

Fichier contexte produit pour `impeccable` : `artifacts/pstagev1/PRODUCT.md`

---

## Références design

- `attached_assets/PROJECT_1782420678452.md` — modèle de données complet et règles métier
- `attached_assets/DESIGN_SYSTEM_*.md` — tokens CSS et specs composants
- `attached_assets/REPLIT_CONTEXT_*.md` — flows UX et structure des pages
- `attached_assets/PSTAGEV1-PRD_*.md` — PRD complet
- `.agents/skills/pstagev1-context/SKILL.md` — context rapide pour les agents
