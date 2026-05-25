-- ============================================================
-- dynamic_reservation_duration.sql
-- Objectif : rendre la durée de réservation configurable
--   sans migration ni redéploiement — modifiable via SQL :
--   UPDATE app_settings SET value = '45' WHERE key = 'reservation_duration_minutes';
-- ============================================================


-- ----------------------------------------------------------
-- 1. Table de configuration générale de l'application
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Valeur initiale : 32 minutes (alignée sur la limite Stripe de 30 min + marge)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'reservation_duration_minutes',
  '32',
  'Durée de réservation exclusive des codes en minutes (min : 10, max : 120). Modifiable à chaud.'
)
ON CONFLICT (key) DO NOTHING;

-- RLS : seule la couche service_role (webhooks, migrations) peut modifier.
-- Les fonctions SECURITY DEFINER lisent en contournant RLS.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_no_client_access" ON public.app_settings;
CREATE POLICY "app_settings_no_client_access"
  ON public.app_settings
  FOR ALL
  USING (false)
  WITH CHECK (false);


-- ----------------------------------------------------------
-- 2. checkout_reserve_codes — lit la durée depuis app_settings
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
  v_purchase_id         uuid;
  v_active_count        integer;
  v_expires_at          timestamptz;
  v_reservation_minutes integer;
  item_rec              jsonb;
  qty_i                 integer;
  v_code_id             uuid;
  v_code                text;
  reserved_codes        jsonb := '[]'::jsonb;
BEGIN
  -- Lire la durée de réservation depuis la config (défaut sécurisé : 32 min)
  SELECT COALESCE(value::integer, 32)
  INTO v_reservation_minutes
  FROM public.app_settings
  WHERE key = 'reservation_duration_minutes';

  -- Pas de config trouvée → valeur par défaut
  IF v_reservation_minutes IS NULL THEN
    v_reservation_minutes := 32;
  END IF;

  -- Clamp : jamais moins de 10 min ni plus de 120 min (évite les valeurs aberrantes)
  v_reservation_minutes := GREATEST(10, LEAST(120, v_reservation_minutes));

  -- Purge globale : libère TOUS les codes expirés de tous les utilisateurs.
  -- Le trigger trg_cart_reservation_delete remet automatiquement chaque
  -- gift_code en 'available' au fil des suppressions.
  -- Purger globalement (et non seulement l'utilisateur courant) garantit que
  -- les codes abandonnés par d'autres sessions sont récupérables immédiatement.
  DELETE FROM public.cart_reservations WHERE expires_at < now();

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
      -- Verrouillage atomique : SKIP LOCKED garantit zéro race condition.
      -- On inclut aussi les codes 'reserved' dont la réservation a expiré
      -- (filet de sécurité si la purge globale ci-dessus n'a pas encore tourné).
      SELECT gc.id, gc.code
      INTO v_code_id, v_code
      FROM public.gift_codes gc
      WHERE gc.product_id = (item_rec->>'product_id')::uuid
        AND (
          gc.status = 'available'
          OR (
            gc.status = 'reserved'
            AND NOT EXISTS (
              SELECT 1 FROM public.cart_reservations cr
              WHERE cr.gift_code_id = gc.id
                AND cr.expires_at > now()
            )
          )
        )
        AND (gc.expires_at IS NULL OR gc.expires_at > now()::date)
      LIMIT 1
      FOR UPDATE SKIP LOCKED;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'gift_code_not_available'
          USING HINT    = item_rec->>'product_id',
                DETAIL  = format('Aucun code disponible pour le produit %s', item_rec->>'product_id');
      END IF;

      -- Supprimer toute réservation expirée résiduelle sur ce code
      -- (évite la violation de contrainte unique cart_reservations_gift_code_id_key)
      DELETE FROM public.cart_reservations
      WHERE gift_code_id = v_code_id AND expires_at < now();

      -- Pré-réserver le code
      UPDATE public.gift_codes
      SET
        status          = 'reserved',
        sold_to_user_id = p_user_id,
        updated_at      = now()
      WHERE id = v_code_id;

      -- Insérer la réservation avec expires_at calculé dynamiquement
      INSERT INTO public.cart_reservations (user_id, gift_code_id, purchase_id, expires_at)
      VALUES (
        p_user_id,
        v_code_id,
        v_purchase_id,
        now() + (v_reservation_minutes || ' minutes')::interval
      )
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
    'purchase_id',             v_purchase_id,
    'reserved_codes',          reserved_codes,
    'expires_at',              v_expires_at,
    'reservation_duration_min', v_reservation_minutes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkout_reserve_codes TO authenticated;


-- ----------------------------------------------------------
-- NOTE : pg_cron (optionnel mais recommandé)
-- Purge de fond toutes les 10 minutes pour libérer les codes
-- abandonnés même quand personne ne passe en caisse.
--
-- Activer l'extension depuis le dashboard Supabase :
--   Database → Extensions → pg_cron → Enable
--
-- Puis exécuter une seule fois :
--   SELECT cron.schedule(
--     'purge-expired-reservations',
--     '*/10 * * * *',
--     $$ SELECT public.purge_expired_reservations(); $$
--   );
--
-- Vérifier / supprimer le job :
--   SELECT * FROM cron.job;
--   SELECT cron.unschedule('purge-expired-reservations');
-- ----------------------------------------------------------
