-- ============================================================
-- atomic_checkout.sql
-- Objectifs :
--   1) purchase_id NOT NULL dans cart_reservations
--   2) Expiry réduit à 32 min (Stripe Checkout = 30 min)
--   3) INSERT trigger tolérant au pré-réservé (flow RPC)
--   4) Vue available_gift_codes (exclut réservations expirées)
--   5) RPC checkout_reserve_codes — SELECT FOR UPDATE SKIP LOCKED
--   6) RPC finalize_purchase — atomique sold + paid + cleanup
-- ============================================================


-- ----------------------------------------------------------
-- 1. purchase_id NOT NULL
-- ----------------------------------------------------------

-- Supprimer les réservations orphelines (sans purchase)
DELETE FROM public.cart_reservations WHERE purchase_id IS NULL;

-- La contrainte ON DELETE SET NULL devient invalide avec NOT NULL
-- → on rebascule en ON DELETE CASCADE
ALTER TABLE public.cart_reservations
  DROP CONSTRAINT IF EXISTS cart_reservations_purchase_id_fkey;

ALTER TABLE public.cart_reservations
  ADD CONSTRAINT cart_reservations_purchase_id_fkey
  FOREIGN KEY (purchase_id)
  REFERENCES public.purchases(id)
  ON DELETE CASCADE;

ALTER TABLE public.cart_reservations
  ALTER COLUMN purchase_id SET NOT NULL;


-- ----------------------------------------------------------
-- 2. Réduire la fenêtre de réservation à 32 minutes
-- ----------------------------------------------------------

ALTER TABLE public.cart_reservations
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '32 minutes');


-- ----------------------------------------------------------
-- 3. Mettre à jour la fonction de purge
--    (plus de condition IS NULL sur purchase_id)
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_expired_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Le trigger trg_cart_reservation_delete remet status='available'
  -- sur les gift_codes dont la réservation n'a pas abouti
  DELETE FROM public.cart_reservations WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


-- ----------------------------------------------------------
-- 4. Modifier le trigger INSERT pour tolérer le pré-réservé
--    Le RPC fait SELECT FOR UPDATE SKIP LOCKED puis UPDATE
--    avant d'insérer dans cart_reservations.
--    Quand le trigger se déclenche, status est déjà 'reserved'.
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_cart_reservation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenter la transition available → reserved (flow direct)
  UPDATE public.gift_codes
  SET status = 'reserved'
  WHERE id = new.gift_code_id
    AND status = 'available';

  IF NOT FOUND THEN
    -- Le code peut déjà être 'reserved' si le RPC l'a pré-verrouillé
    -- via SELECT FOR UPDATE SKIP LOCKED (flow atomique)
    IF NOT EXISTS (
      SELECT 1 FROM public.gift_codes
      WHERE id = new.gift_code_id AND status = 'reserved'
    ) THEN
      RAISE EXCEPTION 'gift_code_not_available' USING HINT = new.gift_code_id::text;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- Le trigger lui-même est déjà créé dans la migration précédente ;
-- CREATE OR REPLACE FUNCTION suffit à le mettre à jour.


-- ----------------------------------------------------------
-- 5. Vue : codes réellement disponibles
--    Inclut les codes dont la réservation a expiré
-- ----------------------------------------------------------

CREATE OR REPLACE VIEW public.available_gift_codes AS
SELECT gc.*
FROM public.gift_codes gc
WHERE gc.status = 'available'
   OR (
     gc.status = 'reserved'
     AND NOT EXISTS (
       SELECT 1 FROM public.cart_reservations cr
       WHERE cr.gift_code_id = gc.id
         AND cr.expires_at > now()
     )
   );


-- ----------------------------------------------------------
-- 6. RPC checkout_reserve_codes
--    Crée la purchase et réserve les codes de façon atomique.
--    En cas d'exception, tout est rollbacké automatiquement.
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.checkout_reserve_codes(
  p_items          jsonb,    -- [{product_id, name, quantity, unit_price, unit_cost, category_id}]
  p_customer       jsonb,    -- {full_name, phone, email}
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
  item_rec         jsonb;
  qty_i            integer;
  v_code_id        uuid;
  v_code           text;
  reserved_codes   jsonb := '[]'::jsonb;
BEGIN
  -- Purger les réservations expirées de cet utilisateur avant de commencer
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
      -- Si deux requêtes arrivent simultanément sur le même produit,
      -- la seconde prend le code suivant disponible (ou lève une exception)
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

      -- Pré-réserver le code (le trigger INSERT verra status='reserved' et le tolerera)
      UPDATE public.gift_codes
      SET
        status          = 'reserved',
        sold_to_user_id = p_user_id,
        updated_at      = now()
      WHERE id = v_code_id;

      -- Créer la réservation liée à la purchase
      INSERT INTO public.cart_reservations (user_id, gift_code_id, purchase_id)
      VALUES (p_user_id, v_code_id, v_purchase_id);

      -- Créer le purchase_item correspondant
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

      -- Accumuler les infos pour la réponse
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
    'reserved_codes', reserved_codes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_reserve_codes TO authenticated;


-- ----------------------------------------------------------
-- 7. RPC finalize_purchase
--    Passe les codes en 'sold' et la purchase en 'paid'
--    dans une seule transaction atomique.
--    Appelé soit par le webhook Stripe, soit directement
--    pour les paiements locaux (Djamo, Moov, Wave).
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.finalize_purchase(
  p_purchase_id       uuid,
  p_stripe_session_id text DEFAULT NULL
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

  -- Récupérer les codes avec le nom de produit lisible pour l'email
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

  -- Marquer les codes comme vendus (satisfait gift_codes_sold_requires_*)
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
    status            = 'paid',
    stripe_session_id = COALESCE(p_stripe_session_id, stripe_session_id),
    updated_at        = now()
  WHERE id = p_purchase_id;

  -- Supprimer les réservations : le trigger DELETE vérife status='reserved'
  -- mais les codes sont maintenant 'sold' → le trigger est no-op
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

-- Le webhook (service_role) et le checkout local (authenticated) l'appellent tous les deux
GRANT EXECUTE ON FUNCTION public.finalize_purchase TO authenticated, service_role;
