-- ============================================================
-- reservation_timer.sql
-- Objectifs :
--   1) checkout_reserve_codes retourne expires_at
--   2) finalize_purchase bloque si réservation expirée
-- ============================================================


-- ----------------------------------------------------------
-- 1. checkout_reserve_codes — ajoute expires_at dans le retour
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.checkout_reserve_codes(
  p_items          jsonb,
  p_customer       jsonb,
  p_payment_method text,
  p_total_amount   numeric,
  p_total_cost     numeric,
  p_total_profit   numeric,
  p_user_id        uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id    uuid;
  v_active_count   integer;
  v_expires_at     timestamptz;
  item_rec         jsonb;
  qty_i            integer;
  v_code_id        uuid;
  v_code           text;
  reserved_codes   jsonb := '[]'::jsonb;
BEGIN
  -- Purger les réservations expirées de cet utilisateur
  DELETE FROM public.cart_reservations
  WHERE user_id = p_user_id AND expires_at < now();

  -- Limiter à 3 sessions de checkout actives par utilisateur
  SELECT COUNT(DISTINCT purchase_id) INTO v_active_count
  FROM public.cart_reservations
  WHERE user_id = p_user_id
    AND expires_at > now();

  IF v_active_count >= 3 THEN
    RAISE EXCEPTION 'too_many_reservations'
      USING DETAIL = 'Max 3 sessions de checkout actives simultanément';
  END IF;

  -- Créer la purchase en statut pending
  INSERT INTO public.purchases (
    user_id,
    total_amount,
    status,
    payment_method,
    customer_name,
    customer_phone,
    customer_email,
    total_cost,
    total_profit
  ) VALUES (
    p_user_id,
    p_total_amount,
    'pending',
    p_payment_method,
    p_customer->>'full_name',
    p_customer->>'phone',
    NULLIF(p_customer->>'email', ''),
    p_total_cost,
    p_total_profit
  )
  RETURNING id INTO v_purchase_id;

  -- Pour chaque article, réserver autant de codes que la quantité demandée
  FOR item_rec IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    FOR qty_i IN 1..(item_rec->>'quantity')::int
    LOOP
      -- Verrouillage atomique : SKIP LOCKED garantit zéro race condition
      SELECT gc.id, gc.code
      INTO v_code_id, v_code
      FROM public.gift_codes gc
      WHERE gc.product_id = (item_rec->>'product_id')::uuid
        AND gc.status = 'available'
        AND (gc.expires_at IS NULL OR gc.expires_at > now()::date)
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'gift_code_not_available'
          USING HINT    = item_rec->>'product_id',
                DETAIL  = format('Aucun code disponible pour le produit %s', item_rec->>'product_id');
      END IF;

      -- Pré-réserver le code
      UPDATE public.gift_codes
      SET
        status          = 'reserved',
        sold_to_user_id = p_user_id,
        updated_at      = now()
      WHERE id = v_code_id;

      -- Créer la réservation et capturer expires_at
      INSERT INTO public.cart_reservations (user_id, gift_code_id, purchase_id)
      VALUES (p_user_id, v_code_id, v_purchase_id)
      RETURNING expires_at INTO v_expires_at;

      -- Créer le purchase_item
      INSERT INTO public.purchase_items (
        purchase_id,
        product_id,
        category_id,
        gift_code_id,
        quantity,
        unit_price,
        unit_cost,
        total_price
      ) VALUES (
        v_purchase_id,
        (item_rec->>'product_id')::uuid,
        (item_rec->>'category_id')::uuid,
        v_code_id,
        1,
        (item_rec->>'unit_price')::numeric,
        (item_rec->>'unit_cost')::numeric,
        (item_rec->>'unit_price')::numeric
      );

      reserved_codes := reserved_codes || jsonb_build_array(jsonb_build_object(
        'code_id',      v_code_id,
        'code',         v_code,
        'product_id',   item_rec->>'product_id',
        'product_name', item_rec->>'name'
      ));
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'purchase_id',    v_purchase_id,
    'reserved_codes', reserved_codes,
    'expires_at',     v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_reserve_codes TO authenticated;


-- ----------------------------------------------------------
-- 2. finalize_purchase — bloque si la réservation a expiré
-- ----------------------------------------------------------

-- Drop all overloads so CREATE OR REPLACE targets exactly one function.
DROP FUNCTION IF EXISTS public.finalize_purchase(uuid, text);
DROP FUNCTION IF EXISTS public.finalize_purchase(uuid, text, text);
DROP FUNCTION IF EXISTS public.finalize_purchase(uuid);

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
  v_expired    boolean := false;

BEGIN
  -- Vérifier si la réservation a expiré (des lignes existent mais expires_at < now())
  SELECT EXISTS(
    SELECT 1 FROM public.cart_reservations
    WHERE purchase_id = p_purchase_id
      AND expires_at < now()
  ) INTO v_expired;

  -- Si aucune réservation active et purchase encore pending : expirée et purgée
  IF NOT v_expired THEN
    SELECT NOT EXISTS(
      SELECT 1 FROM public.cart_reservations
      WHERE purchase_id = p_purchase_id
        AND expires_at >= now()
    ) AND EXISTS(
      SELECT 1 FROM public.purchases
      WHERE id = p_purchase_id AND status = 'pending'
    ) INTO v_expired;
  END IF;

  IF v_expired THEN
    UPDATE public.purchases
    SET status = 'failed', updated_at = now()
    WHERE id = p_purchase_id AND status = 'pending';

    DELETE FROM public.cart_reservations WHERE purchase_id = p_purchase_id;

    RAISE EXCEPTION 'reservation_expired'
      USING HINT = p_purchase_id::text;
  END IF;

  -- Verrouiller la purchase pour éviter la double-finalisation
  SELECT * INTO v_purchase
  FROM public.purchases
  WHERE id = p_purchase_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'purchase_not_pending'
      USING HINT = p_purchase_id::text;
  END IF;

  -- Récupérer les codes pour l'email de confirmation
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

  -- Marquer les codes comme vendus
  UPDATE public.gift_codes gc
  SET
    status          = 'sold',
    sold_at         = now(),
    sold_to_user_id = v_purchase.user_id,
    updated_at      = now()
  FROM public.purchase_items pi
  WHERE pi.purchase_id   = p_purchase_id
    AND gc.id            = pi.gift_code_id;

  -- Marquer la purchase comme payée
  UPDATE public.purchases
  SET
    status               = 'paid',
    stripe_session_id    = COALESCE(p_stripe_session_id,   stripe_session_id),
    geniuspay_reference  = COALESCE(p_geniuspay_reference, geniuspay_reference),
    updated_at           = now()
  WHERE id = p_purchase_id;

  -- Supprimer les réservations
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

GRANT EXECUTE ON FUNCTION public.finalize_purchase(uuid, text, text) TO authenticated, service_role;
