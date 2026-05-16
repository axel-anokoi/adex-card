import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, supabase: null };
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return { isAdmin: userData?.role === "admin", supabase };
}

const VALID_STATUSES = ["paid", "pending", "pending_manual_review", "failed", "refunded"] as const;

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();
    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
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
          unit_cost,
          total_price,
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
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Purchase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch purchase" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();
    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const { error } = await supabase
      .from("purchases")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Purchase update error:", error);
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}
