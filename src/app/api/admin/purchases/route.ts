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

// GET: List all purchases
export async function GET(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit") || "50";

    let query = supabase
      .from("purchases")
      .select(`
        id,
        user:user_id(email),
        total_amount,
        status,
        created_at,
        purchase_items(
          product:product_id(amount, category:category_id(name)),
          quantity
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

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Purchases list error:", error);
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}
