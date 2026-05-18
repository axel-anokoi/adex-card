-- Add client information columns to users table
alter table public.users add column if not exists nom text;
alter table public.users add column if not exists prenoms text;
alter table public.users add column if not exists telephone text;
alter table public.users add column if not exists photo_profile text;

-- Create index for faster lookups
create index if not exists idx_users_nom on public.users(nom);
create index if not exists idx_users_telephone on public.users(telephone);
