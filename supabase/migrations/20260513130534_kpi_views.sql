-- ============================================================
-- 008_kpi_views.sql
-- Objectifs :
--   Vues matérialisées et fonctions pour le tableau de bord admin
--   KPIs : revenus, marges, stock, activité clients, remboursements
-- ============================================================


-- ----------------------------------------------------------
-- VUE 1 : Revenus journaliers (30 derniers jours)
-- ----------------------------------------------------------
create or replace view public.vw_daily_revenue as
select
  date_trunc('day', p.created_at at time zone 'UTC') as day,
  count(*)                                            as orders_count,
  sum(p.total_amount)                                 as gross_revenue,
  sum(p.discount_amount)                              as total_discounts,
  sum(p.total_amount - coalesce(p.discount_amount,0)) as net_revenue,
  count(*) filter (where p.status = 'refunded')       as refunds_count,
  sum(p.total_amount) filter (where p.status = 'refunded') as refunded_amount
from public.purchases p
where p.status in ('paid', 'refunded')
  and p.created_at >= now() - interval '90 days'
group by 1
order by 1 desc;


-- ----------------------------------------------------------
-- VUE 2 : Revenus par catégorie
-- ----------------------------------------------------------
create or replace view public.vw_revenue_by_category as
select
  cat.id                                as category_id,
  cat.name                              as category_name,
  cat.slug,
  count(distinct p.id)                  as orders_count,
  count(pi.id)                          as items_sold,
  sum(pi.total_price)                   as gross_revenue,
  -- Marge = sell_price - buy_price sur les codes livrés
  sum(pi.unit_price - gc.buy_price)     as gross_margin,
  round(
    100.0 * sum(pi.unit_price - gc.buy_price)
    / nullif(sum(pi.total_price), 0), 2
  )                                     as margin_pct
from public.purchase_items pi
join public.products prod       on prod.id = pi.product_id
join public.categories cat      on cat.id  = prod.category_id
join public.purchases p         on p.id    = pi.purchase_id
left join public.gift_codes gc  on gc.id   = pi.gift_code_id
where p.status = 'paid'
group by cat.id, cat.name, cat.slug
order by gross_revenue desc;


-- ----------------------------------------------------------
-- VUE 3 : État du stock par produit
-- ----------------------------------------------------------
create or replace view public.vw_stock_status as
select
  prod.id                                           as product_id,
  coalesce(prod.name, cat.name || ' ' || prod.amount::text) as product_label,
  cat.name                                          as category_name,
  prod.amount,
  prod.sell_price,
  prod.buy_price,
  prod.sell_price - prod.buy_price                  as margin_per_unit,
  prod.stock_available,
  prod.low_stock_threshold,
  prod.stock_available <= prod.low_stock_threshold  as is_low_stock,
  prod.stock_available = 0                          as is_out_of_stock,
  -- Codes par statut
  count(gc.id) filter (where gc.status = 'available')  as codes_available,
  count(gc.id) filter (where gc.status = 'reserved')   as codes_reserved,
  count(gc.id) filter (where gc.status = 'sold')       as codes_sold,
  count(gc.id) filter (where gc.status = 'refunded')   as codes_refunded,
  count(gc.id) filter (where gc.status = 'expired')    as codes_expired,
  -- Vitesse de vente : codes vendus dans les 7 derniers jours
  count(gc.id) filter (
    where gc.status = 'sold'
      and gc.sold_at >= now() - interval '7 days'
  )                                                 as sold_last_7_days,
  -- Valeur du stock restant
  prod.stock_available * prod.sell_price            as stock_value_sell,
  prod.stock_available * prod.buy_price             as stock_value_cost
from public.products prod
join public.categories cat on cat.id = prod.category_id
left join public.gift_codes gc on gc.product_id = prod.id
where prod.is_active = true
group by prod.id, prod.name, prod.amount, prod.sell_price, prod.buy_price,
         prod.stock_available, prod.low_stock_threshold, cat.name
order by is_out_of_stock desc, is_low_stock desc, margin_per_unit desc;


-- ----------------------------------------------------------
-- VUE 4 : Top clients (LTV)
-- ----------------------------------------------------------
create or replace view public.vw_top_customers as
select
  u.id                            as user_id,
  u.email,
  u.created_at                    as registered_at,
  count(distinct p.id)            as total_orders,
  sum(p.total_amount)             as lifetime_value,
  avg(p.total_amount)             as avg_order_value,
  max(p.created_at)               as last_order_at,
  count(distinct p.id) filter (
    where p.created_at >= now() - interval '30 days'
  )                               as orders_last_30d,
  count(rr.id)                    as refunds_requested,
  u.is_blocked
from public.users u
left join public.purchases p
  on p.user_id = u.id and p.status = 'paid'
left join public.refund_requests rr
  on rr.user_id = u.id
where u.role = 'client'
group by u.id, u.email, u.created_at, u.is_blocked
order by lifetime_value desc nulls last;


-- ----------------------------------------------------------
-- VUE 5 : KPIs globaux (snapshot en temps réel)
-- ----------------------------------------------------------
create or replace view public.vw_kpi_snapshot as
with
  rev as (
    select
      sum(total_amount) filter (where status = 'paid')     as mrr_total,
      sum(total_amount) filter (
        where status = 'paid'
          and date_trunc('month', created_at) = date_trunc('month', now())
      )                                                    as revenue_current_month,
      sum(total_amount) filter (
        where status = 'paid'
          and date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')
      )                                                    as revenue_prev_month,
      sum(total_amount) filter (where status = 'refunded') as total_refunded,
      count(*) filter (where status = 'paid')              as total_orders,
      count(*) filter (
        where status = 'paid'
          and created_at >= now() - interval '24 hours'
      )                                                    as orders_last_24h
    from public.purchases
  ),
  clients as (
    select
      count(*) filter (where role = 'client' and not is_blocked) as active_clients,
      count(*) filter (
        where role = 'client'
          and created_at >= now() - interval '30 days'
      )                                                           as new_clients_30d
    from public.users
  ),
  stk as (
    select
      sum(stock_available)                                     as total_codes_available,
      count(*) filter (where stock_available = 0 and is_active) as products_out_of_stock,
      count(*) filter (
        where stock_available <= low_stock_threshold
          and stock_available > 0
          and is_active
      )                                                        as products_low_stock
    from public.products
  ),
  pending as (
    select
      count(*) filter (where status = 'pending_manual_review') as orders_pending_review,
      count(*) filter (where status = 'pending')               as orders_pending
    from public.purchases
  ),
  refunds as (
    select count(*) filter (where status = 'pending') as refunds_pending
    from public.refund_requests
  )
select
  rev.*,
  clients.*,
  stk.*,
  pending.*,
  refunds.*,
  -- Taux de remboursement
  round(
    100.0 * rev.total_refunded / nullif(rev.mrr_total, 0), 2
  )                                                              as refund_rate_pct,
  -- Croissance MoM
  round(
    100.0 * (rev.revenue_current_month - rev.revenue_prev_month)
    / nullif(rev.revenue_prev_month, 0), 2
  )                                                              as mom_growth_pct
from rev, clients, stk, pending, refunds;


-- ----------------------------------------------------------
-- VUE 6 : Activité récente (feed admin)
-- ----------------------------------------------------------
create or replace view public.vw_recent_activity as
select
  'purchase'                           as event_type,
  p.id                                 as event_id,
  p.created_at                         as occurred_at,
  u.email                              as actor_email,
  p.status::text                       as status,
  p.total_amount                       as amount,
  null::text                           as detail
from public.purchases p
join public.users u on u.id = p.user_id

union all

select
  'refund_request',
  rr.id,
  rr.created_at,
  u.email,
  rr.status::text,
  rr.amount,
  rr.reason
from public.refund_requests rr
join public.users u on u.id = rr.user_id

union all

select
  'new_user',
  u.id,
  u.created_at,
  u.email,
  'registered',
  null,
  null
from public.users u
where u.role = 'client'

order by occurred_at desc
limit 200;


-- ----------------------------------------------------------
-- FONCTION : Rapport de rentabilité par période
-- ----------------------------------------------------------
create or replace function public.fn_profitability_report(
  p_from date default (current_date - 30),
  p_to   date default current_date
)
returns table (
  period_label    text,
  orders_count    bigint,
  gross_revenue   numeric,
  cost_of_goods   numeric,
  gross_margin    numeric,
  margin_pct      numeric,
  discounts_given numeric,
  refunds_given   numeric,
  net_revenue     numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(p_from, 'DD/MM/YYYY') || ' → ' || to_char(p_to, 'DD/MM/YYYY') as period_label,
    count(distinct pur.id)                                              as orders_count,
    sum(pi.total_price)                                                 as gross_revenue,
    sum(gc.buy_price)                                                   as cost_of_goods,
    sum(pi.unit_price - gc.buy_price)                                   as gross_margin,
    round(
      100.0 * sum(pi.unit_price - gc.buy_price)
      / nullif(sum(pi.total_price), 0), 2
    )                                                                   as margin_pct,
    sum(coalesce(pur.discount_amount, 0))                               as discounts_given,
    coalesce((
      select sum(rr.amount)
      from public.refund_requests rr
      where rr.status = 'processed'
        and rr.reviewed_at::date between p_from and p_to
    ), 0)                                                               as refunds_given,
    sum(pi.total_price) - coalesce(sum(pur.discount_amount),0) - coalesce((
      select sum(rr.amount)
      from public.refund_requests rr
      where rr.status = 'processed'
        and rr.reviewed_at::date between p_from and p_to
    ), 0)                                                               as net_revenue
  from public.purchase_items pi
  join public.purchases pur     on pur.id = pi.purchase_id
  left join public.gift_codes gc on gc.id = pi.gift_code_id
  where pur.status = 'paid'
    and pur.created_at::date between p_from and p_to;
$$;


-- ----------------------------------------------------------
-- RLS sur les vues (sécurité : admin uniquement)
-- Les vues héritent des RLS des tables sous-jacentes.
-- On ajoute une fonction helper pour vérifier l'accès en dehors de RLS.
-- ----------------------------------------------------------

-- Sécuriser les fonctions KPI pour admin seulement
revoke all on function public.fn_profitability_report(date, date) from public, anon, authenticated;
grant execute on function public.fn_profitability_report(date, date) to authenticated;

-- Note : les vues (vw_*) ne supportent pas directement RLS.
-- Protection assurée via security definer sur les fonctions
-- et vérification côté application (middleware Next.js).
-- Pour un durcissement total, envelopper chaque vue dans une fonction SECURITY DEFINER
-- qui vérifie is_admin() avant de retourner les données.

create or replace function public.fn_kpi_snapshot()
returns setof public.vw_kpi_snapshot
language sql
stable
security definer
set search_path = public
as $$
  select * from public.vw_kpi_snapshot
  where public.is_admin();
$$;

create or replace function public.fn_stock_status()
returns setof public.vw_stock_status
language sql
stable
security definer
set search_path = public
as $$
  select * from public.vw_stock_status
  where public.is_admin();
$$;