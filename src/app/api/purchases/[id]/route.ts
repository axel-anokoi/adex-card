import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public polling endpoint — purchase_id is a random UUID (128-bit secret)
// Returns status + codes once paid. Safe to expose: UUID is known only to the buyer.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: purchase, error } = await supabase
    .from("purchases")
    .select(`
      id,
      status,
      total_amount,
      customer_email,
      customer_name,
      purchase_items (
        gift_code:gift_code_id ( code ),
        product:product_id (
          amount,
          category:category_id ( name )
        ),
        unit_price
      )
    `)
    .eq("id", id)
    .single();

  if (error || !purchase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only return codes once the purchase is confirmed paid
  if (purchase.status !== "paid") {
    return NextResponse.json({ status: purchase.status });
  }

  // Supabase returns arrays for nested selects; normalize to single object
  const codes = (purchase.purchase_items ?? []).map((item: Record<string, unknown>) => {
    const gc      = Array.isArray(item.gift_code)  ? item.gift_code[0]  : item.gift_code  as { code?: string } | null;
    const product = Array.isArray(item.product)    ? item.product[0]    : item.product    as { amount?: number; category?: { name?: string } | { name?: string }[] | null } | null;
    const cat     = product?.category
      ? (Array.isArray(product.category) ? product.category[0] : product.category) as { name?: string } | null
      : null;
    return {
      code:         gc?.code ?? "",
      product_name: cat?.name ? `${cat.name} ${product?.amount ?? ""} FCFA` : "Produit",
      unit_price:   (item.unit_price as number) ?? 0,
    };
  });

  return NextResponse.json({
    status:         purchase.status,
    total_amount:   purchase.total_amount,
    customer_email: purchase.customer_email,
    customer_name:  purchase.customer_name,
    codes,
  });
}
