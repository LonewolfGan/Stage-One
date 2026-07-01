---
name: Button hierarchy rule
description: Which buttons are black vs rose — corrected: primary CTAs are BLACK, rose is semantic only.
---

## Rule (CORRECTED — previous memory was WRONG)

**Primary action button** (the one that confirms/completes the user's intent: Réserver, Rechercher, Se connecter, Créer mon compte, Sauvegarder, Réserver maintenant, Commencer, Payer maintenant, Choisir, Rechercher, Réinitialiser les filtres) → `background: #0C0C0E` (ink-black), text white. Hover: `opacity: 0.80` or `rgba(12,12,14,0.80)`.

**Rose/accent (#D4466E) = SEMANTIC ONLY**, never a primary CTA. Allowed uses:
- Current-day indicator pill (calendar)
- Active step progress bar (home.tsx how-it-works)
- Password rule met indicator (register)
- Toggle switch ON state (settings)
- Notification dot
- Star ratings (use `var(--rating)` = #E8A33D, not accent)
- "Tout voir" text link (secondary link, not a button)

**Secondary button** (outline, cancel, ghost, back) → dark ink, outline, or `var(--surface-2)` background.

## Why

PRODUCT.md (the canonical design source of truth) explicitly states: "Primary buttons are black (#0C0C0E). Rose (#D4466E) = semantic only." The previous memory had this inverted (claiming rose = primary CTA). That was wrong and has been corrected across all pages.

## How to apply

Any NEW button that is the primary confirming action → `background: "#0C0C0E"`, color white, hover opacity 0.80.
Any new semantic indicator (active state, status badge, date marker) → `var(--accent)` is fine.
Never put rose on a button that triggers a navigation or form submission.
