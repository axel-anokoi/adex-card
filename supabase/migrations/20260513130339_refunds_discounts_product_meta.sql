-- ============================================================
-- 007_refunds_discounts_product_meta.sql
-- Objectifs :
--   1) Gestion des remboursements (refund_requests)
--   2) Codes promo / réductions
--   3) Métadonnées produit enrichies (description, image, pays)
--   4) Fonction de remboursement sécurisée
-- ============================================================


-- ----------------------------------------------------------
-- 1. REFUND REQUESTS
-- Découple la demande de remboursement du statut Stripe
-- ----------------------------------------------------------

do $$ begin
  create type refund_status as enum (
    'pending',
    'approved',
    'rejected',
    'processed'    -- remboursement Stripe effectivement émis
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.refund_requests (
  id             uuid primary key default gen_random_uuid(),
  purchase_id    uuid not null references public.purchases(id) on delete restrict,
  user_id        uuid not null references public.users(id),
  reason         text not null,
  status         refund_status not null default 'pending',
  admin_note     text,
  reviewed_by    uuid references public.users(id),
  reviewed_at    timestamp with time zone,
  stripe_refund_id text,
  amount         numeric check (amount > 0),   -- montant remboursé (peut être partiel)
  created_at     timestamp with time zone default now(),
  updated_at     timestamp with time zone default now()
);

create index if not exists idx_refund_requests_purchase
  on public.refund_requests(purchase_id);
create index if not exists idx_refund_requests_user
  on public.refund_requests(user_id, created_at desc);
create index if not exists idx_refund_requests_status
  on public.refund_requests(status);

drop trigger if exists trg_refund_requests_updated_at on public.refund_requests;
create trigger trg_refund_requests_updated_at
before update on public.refund_requests
for each row execute function public.set_updated_at();

-- Contrainte : un seul refund non-rejeté par achat
create unique index if not exists uq_refund_requests_active_per_purchase
  on public.refund_requests(purchase_id)
  where status not in ('rejected');

-- Fonction appelée par l'admin ou un webhook Stripe pour finaliser le remboursement
create or replace function public.process_refund(
  p_refund_request_id uuid,
  p_stripe_refund_id  text default null,
  p_amount            numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_item        record;
begin
  -- Récupérer la demande
  select purchase_id into v_purchase_id
  from public.refund_requests
  where id = p_refund_request_id
    and status = 'approved';

  if not found then
    raise exception 'refund_request_not_found_or_not_approved';
  end if;

  -- Remettre les gift_codes vendus dans cet achat en 'refunded'
  for v_item in
    select pi.gift_code_id
    from public.purchase_items pi
    where pi.purchase_id = v_purchase_id
      and pi.gift_code_id is not null
  loop
    update public.gift_codes
    set status      = 'refunded',
        sold_to_user_id = null,
        sold_at     = null
    where id = v_item.gift_code_id;
  end loop;

  -- Mettre à jour le statut de l'achat
  update public.purchases
  set status = 'refunded'
  where id = v_purchase_id;

  -- Finaliser la demande de remboursement
  update public.refund_requests
  set status           = 'processed',
      stripe_refund_id = p_stripe_refund_id,
      amount           = coalesce(p_amount, (
        select total_amount from public.purchases where id = v_purchase_id
      )),
      reviewed_at      = now()
  where id = p_refund_request_id;

  -- Notifier l'utilisateur
  insert into public.notifications (user_id, type, title, body, metadata)
  select
    p.user_id,
    'purchase_refunded',
    'Remboursement effectué',
    'Votre commande a été remboursée avec succès.',
    jsonb_build_object('purchase_id', v_purchase_id)
  from public.purchases p
  where p.id = v_purchase_id;
end;
$$;


-- ----------------------------------------------------------
-- 2. CODES PROMO
-- ----------------------------------------------------------

do $$ begin
  create type discount_type as enum ('percentage', 'fixed_amount');
exception when duplicate_object then null;
end $$;

create table if not exists public.discount_codes (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  description         text,
  discount_type       discount_type not null,
  discount_value      numeric not null check (discount_value > 0),
  -- Pour percentage : valeur max en devise (ex: max 20€ pour 30%)
  max_discount_amount numeric check (max_discount_amount > 0),
  -- Restrictions produit (null = valable sur tout)
  product_id          uuid references public.products(id) on delete set null,
  category_id         uuid references public.categories(id) on delete set null,
  -- Usage
  min_order_amount    numeric default 0 check (min_order_amount >= 0),
  max_uses            integer,           -- null = illimité
  uses_count          integer not null default 0 check (uses_count >= 0),
  max_uses_per_user   integer default 1,
  -- Validité
  valid_from          timestamp with time zone default now(),
  valid_until         timestamp with time zone,
  is_active           boolean not null default true,
  created_at          timestamp with time zone default now(),
  updated_at          timestamp with time zone default now()
);

create index if not exists idx_discount_codes_code
  on public.discount_codes(code);
create index if not exists idx_discount_codes_active
  on public.discount_codes(is_active, valid_until);

drop trigger if exists trg_discount_codes_updated_at on public.discount_codes;
create trigger trg_discount_codes_updated_at
before update on public.discount_codes
for each row execute function public.set_updated_at();

-- Suivi des usages par utilisateur
create table if not exists public.discount_code_uses (
  id               uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  user_id          uuid not null references public.users(id),
  purchase_id      uuid not null references public.purchases(id),
  discount_applied numeric not null check (discount_applied >= 0),
  used_at          timestamp with time zone default now(),
  unique (discount_code_id, user_id, purchase_id)
);

-- Champ optionnel sur purchases pour tracer la réduction appliquée
alter table public.purchases
  add column if not exists discount_code_id    uuid references public.discount_codes(id),
  add column if not exists discount_amount     numeric default 0 check (discount_amount >= 0);

-- Fonction de validation d'un code promo
create or replace function public.validate_discount_code(
  p_code          text,
  p_user_id       uuid,
  p_order_amount  numeric,
  p_product_id    uuid default null,
  p_category_id   uuid default null
)
returns table (
  discount_code_id  uuid,
  discount_type     discount_type,
  discount_value    numeric,
  computed_discount numeric,
  is_valid          boolean,
  rejection_reason  text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dc        public.discount_codes%rowtype;
  v_use_count integer;
  v_computed  numeric;
begin
  select * into v_dc
  from public.discount_codes
  where code = upper(trim(p_code))
    and is_active = true;

  if not found then
    return query select null::uuid, null::discount_type, null::numeric, null::numeric,
                        false, 'Code invalide ou inactif';
    return;
  end if;

  -- Validité temporelle
  if v_dc.valid_from > now() then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Code pas encore actif';
    return;
  end if;

  if v_dc.valid_until is not null and v_dc.valid_until < now() then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Code expiré';
    return;
  end if;

  -- Montant minimum
  if p_order_amount < v_dc.min_order_amount then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, format('Commande minimum : %.2f', v_dc.min_order_amount);
    return;
  end if;

  -- Restriction produit/catégorie
  if v_dc.product_id is not null and v_dc.product_id <> p_product_id then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Code non applicable à ce produit';
    return;
  end if;

  if v_dc.category_id is not null and v_dc.category_id <> p_category_id then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Code non applicable à cette catégorie';
    return;
  end if;

  -- Quota global
  if v_dc.max_uses is not null and v_dc.uses_count >= v_dc.max_uses then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Quota d''utilisation atteint';
    return;
  end if;

  -- Quota par utilisateur
  select count(*) into v_use_count
  from public.discount_code_uses
  where discount_code_id = v_dc.id and user_id = p_user_id;

  if v_dc.max_uses_per_user is not null and v_use_count >= v_dc.max_uses_per_user then
    return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, null::numeric,
                        false, 'Vous avez déjà utilisé ce code';
    return;
  end if;

  -- Calcul de la réduction
  if v_dc.discount_type = 'percentage' then
    v_computed := p_order_amount * v_dc.discount_value / 100;
    if v_dc.max_discount_amount is not null then
      v_computed := least(v_computed, v_dc.max_discount_amount);
    end if;
  else
    v_computed := least(v_dc.discount_value, p_order_amount);
  end if;

  return query select v_dc.id, v_dc.discount_type, v_dc.discount_value, v_computed,
                      true, null::text;
end;
$$;


-- ----------------------------------------------------------
-- 3. MÉTADONNÉES PRODUIT ENRICHIES
-- ----------------------------------------------------------

alter table public.products
  add column if not exists name          text,
  add column if not exists description   text,
  add column if not exists image_url     text,
  add column if not exists country_code  char(2),       -- ex: 'CI', 'SN', 'FR'
  add column if not exists currency_code char(3) not null default 'XOF',
  add column if not exists sort_order    integer not null default 0;

-- Permet de trier l'affichage (catégorie en vedette, etc.)
alter table public.categories
  add column if not exists sort_order    integer not null default 0,
  add column if not exists description   text,
  add column if not exists banner_url    text;

create index if not exists idx_products_sort
  on public.products(category_id, sort_order, sell_price);
create index if not exists idx_categories_sort
  on public.categories(sort_order, is_active);


-- ----------------------------------------------------------
-- RLS pour les nouvelles tables
-- ----------------------------------------------------------

alter table public.refund_requests      enable row level security;
alter table public.discount_codes       enable row level security;
alter table public.discount_code_uses   enable row level security;

-- Refund requests : propriétaire peut créer/lire, admin gère tout
drop policy if exists "refunds_owner_read_insert" on public.refund_requests;
create policy "refunds_owner_read_insert"
on public.refund_requests
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "refunds_owner_insert" on public.refund_requests;
create policy "refunds_owner_insert"
on public.refund_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "refunds_admin_update" on public.refund_requests;
create policy "refunds_admin_update"
on public.refund_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Discount codes : lecture authentifiée (pour validation), gestion admin
drop policy if exists "discount_codes_read_active" on public.discount_codes;
create policy "discount_codes_read_active"
on public.discount_codes
for select
to authenticated
using (is_active = true or public.is_admin());

drop policy if exists "discount_codes_admin_all" on public.discount_codes;
create policy "discount_codes_admin_all"
on public.discount_codes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Discount code uses : propriétaire + admin
drop policy if exists "discount_uses_owner" on public.discount_code_uses;
create policy "discount_uses_owner"
on public.discount_code_uses
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());