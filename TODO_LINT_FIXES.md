# Lint Fixes TODO

## Summary: 31 Errors, 50 Warnings

### Errors to Fix:

#### 1. `react/no-unescaped-entities` (7 files) - Unescaped `'` characters
- [ ] `src/app/(public)/forgot-password/page.tsx` line 141
- [ ] `src/app/(public)/reset-password/page.tsx` line 208
- [ ] `src/app/(public)/shop/[slug]/page.tsx` line 70 (two: L'accès, n'a)
- [ ] `src/components/admin/audit-logs.tsx` lines 40, 52
- [ ] `src/components/admin/sales-chart.tsx` line 86
- [ ] `src/components/admin/product-manager.tsx` line 280

#### 2. `react-hooks/set-state-in-effect` (12 files) - Calling setState directly in useEffect
- [ ] `src/app/(public)/dashboard/page.tsx` line 71
- [ ] `src/components/admin/category-manager.tsx` line 67
- [ ] `src/components/admin/client-manager.tsx` line 442
- [ ] `src/components/admin/code-manager.tsx` line 69
- [ ] `src/components/admin/payments-tab.tsx` line 346
- [ ] `src/components/admin/product-manager.tsx` line 90
- [ ] `src/components/admin/stats/stats-tab.tsx` line 64
- [ ] `src/components/products/ProductModal.tsx` line 109
- [ ] `src/context/CartContext.tsx` lines 42, 75

#### 3. `@typescript-eslint/no-explicit-any` (7 files) - Using `any` type
- [ ] `src/app/api/admin/purchases/route.ts` line 97
- [ ] `src/app/api/admin/stats/route.ts` lines 138, 163
- [ ] `src/app/api/products/route.ts` line 56, 78
- [ ] `src/components/admin/stats/category-pie-chart.tsx` line 78
- [ ] `src/components/categories/categorie-section.tsx` lines 448, 470
- [ ] `src/context/CartContext.tsx` lines 20, 61, 85

### Warnings to Fix (50):

#### 4. `@typescript-eslint/no-unused-vars` (multiple files)
- Remove unused imports/variables

#### 5. `@next/next/no-img-element` (multiple files)
- Replace `<img>` with Next.js `<Image>` component

## Fix Priority:
1. First: Fix all Errors (blocks CI)
2. Then: Fix Warnings (optional but recommended)

## Strategy:
- For unescaped entities: Replace `'` with `\'` or use HTML entity `&#39;`
- For set-state in effect: Use patterns like useSyncExternalStore or initialize state directly
- For any types: Define proper interfaces
- For unused vars: Remove them
- For img elements: Use next/image or suppress warnings where needed (external URLs)
