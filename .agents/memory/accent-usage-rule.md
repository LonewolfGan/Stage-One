---
name: Accent color usage rule
description: The rose accent #D4466E must be used very sparingly, like Linear uses its accent — only on the single most important interactive element per screen.
---

The accent `#D4466E` (and `--accent-tint` / `--accent-hover`) must appear on **at most one focal point per screen** — typically only the primary CTA button. Never fill section backgrounds, borders, overline labels, or multiple elements with accent simultaneously.

**Why:** The user explicitly confirmed this during design review: "on utilise le rose comme accent color but very scarce comme les sites comme Linear le fait avec son couleur d'accent très rare." A section with accent background + accent border + accent overline + accent button is too much — it dilutes the impact of the brand color.

**How to apply:**
- Section backgrounds → `var(--surface-2)` or `var(--canvas)`, never `var(--accent-tint)`
- Borders → `var(--hairline)` or `var(--hairline-strong)`, not accent-colored
- Overline/label text → `var(--ink-tertiary)`, not `var(--accent)`
- The ONE accent touch per section → the primary button only (`backgroundColor: "var(--accent)"`)
- If a section already has an accent button, no other element in that section should use accent color
