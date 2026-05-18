-- Add image_url and slug columns to products table
alter table public.products
add column if not exists image_url text,
add column if not exists slug text;

-- Create unique index on slug
create unique index if not exists idx_products_slug on public.products(slug) where slug is not null;

-- Create index on products for slug lookup
create index if not exists idx_products_slug_lookup on public.products(slug);
