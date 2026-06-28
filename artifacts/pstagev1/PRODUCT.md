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

Precise · Restrained · Confident

The platform should feel like a premium tool that happens to be beautiful, not a beautiful thing that happens to be functional. Tone: clear and direct, no fluff. Visually: black ink on white canvas, accent used surgically.

Reference feel: Linear (product dashboard), Resend (developer tool precision in a consumer product), Planity FR (domain context but with more editorial restraint).

## Anti-references

- Generic SaaS landing page: centered hero + badge pill + grey subtitle + floating search bar
- Pill-radius on CTA buttons (rounded-full on action buttons — only tags and badges earn pill shape)
- Gradients used decoratively (acceptable only for image text legibility overlays)
- Glassmorphism as default (backdrop-filter/blur on decorative cards — acceptable only for the floating pill navbar)
- Nested cards (card inside a card — never)
- Glow effects / drop shadows on UI elements
- Multiple simultaneous rose/accent elements on screen (max 1 visible at any moment)
- Rose on primary CTAs — primary buttons are black (#0C0C0E), rose is for rare brand moments only
- Blue (#2563EB, #3B82F6) appearing in the UI palette — off-brand, only allowed inside the Leaflet map for the user-location dot
- Fresha / Booksy clone aesthetic (overly warm, card-heavy, busy)

## Design Principles

1. **Black is primary.** Every CTA button, active state, and emphasis is #0C0C0E. Rose (#D4466E) is the single chromatic accent — one element per screen, never on a primary action, never as a background fill.
2. **Restraint over decoration.** Every visual element must earn its place. If removing it makes the page cleaner without losing information, remove it.
3. **The tool disappears into the task.** On the booking flow and dashboard, zero ornamentation. The interface should feel invisible — the appointment is the hero, not the UI.
4. **Trust through density.** Moroccan beauty clients trust what they can verify: photos, reviews, verified badges, real prices. Surface these first; don't bury them behind progressive disclosure.
5. **Consistency is the feature.** Every button shape, every icon weight, every border radius must be the same pattern across all screens. Inconsistency reads as low-quality.

## Accessibility & Inclusion

- Target WCAG AA (4.5:1 body text, 3:1 large text)
- Arabic language support planned for Phase 3 (RTL layout consideration)
- Primary users are mobile-first; touch targets ≥ 44px required
- Reduced motion: respect `prefers-reduced-motion` on all animations
