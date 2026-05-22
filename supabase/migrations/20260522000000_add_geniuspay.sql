-- Add geniuspay_reference column to purchases
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS geniuspay_reference text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_purchases_geniuspay_reference
  ON public.purchases (geniuspay_reference)
  WHERE geniuspay_reference IS NOT NULL;

-- Drop old overloads so CREATE OR REPLACE has an unambiguous target.
DROP FUNCTION IF EXISTS public.finalize_purchase(uuid, text);
DROP FUNCTION IF EXISTS public.finalize_purchase(uuid);

-- Update finalize_purchase to accept an optional geniuspay_reference parameter.
-- Backward-compatible: p_stripe_session_id and p_geniuspay_reference both default to NULL.
CREATE OR REPLACE FUNCTION public.finalize_purchase(
  p_purchase_id          uuid,
  p_stripe_session_id    text DEFAULT NULL,
  p_geniuspay_reference  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase   public.purchases%ROWTYPE;
  v_codes      jsonb;
BEGIN
  -- Lock the purchase row to prevent double-finalization
  SELECT * INTO v_purchase
  FROM public.purchases
  WHERE id = p_purchase_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'purchase_not_pending'
      USING HINT = p_purchase_id::text;
  END IF;

  -- Gather codes with human-readable product name for the confirmation email
  SELECT jsonb_agg(jsonb_build_object(
    'code',         gc.code,
    'product_name', cat.name || ' ' || prod.amount || ' €',
    'unit_price',   pi.unit_price
  ))
  INTO v_codes
  FROM public.purchase_items pi
  JOIN public.gift_codes    gc   ON gc.id  = pi.gift_code_id
  JOIN public.products      prod ON prod.id = pi.product_id
  JOIN public.categories    cat  ON cat.id  = pi.category_id
  WHERE pi.purchase_id = p_purchase_id;

  -- Mark codes as sold
  UPDATE public.gift_codes gc
  SET
    status          = 'sold',
    sold_at         = now(),
    sold_to_user_id = v_purchase.user_id,
    updated_at      = now()
  FROM public.purchase_items pi
  WHERE pi.purchase_id = p_purchase_id
    AND gc.id          = pi.gift_code_id;

  -- Mark purchase as paid; persist whichever payment reference was provided
  UPDATE public.purchases
  SET
    status               = 'paid',
    stripe_session_id    = COALESCE(p_stripe_session_id,   stripe_session_id),
    geniuspay_reference  = COALESCE(p_geniuspay_reference, geniuspay_reference),
    updated_at           = now()
  WHERE id = p_purchase_id;

  -- Clean up reservations; the delete trigger is a no-op because codes are now 'sold'
  DELETE FROM public.cart_reservations WHERE purchase_id = p_purchase_id;

  RETURN jsonb_build_object(
    'purchase_id',    p_purchase_id,
    'customer_email', v_purchase.customer_email,
    'customer_name',  v_purchase.customer_name,
    'total_amount',   v_purchase.total_amount,
    'codes',          COALESCE(v_codes, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_purchase TO authenticated, service_role;
