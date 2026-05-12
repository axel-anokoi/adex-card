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

- [ ] 5) Validation
  - [ ] Lancer lint/check
  - [ ] Vérifier le rendu visuel global
