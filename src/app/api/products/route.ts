import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = searchParams.get("limit") || "12";

    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(`
        id,
        category:category_id(slug, name),
        amount,
        sell_price,
        stock_available,
        is_active
      `)
      .eq("is_active", true)
      .limit(parseInt(limit));

    if (category) {
      query = query.eq("category.slug", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
