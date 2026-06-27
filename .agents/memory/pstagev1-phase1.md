---
name: PSTAGEV1 Phase 1 build
description: Key decisions and gotchas for the PSTAGEV1 Awwwards-quality beauty booking platform
---

## Workflow
- Workflow name: `PSTAGEV1` (configured via configureWorkflow, NOT managed artifact workflow)
- Command: `PORT=21962 BASE_PATH=/ pnpm --filter @workspace/pstagev1 run dev`
- Port: 21962, previewPath: `/`
- The artifact.toml declares `artifacts/pstagev1: web` but the Replit managed workflow system did not register it — use `configureWorkflow` instead if restarting

## Design system
- Accent: `#D4466E` (--accent), never black for primary CTAs
- All shadows disabled globally: `* { box-shadow: none !important; }`
- No translateY on card hover, no font-bold (max font-semibold = 600)
- Responsive grid classes live in `index.css` (not Tailwind classes): `home-cases-grid`, `home-split-grid`, `home-salons-grid`, `dash-stat-grid`, `dash-chart-grid`, `dash-staff-grid`, `footer-grid`
- `useBreakpoint()` from `@/hooks/use-mobile` gives `{ isMobile, isLg }` — used throughout

## Responsive corrections applied (Phase 3)
- `home.tsx`: All sections (3–8) use `isMobile ? <small> : <large>` for paddingBlock/paddingInline; Section 4 image uses aspectRatio instead of fixed height on mobile
- `services.tsx`: Table wrapped in `<div style={{ overflowX: "auto" }}>` with `minWidth: 600` on table
- `DashboardLayout.tsx`: Page header title container has `minWidth: 0` for proper flex truncation
- `index.css`: `ds-dash-main` responsive padding (16px→24px→32px), `ds-dash-page-header` has flex-wrap + gap

## Framer Motion animation system (completed)
- Shared variants: `src/lib/motion.ts` — exports `fadeUp`, `fadeIn`, `staggerContainer`, `pageFade`, `cardHover`, `buttonTap`
- Scroll-triggered helpers: `src/components/ui/Reveal.tsx` — exports `Reveal`, `Stagger`, `StaggerItem`
- `Stagger` renders as `motion.div` and accepts `className`/`style` directly (CSS grid classes work fine on it)
- Page transitions: `AnimatePresence` wrapping routes in `App.tsx` with `pageFade` variant (250ms in, 150ms out)
- Design rule: ZERO `translateY` in hover animations — only `scale` allowed per design system
- Mobile filter drawer in `search.tsx` uses `AnimatePresence` + spring `y:"100%"→0` slide-up
- Analytics progress bars animate `width: 0 → pct%` via `whileInView` (triggered once on scroll into view)
- Staff cards use `staggerContainer` + `fadeUp` variants for staggered entrance

## Pre-existing TS warning (non-blocking)
- `Badge.tsx` vs `badge.tsx` casing conflict — pre-existing, unrelated to animation work
- Both files exist; shadcn-generated `badge.tsx` and custom `Badge.tsx` — do not delete either without checking all imports
- `agenda.tsx` Badge variant `"accent"` type error — pre-existing

**Why:** The project uses inline styles (not Tailwind responsive classes) because the design system is very specific. Responsive behavior is handled via `isMobile`/`isLg` JS hooks and CSS classes in index.css.
