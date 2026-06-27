---
name: UI component casing convention
description: How to resolve and avoid the Button/button, Badge/badge, Input/input TypeScript TS1149 casing conflict.
---

## The rule

Custom design-system components live in `src/components/ui/` with PascalCase names that do NOT conflict with shadcn lowercase files:

| File | Import path | Used by |
|------|-------------|---------|
| `DSButton.tsx` | `@/components/ui/DSButton` | Pages (booking, dashboard) |
| `Badge.tsx` | `@/components/ui/Badge` | Dashboard pages |
| `Input.tsx` | `@/components/ui/Input` | (currently unused by pages) |
| `button.tsx` | `@/components/ui/button` | shadcn internals (alert-dialog, calendar, carousel, sidebar…) |
| `input.tsx` | `@/components/ui/input` | shadcn internals (input-group, sidebar) |

**Why:** TypeScript TS1149 fires when `src/**/*` includes both `Button.tsx` and `button.tsx`. Deleting `badge.tsx` (shadcn, unused) and renaming `Button.tsx` → `DSButton.tsx` resolved all casing conflicts.

**How to apply:** If you add a new custom component that conflicts with a shadcn one, name it `DS<Name>.tsx`. Never import our DS badge/button from shadcn-style lowercase paths or vice versa. The tsconfig has `forceConsistentCasingInFileNames: false` as an additional safety override.
