alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.users enable row level security;
alter table public.gift_codes enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.webhook_events enable row level security;

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
      and u.is_blocked = false
  );
$$;

-- CATEGORIES: readable by anyone, manageable by admin
drop policy if exists "categories_read_all" on public.categories;
create policy "categories_read_all"
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PRODUCTS: readable by anyone, manageable by admin
drop policy if exists "products_read_all" on public.products;
create policy "products_read_all"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- USERS: self read/update, admin full access
drop policy if exists "users_read_self" on public.users;
create policy "users_read_self"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- GIFT_CODES: admin only
drop policy if exists "gift_codes_admin_all" on public.gift_codes;
create policy "gift_codes_admin_all"
on public.gift_codes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PURCHASES: client sees own, admin sees all; insert by authenticated user
drop policy if exists "purchases_read_own" on public.purchases;
create policy "purchases_read_own"
on public.purchases
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own"
on public.purchases
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "purchases_update_admin" on public.purchases;
create policy "purchases_update_admin"
on public.purchases
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- PURCHASE_ITEMS: owner via purchase linkage, admin all
drop policy if exists "purchase_items_read_own" on public.purchase_items;
create policy "purchase_items_read_own"
on public.purchase_items
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.purchases p
    where p.id = purchase_items.purchase_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "purchase_items_admin_all" on public.purchase_items;
create policy "purchase_items_admin_all"
on public.purchase_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- WEBHOOK_EVENTS: admin/server role only
drop policy if exists "webhook_events_admin_all" on public.webhook_events;
create policy "webhook_events_admin_all"
on public.webhook_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
