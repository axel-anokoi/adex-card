-- Annule atomiquement une purchase pending :
-- 1. Passe la purchase en 'failed'
-- 2. Supprime les cart_reservations → le trigger trg_cart_reservation_delete
--    remet les gift_codes en 'available' automatiquement
CREATE OR REPLACE FUNCTION public.cancel_purchase(p_purchase_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.purchases
  SET status = 'failed', updated_at = now()
  WHERE id = p_purchase_id AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows > 0 THEN
    -- La suppression déclenche trg_cart_reservation_delete qui remet
    -- les codes en 'available' si leur statut est encore 'reserved'
    DELETE FROM public.cart_reservations WHERE purchase_id = p_purchase_id;
  END IF;

  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_purchase TO service_role;
