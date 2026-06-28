---
name: Frontend impeccable rule
description: Any frontend change to pstagev1 must invoke the impeccable skill for design quality assurance.
---

# Règle : impeccable obligatoire sur toute modif frontend

**Déclencheur** : toute modification dans `artifacts/pstagev1/src/` — composant, page, token CSS, layout.

**Protocole** :
1. Lire `.agents/skills/impeccable/SKILL.md` **avant** d'implémenter.
2. Passer le fichier `artifacts/pstagev1/PRODUCT.md` comme contexte produit (register: product).
3. Après implémentation, faire un audit rapide des règles absolues (voir ci-dessous).
4. Corriger toute violation avant de livrer.

**Règles absolues à vérifier (grep-vérifiables)** :
- ZÉRO `box-shadow` sur card/button/input/panel (sauf SearchPill)
- ZÉRO `translateY` au hover d'une card
- ZÉRO `font-bold` (font-weight max 600)
- Tracking négatif obligatoire sur tout texte ≥ 18px
- Boutons primaires : `var(--ink)` / `#0C0C0E` — jamais `var(--accent)` / `#D4466E`
- Accent rose : max 1 élément par écran, uniquement sémantique (pastille notif, cœur favori, données graphiques)
- Skeleton loading : `bg-[#ECEDF0] animate-pulse` (jamais `bg-gray-200`)
- Pas d'état vide blanc : toujours icône + titre + sous-titre

**Why** : L'utilisateur a explicitement demandé que ce processus soit systématique pour maintenir le niveau Awwwards du design à chaque évolution du codebase.

**How to apply** : Applicable dès la première question de la session si elle concerne le frontend PSTAGEV1. Ne pas attendre que l'utilisateur le rappelle.
