# Product

## Register

product

## Users

Two distinct groups:

**Clients (end consumers)**: Moroccan adults (urban, mobile-first, 25–45) searching for beauty appointments — hairdressers, barbers, nail salons, institutes, wellness. They browse from their phone, often at the last minute or during commute. They want speed, trust signals (verified profiles, reviews, photos), and frictionless booking without calling. They're comparing several providers before choosing.

**Providers (salon/institute owners and independent professionals)**: Moroccan beauty professionals managing their business. Two subtypes: establishments with staff (salons, institutes) and solo independents working from home or on-site. They need an agenda they trust, a booking widget clients can use 24/7, and basic analytics to grow. They're often non-technical; clarity and reliability are their primary needs.

## Product Purpose

PSTAGEV1 is a vertical SaaS booking platform for hair salons and beauty institutes in Morocco — the local equivalent of Planity (France). It exists to eliminate the phone-tag loop between beauty clients and providers. Success looks like: a client books a slot in under 60 seconds without calling; a provider wakes up to a full agenda they didn't have to manage manually.

## Brand Personality

Warm · Confident · Accessible

The platform should feel welcoming and trustworthy — a product clients enjoy using, not just a tool. Tone: clear, direct, friendly. Visually: rose accent as the primary brand color, clean white canvas, generous border radius.

Reference feel: Planity FR (booking UX), Fresha (warmth and accessibility), with more editorial refinement.

## Design System

### Colors

- **Primary CTA**: `var(--accent)` — `#D4466E` (rose). All primary action buttons use rose.
- **Canvas**: `#FBFBFC` — page background (never pure white)
- **Canvas pure**: `#FFFFFF` — floating surfaces (cards, inputs, modals)
- **Ink**: `#0C0C0E` — headings and high-emphasis text
- **Ink secondary**: `rgba(12,12,14,0.65)` — body text
- **Ink tertiary**: `rgba(12,12,14,0.45)` — meta, captions
- **Accent tint**: `#FBEEF1` — badge backgrounds, subtle rose fills
- **Rating**: `#E8A33D` — stars only

### Border Radius

- `--radius-chip`: 4px — micro tags
- `--radius-tag`: 6px — small tags
- `--radius-control`: 8px — inputs, small buttons
- `--radius-card`: 12px — cards
- `--radius-panel`: 16px — modals, panels
- `--radius-full`: 9999px — pill buttons, badges, avatar chips

Primary CTA buttons use `--radius-full` (pill shape). Secondary/outline buttons use `--radius-control` (8px).

### Typography

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

### Absolute rules

1. **ZÉRO `box-shadow`** sur card/button/input/panel
2. **ZÉRO `translateY` au hover** d'une card
3. **ZÉRO `font-bold`** — poids max 600 (font-semibold)
4. **Tracking négatif** obligatoire sur tout texte ≥ 18px
5. **Skeleton** : `bg-[#ECEDF0] animate-pulse`
6. **Pas d'état vide blanc** — toujours icône + titre + sous-titre
7. **ZÉRO `border-left`/`border-right` coloré** ni color dot
8. **Nested cards** — jamais

## Anti-references

- Gradients décoratifs (seulement autorisés pour la lisibilité sur images)
- Glassmorphism par défaut
- Glow effects / drop shadows sur éléments UI
- Blue (#2563EB, #3B82F6) dans la palette — interdit sauf dot localisation Leaflet

## Design Principles

1. **Rose est primaire.** `var(--accent)` #D4466E est la couleur des CTAs et états actifs.
2. **Restraint over decoration.** Chaque élément visuel doit gagner sa place.
3. **The tool disappears into the task.** Sur le flow de réservation et le dashboard, zéro ornement.
4. **Trust through density.** Photos, avis, badges vérifiés, prix réels — en premier plan.
5. **Consistency is the feature.** Même radius, même poids d'icône, même pattern sur tous les écrans.

## Accessibility & Inclusion

- Target WCAG AA (4.5:1 body text, 3:1 large text)
- Arabic language support planned for Phase 3 (RTL layout consideration)
- Primary users are mobile-first; touch targets ≥ 44px required
- Reduced motion: respect `prefers-reduced-motion` on all animations
