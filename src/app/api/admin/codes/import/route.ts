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

// POST: Import codes from CSV
export async function POST(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("product_id") as string;
    const batchReference = formData.get("batch_reference") as string | undefined;

    if (!file || !productId) {
      return NextResponse.json({ error: "Missing file or product_id" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have header and at least one row" }, { status: 400 });
    }

    // Parse CSV (simple parser - code,buy_price,expires_at)
    const codes = [];
    for (let i = 1; i < lines.length; i++) {
      const [code, buyPrice, expiresAt] = lines[i].split(",").map((v) => v.trim());

      if (!code) continue;

      codes.push({
        product_id: productId,
        code,
        buy_price: parseFloat(buyPrice) || 0,
        batch_reference: batchReference,
        expires_at: expiresAt || null,
        status: "available",
      });
    }

    if (codes.length === 0) {
      return NextResponse.json({ error: "No valid codes found in CSV" }, { status: 400 });
    }

    const { data, error } = await supabase.from("gift_codes").insert(codes).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, count: data?.length || 0 }, { status: 201 });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to import codes" }, { status: 500 });
  }
}
