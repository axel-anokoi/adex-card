-- Sécurité : un client ne peut lire un gift_code que si la purchase associée
-- est en statut 'paid'. Si le paiement GeniusPay a échoué/expiré/annulé,
-- le code n'est pas renvoyé par la DB, même si purchase_items conserve
-- le gift_code_id (cancel_purchase ne le nulle pas).
drop policy if exists "gift_codes_read_own" on public.gift_codes;
create policy "gift_codes_read_own"
on public.gift_codes
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.purchase_items pi
    join public.purchases p on p.id = pi.purchase_id
    where pi.gift_code_id = gift_codes.id
      and p.user_id = auth.uid()
      and p.status = 'paid'
  )
);
