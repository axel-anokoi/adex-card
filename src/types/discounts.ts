export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_discount_amount: number | null;
  product_id: string | null;
  category_id: string | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}
