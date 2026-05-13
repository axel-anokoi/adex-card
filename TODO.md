# BABICARD UI Revamp TODO

- [x] 1) Corriger la base design system dans `src/app/globals.css`
  - [x] Fix typo font body (`--font-body`)
  - [x] Ajouter règles mobile-first touch targets/sections/grid utilitaires

- [ ] 2) Enrichir `src/app/page.tsx`
  - [ ] Ajouter bande réassurance avec compteur “codes livrés aujourd’hui”
  - [ ] Ajouter section paiements locaux (Djamo/Moov Money)
  - [ ] Améliorer hero avec badge livraison instantanée plus visible
  - [ ] Passer les témoignages en carousel auto sur mobile

- [ ] 3) Upgrader `src/components/products/product-card.tsx`
  - [ ] Renforcer style glass + 3D hover + badge prix néon
  - [ ] Améliorer CTA (contraste, feedback, pulse léger)
  - [ ] Améliorer indicateurs stock

- [ ] 4) Retravailler `src/components/layout/footer.tsx`
  - [ ] Footer dark-neon structuré
  - [ ] Branding + slogan + liens organisés + contacts + réseaux

- [ ] 5) Feature light/dark (même design, mêmes couleurs)
  - [ ] Mettre à jour `src/app/layout.tsx` (init thème + variables body)
  - [ ] Étendre `src/app/globals.css` avec variables `html.light` / `html.dark`
  - [ ] Créer `src/components/layout/theme-toggle.tsx`
  - [ ] Intégrer le toggle dans `src/components/layout/header.tsx`
  - [ ] Vérifier build/lint + rendu visuel

- [ ] 6) Validation
  - [ ] Lancer lint/check
  - [ ] Vérifier le rendu visuel global

## Theme strict black/white fix (session en cours)
- [ ] A) Mettre `html.light` en fond blanc strict + tokens cohérents dans `src/app/globals.css`
- [ ] B) Refactor utilitaires globaux (`btn-outline`, `feat-card`, `testi-card`, `step-card`, scrollbar) vers variables thème
- [ ] C) Rendre `src/components/layout/theme-toggle.tsx` theme-aware (sans hardcode white)
- [ ] D) Rendre `src/components/layout/header.tsx` theme-aware (desktop + mobile + dropdown)
- [ ] E) Rendre `src/components/layout/footer.tsx` theme-aware
- [ ] F) Rendre `src/components/products/product-card.tsx` theme-aware
- [ ] G) Lancer vérification statique (lint/build) puis checklist manuelle light/dark
