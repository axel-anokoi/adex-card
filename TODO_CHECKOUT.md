# Checkout Page Redesign Plan

## Task
Diviser la page checkout en deux:
- Informations du client à gauche
- Récapitulatif et moyen de paiement à droite (moyen de paiement À L'INTÉRIEUR du Récapitulatif)

---

## Information Gathered
- Current checkout page has all sections stacked vertically in a single column
- Main sections: Cart items, User Identification (client info), Payment method, Récapitulatif
- Uses CSS grid with `gridTemplateColumns: "1fr"` (single column)
- Payment methods: Djamo, Moov Money, Wave

---

## Edit Plan

### Step 1: Modify Grid Layout
- Change `gridTemplateColumns: "1fr"` to `gridTemplateColumns: "1fr 1fr"` (two equal columns on desktop)
- Or better: `gridTemplateColumns: "1fr 420px"` for fixed right column

### Step 2: LEFT Column Structure
Keep as-is but focus on:
- Cart items section (optional - users may not need to see items again)
- User Identification (Informations client)

### Step 3: RIGHT Column Structure
- Move Payment method INSIDE the Récapitulatif (glass-cyan container)
- This means:
  1. Remove standalone payment method section
  2. Add payment method selection inside the glass-cyan Récapitulatif
  3. Keep order summary (items, subtotal, discount, total)
  4. Add payment method buttons before the CTA button

### Step 4: Responsive Design
- On mobile: stack as single column (already handled in media query)

---

## Files to Edit
- `src/app/(public)/checkout/page.tsx`

---

## Implementation Steps (for execution order)
1. Read the checkout page (already done)
2. Modify grid layout in the main container
3. Rearrange sections into LEFT/RIGHT columns
4. Move payment method section inside Récapitulatif
5. Update CSS to match new layout

---

## Followup Steps
- Test the checkout page in browser
- Ensure responsive design works correctly
- Verify all form inputs work properly
