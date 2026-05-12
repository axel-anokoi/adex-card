# TODO - Plateforme cartes cadeaux

## Phase 1 (en cours)
- [ ] Installer dépendances métier (Supabase, Stripe, Recharts, Papa Parse, Zod)
- [ ] Créer structure de dossiers (app routes, api, lib, components, supabase/sql)
- [ ] Ajouter `.env.example`
- [ ] Ajouter SQL complet (schema + triggers + RLS)
- [ ] Ajouter middleware de protection (`/dashboard`, `/admin`)
- [ ] Ajouter clients Supabase + utilitaires Stripe

## Phase 2
- [ ] Implémenter pages publiques (home, catalogue, détail produit)
- [ ] Implémenter API publique produits
- [ ] Implémenter panier (base UI + logique locale)

## Phase 3
- [ ] Implémenter checkout Stripe
- [ ] Implémenter webhook Stripe (squelette idempotent)
- [ ] Préparer flux d’attribution de codes (service côté serveur)

## Phase 4
- [ ] Mettre à jour README (installation et configuration)
- [ ] Lancer lint
- [ ] Lancer dev et vérifier démarrage
