import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        category:category_id(id, slug, name),
        amount,
        sell_price,
        buy_price,
        stock_available,
        is_active,
        created_at
      `)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement du produit" }, { status: 500 });
  }
}
