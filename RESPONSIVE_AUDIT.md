# RESPONSIVE AUDIT — PSTAGEV1

> Généré le 26 juin 2026. Cible : 5 largeurs — 375px / 768px / 1024px / 1440px / 1920px.
> Stack : React 18, Vite 7, Tailwind v4, inline styles prédominants (pas de classes sm:/md:/lg:).
> Ce rapport documente les bugs avant correction.

---

## Inventaire complet des fichiers

| Fichier | Rôle | Classes responsive | Patterns à risque |
|---|---|---|---|
| `TopBar.tsx` | Layout — nav publique | ❌ aucune | Nav links toujours visibles, overflow à 375px |
| `Footer.tsx` | Layout — pied de page public | ❌ aucune | `repeat(4,1fr)` fixe |
| `DashboardLayout.tsx` | Layout — dashboard admin | ❌ aucune | Sidebar `width:220px` toujours visible |
| `DashboardSidebar.tsx` | Composant sidebar (non utilisé) | ❌ aucune | `width:224px` fixe |
| `HeroSection.tsx` | Section hero accueil | ❌ aucune | Barre de recherche 3 colonnes inline, overflow mobile |
| `PhotoGallery.tsx` | Composant galerie photos | ❌ aucune | `repeat(4,1fr)` fixe, `height:360px` fixe |
| `TimeSlotGrid.tsx` | Grille créneaux horaires | ❌ aucune | `repeat(4,1fr)` fixe |
| `SalonCard.tsx` | Card prestataire | ✅ OK | Pas de layout fixe |
| `ServiceCard.tsx` | Card prestation | ✅ OK | Largeur controllée par parent |
| `ReviewCard.tsx` | Card avis | ✅ OK | — |
| `StaffSelector.tsx` | Sélecteur staff | ✅ OK | `overflowX:auto` présent |
| `StatCard.tsx` | Card stat dashboard | ✅ OK | Largeur controllée par parent |
| `BookingBlock.tsx` | Bloc calendrier | ✅ OK | — |
| `home.tsx` | Page accueil | ❌ aucune | Collage absolument positionné (px fixes), `repeat(2,1fr)`, `repeat(3,1fr)`, `1fr 1fr` |
| `search.tsx` | Page recherche | ❌ aucune | Sidebar filtre `width:256px` fixe, `repeat(12,1fr)` avec spans |
| `provider-profile.tsx` | Fiche prestataire | ❌ aucune | `repeat(12,1fr)` avec `1/9` + `9/13` |
| `booking.tsx` | Page réservation | ❌ aucune | `repeat(12,1fr)` avec `1/9` + `9/13` |
| `dashboard/agenda.tsx` | Agenda admin | ❌ aucune | `repeat(3,1fr)` stat cards, calendrier overflow |
| `dashboard/analytics.tsx` | Stats admin | ❌ aucune | `repeat(3,1fr)` stats, `1fr 1fr` charts |
| `dashboard/staff.tsx` | Équipe admin | ❌ aucune | `repeat(3,1fr)` fixe |
| `dashboard/services.tsx` | Prestations admin | ✅ `overflow-x-auto` sur table | `<table>` scroll |
| `auth-placeholder.tsx` | Auth placeholder | ✅ OK | — |

---

## Patterns à risque (grep résultats)

### Grilles multi-colonnes sans variante responsive
```
Footer.tsx:20          gridTemplateColumns: "repeat(4, 1fr)"
PhotoGallery.tsx:14    gridTemplateColumns: "repeat(4, 1fr)"
TimeSlotGrid.tsx:22    gridTemplateColumns: "repeat(4, 1fr)"
agenda.tsx:48          gridTemplateColumns: "repeat(3, 1fr)"
analytics.tsx:40       gridTemplateColumns: "repeat(3, 1fr)"
analytics.tsx:62       gridTemplateColumns: "1fr 1fr"
staff.tsx:20           gridTemplateColumns: "repeat(3, 1fr)"
home.tsx:524           gridTemplateColumns: "repeat(3, 1fr)"
home.tsx:282           gridTemplateColumns: "1fr 1fr"
home.tsx:385           gridTemplateColumns: "repeat(2, 1fr)"
search.tsx:156         gridTemplateColumns: "repeat(12, 1fr)" + spans
booking.tsx:56         gridTemplateColumns: "repeat(12, 1fr)" + 1/9 + 9/13
provider-profile.tsx:136 gridTemplateColumns: "repeat(12, 1fr)" + 1/9 + 9/13
```

### Largeurs fixes en pixels (layout)
```
DashboardLayout.tsx:36   width: 220  (sidebar)
search.tsx:54            width: 256  (filtre sidebar)
search.tsx:144           width: 200  (sort select)
search.tsx:225           width: 340  (carte panel)
home.tsx:19-39           COLLAGE_CARDS styles : width 260–320, fixed positions
```

---

## Test visuel aux 5 largeurs

| Page | 375px | 768px | 1024px | 1440px | 1920px | Fichier(s) |
|---|---|---|---|---|---|---|
| **Accueil** | 🔴 TopBar nav déborde hors pill ; barre recherche tronquée à droite | 🟡 Barre recherche OK, sections 2-col/3-col trop denses | 🟡 Collage décalé, grilles OK | ✅ | ✅ | `home.tsx`, `TopBar.tsx`, `HeroSection.tsx` |
| **Recherche** | 🔴 Sidebar filtre (256px) + résultats = 600px+ de contenu sur 375px, scroll H non désiré, résultats illisibles | 🟡 Sidebar visible mais cards trop étroites | 🟡 3 panneaux (filtre+results+carte) trop serrés | ✅ | ✅ | `search.tsx` |
| **Fiche prestataire** | 🔴 Page blanche (contenu sous le fold, grille 12-col hors viewport) ; FloatingBar OK | 🟡 Sidebar horaires écrasée à droite | 🟡 Sidebar trop étroite | ✅ | ✅ | `provider-profile.tsx`, `PhotoGallery.tsx` |
| **Réservation** | 🔴 Page blanche (grille 12-col, recap panel hors viewport) | 🟡 Recap panel visible mais trop étroit | 🟡 OK | ✅ | ✅ | `booking.tsx`, `TimeSlotGrid.tsx` |
| **Dashboard — Agenda** | 🔴 Sidebar (220px) + contenu = trop large, calendrier illisible, stat cards écrasées | 🟡 Sidebar prend trop de place, contenu étroit | 🟡 Sidebar visible, contenu acceptable | ✅ | ✅ | `DashboardLayout.tsx`, `agenda.tsx` |
| **Dashboard — Statistiques** | 🔴 Même sidebar ; charts trop petits en 2-col sur 155px | 🟡 Charts trop petits | 🟡 OK | ✅ | ✅ | `analytics.tsx` |
| **Dashboard — Équipe** | 🔴 3-col staff cards sur 155px de contenu | 🟡 3-col trop dense | 🟡 OK | ✅ | ✅ | `staff.tsx` |
| **Dashboard — Prestations** | 🔴 Table overflow mais `overflow-x-auto` présent (scroll silencieux) | 🟡 Scroll silencieux | 🟡 OK | ✅ | ✅ | `services.tsx` |

---

## Violations détectées (à corriger Phase 3)

1. **TopBar** — nav links always rendered, no burger menu → overflow à 375px
2. **DashboardLayout** — sidebar `position:sticky` toujours visible → écrase le contenu < 1024px
3. **Footer** — `repeat(4,1fr)` → doit être 1-col < 640px, 2-col < 1024px
4. **HeroSection** — barre 3-colonnes inline → doit s'empiler < 768px
5. **search.tsx** — sidebar filtre fixe 256px + résultats 12-col → doit être masquée sur mobile
6. **provider-profile.tsx** — `repeat(12,1fr)` 1/9 + 9/13 → doit s'empiler < 1024px
7. **booking.tsx** — même problème 12-col → doit s'empiler < 1024px
8. **PhotoGallery.tsx** — `repeat(4,1fr)` `height:360px` fixe → doit être 2-col sur mobile
9. **TimeSlotGrid.tsx** — `repeat(4,1fr)` → doit être 3-col sur mobile
10. **home.tsx** — collage absolument positionné, grilles 2/3-col → responsive sur mobile
11. **agenda/analytics/staff.tsx** — stat grids 3-col → 1-col mobile

---

*Phase 2 (philosophie) et Phase 3 (corrections) s'enchaînent immédiatement après ce rapport.*
