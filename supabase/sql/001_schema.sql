-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type gift_code_status as enum ('available', 'sold', 'reserved', 'refunded', 'expired');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type purchase_status as enum ('pending', 'paid', 'failed', 'refunded', 'pending_manual_review');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type user_role as enum ('client', 'admin');
exception
  when duplicate_object then null;
end $$;

-- Generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  logo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric not null check (amount > 0),
  sell_price numeric not null check (sell_price >= 0),
  buy_price numeric not null check (buy_price >= 0),
  stock_available integer default 0 check (stock_available >= 0),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(category_id, amount)
);

-- Users extension table (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role user_role not null default 'client',
  is_blocked boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Gift codes
create table if not exists public.gift_codes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code text unique not null,
  status gift_code_status not null default 'available',
  buy_price numeric not null check (buy_price >= 0),
  sold_to_user_id uuid references public.users(id),
  sold_at timestamp with time zone,
  batch_reference text,
  expires_at date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  stripe_session_id text unique,
  total_amount numeric not null check (total_amount >= 0),
  status purchase_status not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Purchase items
create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  gift_code_id uuid references public.gift_codes(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_price numeric not null check (total_price >= 0),
  created_at timestamp with time zone default now()
);

-- Optional webhook event idempotency table
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  event_id text not null unique,
  event_type text not null,
  processed_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_gift_codes_product_status on public.gift_codes(product_id, status);
create index if not exists idx_gift_codes_expires_at on public.gift_codes(expires_at);
create index if not exists idx_purchases_user_created_at on public.purchases(user_id, created_at desc);
create index if not exists idx_purchase_items_purchase_id on public.purchase_items(purchase_id);

-- Updated_at triggers
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_gift_codes_updated_at on public.gift_codes;
create trigger trg_gift_codes_updated_at
before update on public.gift_codes
for each row execute function public.set_updated_at();

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

-- Stock update function
create or replace function public.update_product_stock()
returns trigger as $$
begin
  update public.products
  set stock_available = (
    select count(*)
    from public.gift_codes gc
    where gc.product_id = coalesce(new.product_id, old.product_id)
      and gc.status = 'available'
  )
  where id = coalesce(new.product_id, old.product_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trigger_update_stock_on_insert on public.gift_codes;
create trigger trigger_update_stock_on_insert
after insert on public.gift_codes
for each row execute function public.update_product_stock();

drop trigger if exists trigger_update_stock_on_update on public.gift_codes;
create trigger trigger_update_stock_on_update
after update on public.gift_codes
for each row execute function public.update_product_stock();

drop trigger if exists trigger_update_stock_on_delete on public.gift_codes;
create trigger trigger_update_stock_on_delete
after delete on public.gift_codes
for each row execute function public.update_product_stock();
