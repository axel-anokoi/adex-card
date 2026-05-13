-- 005_constraints.sql
-- Contraintes de cohérence métier (idempotent, via vérif catalogue pg_constraint)

do $$
begin
  -- purchase_items.total_price = quantity * unit_price
  if not exists (
    select 1
    from pg_constraint
    where conname = 'purchase_items_total_price_match'
  ) then
    alter table public.purchase_items
    add constraint purchase_items_total_price_match
    check (total_price = quantity * unit_price);
  end if;

  -- gift_codes sold_at doit être présent si status = sold
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gift_codes_sold_requires_sold_at'
  ) then
    alter table public.gift_codes
    add constraint gift_codes_sold_requires_sold_at
    check (
      (status <> 'sold')
      or (sold_at is not null)
    );
  end if;

  -- gift_codes sold_to_user_id doit être présent si sold
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gift_codes_sold_requires_buyer'
  ) then
    alter table public.gift_codes
    add constraint gift_codes_sold_requires_buyer
    check (
      (status <> 'sold')
      or (sold_to_user_id is not null)
    );
  end if;
end $$;
