import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  playstation: "🎮",
  xbox: "🎯",
  nintendo: "🍄",
  apple: "🍎",
};

// Category tags mapping
const CATEGORY_TAGS: Record<string, string> = {
  playstation: "PSN",
  xbox: "Game Pass",
  nintendo: "Switch",
  apple: "iTunes",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = searchParams.get("limit") || "50";

    const supabase = await createClient();

let query = supabase
      .from("products")
      .select(`
        id,
        category:category_id(slug, name, logo_url),
        amount,
        sell_price,
        stock_available,
        is_active,
        image_url
      `)
      .eq("is_active", true)
      .order("amount", { ascending: true })
      .limit(parseInt(limit));

    if (category) {
      query = query.eq("category.slug", category);
    }

    const { data, error } = await query;

    console.log("Products fetched:", { category, limit, count: data?.length || 0, error });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

// Transform data to include generated name, image, and tag
    const transformedProducts = data.map((product: any) => {
      const catSlug = product.category?.slug || "unknown";
      const catName = product.category?.name || "Unknown";
      const logoUrl = product.category?.logo_url;

      console.log("Transforming product:", { id: product.id, catSlug, catName, amount: product.amount, sellPrice: product.sell_price, logoUrl });

      return {
        id: product.id,
        name: `Carte ${catName} ${product.amount}€`,
        eur: product.sell_price,
        amount: product.amount,
        cat: catSlug,
        tag: CATEGORY_TAGS[catSlug] || catName,
        image: product.image_url || logoUrl || CATEGORY_ICONS[catSlug] || "💳",
        stock_available: product.stock_available,
        is_active: product.is_active,
      };
    });

    // Group by category for the frontend
    const groupedProducts = transformedProducts.reduce((acc: any, product: any) => {
      const cat = product.cat;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(product);
      return acc;
    }, {});

    return NextResponse.json({ 
      data: transformedProducts,
      grouped: groupedProducts,
      categories: Object.keys(groupedProducts)
    });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
