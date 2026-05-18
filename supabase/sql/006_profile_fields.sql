-- 006_profile_fields.sql
-- Ajout des champs profil utilisateur (nom, prenoms)
-- La policy users_update_self_safe (004) autorise déjà la mise à jour
-- de tous les champs sauf role et is_blocked.

alter table public.users
  add column if not exists nom text,
  add column if not exists prenoms text;
