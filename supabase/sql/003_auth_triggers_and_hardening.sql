-- 003_auth_triggers_and_hardening.sql
-- Objectif:
-- 1) Auto-créer un profil public.users à chaque nouvel utilisateur auth.users
-- 2) Synchroniser l'email auth.users -> public.users
-- 3) Backfill des profils manquants (idempotent)

-- Fonction: création auto profil à l'inscription auth
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, is_blocked)
  values (
    new.id,
    coalesce(new.email, ''),
    'client',
    false
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

-- Fonction: sync email quand auth.users.email change
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = coalesce(new.email, public.users.email)
  where id = new.id;

  return new;
end;
$$;

-- Trigger après création auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Trigger après update auth.users
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row execute function public.handle_auth_user_updated();

-- Backfill: créer les profils manquants depuis auth.users
insert into public.users (id, email, role, is_blocked)
select
  au.id,
  coalesce(au.email, ''),
  'client'::user_role,
  false
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;

-- Normalisation minimale: garantir email non vide côté public.users
-- (si auth provider ne renvoie pas d'email, on garde '' pour respecter non null)
update public.users
set email = ''
where email is null;
