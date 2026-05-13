-- ============================================================
-- 006_cart_audit_notifications.sql
-- Objectifs :
--   1) Réservation temporaire de codes (panier sécurisé)
--   2) Journal d'audit global (admin + debug)
--   3) Table de notifications utilisateur
--   4) Alertes stock bas (trigger)
-- ============================================================

-- ----------------------------------------------------------
-- 1. CART RESERVATIONS
-- Permet de verrouiller un gift_code le temps du checkout
-- Stripe Checkout expire ~30 min → on réserve 35 min
-- ----------------------------------------------------------

create table if not exists public.cart_reservations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  gift_code_id  uuid not null references public.gift_codes(id) on delete cascade,
  purchase_id   uuid references public.purchases(id) on delete set null,
  expires_at    timestamp with time zone not null default (now() + interval '35 minutes'),
  created_at    timestamp with time zone default now(),
  unique (gift_code_id)   -- un code ne peut être réservé que par un seul panier
);

create index if not exists idx_cart_reservations_user
  on public.cart_reservations(user_id);
create index if not exists idx_cart_reservations_expires
  on public.cart_reservations(expires_at);

-- Passe le gift_code en 'reserved' à la création d'une réservation
create or replace function public.handle_cart_reservation_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gift_codes
  set status = 'reserved'
  where id = new.gift_code_id
    and status = 'available';

  if not found then
    raise exception 'gift_code_not_available' using hint = new.gift_code_id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cart_reservation_insert on public.cart_reservations;
create trigger trg_cart_reservation_insert
before insert on public.cart_reservations
for each row execute function public.handle_cart_reservation_insert();

-- Libère le code si la réservation est supprimée sans achat finalisé
create or replace function public.handle_cart_reservation_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Remettre disponible seulement si le code n'est pas déjà sold
  update public.gift_codes
  set status = 'available'
  where id = old.gift_code_id
    and status = 'reserved';

  return old;
end;
$$;

drop trigger if exists trg_cart_reservation_delete on public.cart_reservations;
create trigger trg_cart_reservation_delete
after delete on public.cart_reservations
for each row execute function public.handle_cart_reservation_delete();

-- Fonction utilitaire : purge les réservations expirées (à appeler via pg_cron ou Edge Function)
create or replace function public.purge_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.cart_reservations
  where expires_at < now()
    and purchase_id is null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;


-- ----------------------------------------------------------
-- 2. AUDIT LOG
-- Trace toutes les mutations sensibles sur les entités clés
-- ----------------------------------------------------------

do $$ begin
  create type audit_action as enum ('insert', 'update', 'delete');
exception when duplicate_object then null;
end $$;

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.users(id) on delete set null,
  action       audit_action not null,
  table_name   text not null,
  record_id    uuid not null,
  old_data     jsonb,
  new_data     jsonb,
  ip_address   inet,
  created_at   timestamp with time zone default now()
);

create index if not exists idx_audit_logs_actor
  on public.audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_logs_table_record
  on public.audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_created_at
  on public.audit_logs(created_at desc);

-- Fonction générique de journalisation (appelée par les triggers d'audit)
create or replace function public.fn_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    lower(TG_OP)::audit_action,
    TG_TABLE_NAME,
    coalesce(
      (case when TG_OP <> 'DELETE' then new.id else null end),
      old.id
    ),
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- Audit sur les tables sensibles
do $$ begin

  -- purchases
  drop trigger if exists trg_audit_purchases on public.purchases;
  create trigger trg_audit_purchases
  after insert or update or delete on public.purchases
  for each row execute function public.fn_audit_log();

  -- gift_codes (changements de status)
  drop trigger if exists trg_audit_gift_codes on public.gift_codes;
  create trigger trg_audit_gift_codes
  after update of status on public.gift_codes
  for each row execute function public.fn_audit_log();

  -- users (rôle, blocage)
  drop trigger if exists trg_audit_users on public.users;
  create trigger trg_audit_users
  after update of role, is_blocked on public.users
  for each row execute function public.fn_audit_log();

end $$;


-- ----------------------------------------------------------
-- 3. NOTIFICATIONS UTILISATEUR
-- ----------------------------------------------------------

do $$ begin
  create type notification_type as enum (
    'purchase_confirmed',
    'purchase_failed',
    'purchase_refunded',
    'stock_low',          -- admin seulement
    'gift_code_delivered',
    'account_blocked',
    'manual_review_required'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          notification_type not null,
  title         text not null,
  body          text,
  metadata      jsonb,               -- ex: { purchase_id, product_name, amount }
  is_read       boolean not null default false,
  created_at    timestamp with time zone default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);


-- ----------------------------------------------------------
-- 4. ALERTE STOCK BAS
-- Insère une notification admin quand stock_available < seuil
-- ----------------------------------------------------------

alter table public.products
  add column if not exists low_stock_threshold integer not null default 5;

create or replace function public.fn_notify_low_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  -- Seulement si le stock vient de passer sous le seuil (évite les doublons)
  if new.stock_available < new.low_stock_threshold
     and old.stock_available >= new.low_stock_threshold then

    -- Notifier tous les admins non bloqués
    for v_admin_id in
      select id from public.users
      where role = 'admin' and is_blocked = false
    loop
      insert into public.notifications (user_id, type, title, body, metadata)
      values (
        v_admin_id,
        'stock_low',
        'Stock faible',
        format('Le produit %s a %s code(s) restant(s).', new.id, new.stock_available),
        jsonb_build_object('product_id', new.id, 'stock', new.stock_available)
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_low_stock on public.products;
create trigger trg_notify_low_stock
after update of stock_available on public.products
for each row execute function public.fn_notify_low_stock();


-- ----------------------------------------------------------
-- RLS pour les nouvelles tables
-- ----------------------------------------------------------

alter table public.cart_reservations  enable row level security;
alter table public.audit_logs         enable row level security;
alter table public.notifications      enable row level security;

-- Cart reservations : propriétaire + admin
drop policy if exists "cart_reservations_owner" on public.cart_reservations;
create policy "cart_reservations_owner"
on public.cart_reservations
for all
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

-- Audit logs : admin uniquement
drop policy if exists "audit_logs_admin_only" on public.audit_logs;
create policy "audit_logs_admin_only"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

-- Notifications : propriétaire + admin
drop policy if exists "notifications_owner" on public.notifications;
create policy "notifications_owner"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "notifications_mark_read" on public.notifications;
create policy "notifications_mark_read"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);