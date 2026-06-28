---
name: Button hierarchy rule
description: Which buttons are rose vs dark — corrected from earlier "ink everywhere" preference.
---

## Rule (current, post-correction-prompt)

**Primary action button** (the one that confirms/completes the user's intent on a screen: Réserver, Rechercher, Se connecter, Créer mon compte, Sauvegarder, Réserver maintenant, Commencer, Payer maintenant) → `background: var(--accent)` (#D4466E), text white.

**Secondary button** (outline, cancel, ghost, back) → dark ink or transparent/outline.

**Toggle / selection state** (active filter chip, selected tab, selected duration option) → dark ink is fine — these are UI state indicators, not CTAs.

**Decorative elements** (badges like "Top", "RECOMMANDÉ", dots, pins) → any color, not CTAs.

## Implementation

- `index.css` `.ds-btn-primary` → `background-color: var(--accent)` + hover `var(--accent-hover)`. This propagates to ALL uses of `Button variant="primary"` across the codebase (booking, dashboard, account pages).
- Inline buttons (auth, settings, category, search cards, provider-profile, not-found, verify-email) → edited individually.

**Why:** Correction prompt (attached_assets) explicitly required rose for primary CTA. This overrides the earlier replit.md preference of "ink #0C0C0E jamais rose sur les CTAs". When the user says "respecte ce prompt à la lettre", the prompt overrides previous stored preferences.

**How to apply:** Any new button that is the primary confirming action → var(--accent). Navigation toggles, filter controls, selection states → dark is fine.
