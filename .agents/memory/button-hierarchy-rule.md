---
name: Button hierarchy rule
description: Couleurs et radius des boutons — rose pill pour les CTAs primaires, 8px pour les secondaires.
---

## Règle actuelle (validée par l'utilisateur)

**Bouton primaire** (confirme/complète l'intention : Réserver, Rechercher, Commencer, Se connecter, Créer un compte, Sauvegarder, Payer) → `background: var(--accent)` (#D4466E), texte blanc, `border-radius: 9999px` (pill).

**Bouton secondaire** (outline, annuler, retour, ghost) → dark ink ou transparent/outline, `border-radius: var(--radius-control)` (8px).

**Toggle / état de sélection** (filtre actif, onglet sélectionné) → dark ink, pas de pill.

**Éléments décoratifs** (badges "Top", "RECOMMANDÉ") → pill autorisé, pas un CTA.

## Ce qui a changé

L'ancienne règle "noir primaire, rose rare" est **abandonnée**. L'utilisateur veut le système de couleurs et de radius actuel :
- Rose = CTA primaire (pas sémantique-rare)
- Pill = forme des boutons d'action (pas interdit)

**Why:** L'utilisateur a explicitement confirmé en juillet 2026 que PRODUCT.md était en désaccord avec ses préférences réelles. Le système actuel de l'app (rose pill) est la référence, pas les anciennes règles.

**How to apply:** Tout nouveau bouton d'action principal → `var(--accent)` + pill. Ne pas écrire de règle "noir primaire" ou "rose rare".
