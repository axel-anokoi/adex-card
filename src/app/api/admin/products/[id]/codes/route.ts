import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

// GET: List codes for a product
export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("gift_codes")
      .select(
        `
        id,
        code,
        status,
        buy_price,
        sold_to_user_id,
        sold_at,
        batch_reference,
        expires_at,
        created_at
      `
      )
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Codes list error:", error);
    return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
  }
}
