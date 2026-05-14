-- Table for password reset OTPs
create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  otp text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null,
  is_used boolean default false,
  
  unique(user_id, otp)
);

-- Index for faster lookup of active OTPs
create index if not exists idx_password_reset_otps_user_otp on public.password_reset_otps(user_id, otp);
create index if not exists idx_password_reset_otps_expires_at on public.password_reset_otps(expires_at);

-- RLS Policy: Only the system (service role) should typically manage these, 
-- but we'll keep it private by default.
alter table public.password_reset_otps enable row level security;

-- No public access policies needed if we use service_role for API calls, 
-- but for safety, we ensure no one can read/write via anon key.
