alter table public.purchases
  add column if not exists activation_link text;
