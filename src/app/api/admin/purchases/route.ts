import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase: null };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { isAdmin: userData?.role === "admin", user, supabase };
}

// GET: List all purchases with full buyer + product details
export async function GET(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || "100";

    let query = supabase
      .from("purchases")
      .select(`
        id,
        total_amount,
        total_cost,
        total_profit,
        status,
        payment_method,
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        user:user_id(
          email,
          nom,
          prenoms,
          telephone
        ),
        purchase_items(
          id,
          quantity,
          unit_price,
          total_price,
          unit_cost,
          product:product_id(
            id,
            amount,
            sell_price,
            buy_price,
            category:category_id(
              name,
              slug,
              logo_url
            )
          ),
          gift_code:gift_code_id(
            code
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Use stored cost/profit; fall back to item-level calculation for legacy rows
    const enriched = (data || []).map((purchase) => {
      let totalBuyCost = purchase.total_cost ?? 0;
      let profit = purchase.total_profit ?? 0;

      if (!purchase.total_cost) {
        const items = purchase.purchase_items || [];
        totalBuyCost = items.reduce((sum: number, item: { quantity: number; unit_cost?: number; product: { buy_price?: number } | null }) => {
          return sum + (item.unit_cost ?? item.product?.buy_price ?? 0) * item.quantity;
        }, 0);
        profit = purchase.total_amount - totalBuyCost;
      }

      return {
        ...purchase,
        total_buy_cost: totalBuyCost,
        profit,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error("Purchases list error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}
