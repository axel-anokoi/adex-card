-- 004_rls_hardening.sql
-- Durcissement RLS:
-- - Empêcher un client de modifier role/is_blocked sur son profil
-- - Rendre explicites les droits purchase_items (lecture client owner, écriture admin)
-- - Fix récursion infinie: is_admin() doit être SECURITY DEFINER pour bypasser RLS sur public.users

-- Recréer is_admin() avec SECURITY DEFINER pour éviter la récursion infinie.
-- Sans ça: is_admin() → SELECT users → déclenche users_admin_all → appelle is_admin() → boucle.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
      and u.is_blocked = false
  );
$$;

-- GIFT_CODES: permettre au client de lire ses propres codes via ses purchase_items
drop policy if exists "gift_codes_read_own" on public.gift_codes;
create policy "gift_codes_read_own"
on public.gift_codes
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.purchase_items pi
    join public.purchases p on p.id = pi.purchase_id
    where pi.gift_code_id = gift_codes.id
      and p.user_id = auth.uid()
  )
);

-- USERS: remplace la policy update self pour empêcher l'escalade de privilèges
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self_safe"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select u.role from public.users u where u.id = auth.uid())
  and is_blocked = (select u.is_blocked from public.users u where u.id = auth.uid())
);

-- PURCHASE_ITEMS:
-- lecture: client propriétaire de la purchase, admin tout
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

-- insert: admin only (évite insert direct client non maîtrisé)
drop policy if exists "purchase_items_insert_admin_only" on public.purchase_items;
create policy "purchase_items_insert_admin_only"
on public.purchase_items
for insert
to authenticated
with check (public.is_admin());

-- update: admin only
drop policy if exists "purchase_items_update_admin_only" on public.purchase_items;
create policy "purchase_items_update_admin_only"
on public.purchase_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- delete: admin only
drop policy if exists "purchase_items_delete_admin_only" on public.purchase_items;
create policy "purchase_items_delete_admin_only"
on public.purchase_items
for delete
to authenticated
using (public.is_admin());

-- Nettoyage éventuelle policy globale all pour éviter conflits logiques
drop policy if exists "purchase_items_admin_all" on public.purchase_items;
create policy "purchase_items_admin_all"
on public.purchase_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
