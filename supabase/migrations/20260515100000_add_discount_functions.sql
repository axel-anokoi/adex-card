-- ============================================================
-- 008_add_discount_functions.sql
-- Function to increment discount uses_count
-- ============================================================

-- Function to increment uses_count for a discount code
create or replace function public.increment_discount_uses(p_discount_code_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discount_codes
  set uses_count = uses_count + 1
  where id = p_discount_code_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.increment_discount_uses(uuid) to authenticated;
grant execute on function public.validate_discount_code(text, uuid, numeric, uuid, uuid) to authenticated;
