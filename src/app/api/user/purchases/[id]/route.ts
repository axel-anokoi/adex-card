import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        user_id,
        purchase_items(
          id,
          product:product_id(id, amount, category:category_id(name)),
          gift_code:gift_code_id(code, expires_at),
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (data.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Purchase detail error:", error);
    return NextResponse.json({ error: "Failed to fetch purchase" }, { status: 500 });
  }
}
