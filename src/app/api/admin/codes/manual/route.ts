import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const addCodesSchema = z.object({
  product_id: z.string().uuid(),
  codes: z.array(
    z.object({
      code: z.string().min(1),
      buy_price: z.number().nonnegative(),
      expires_at: z.string().optional(),
    })
  ),
  batch_reference: z.string().optional(),
});

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

// POST: Add codes manually
export async function POST(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = addCodesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { codes, product_id, batch_reference } = parsed.data;

    // Prepare codes for insertion
    const codesToInsert = codes.map((c) => ({
      product_id,
      code: c.code,
      buy_price: c.buy_price,
      batch_reference,
      expires_at: c.expires_at || null,
      status: "available",
    }));

    const { data, error } = await supabase
      .from("gift_codes")
      .insert(codesToInsert)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, count: data?.length || 0 }, { status: 201 });
  } catch (error) {
    console.error("Add codes error:", error);
    return NextResponse.json({ error: "Failed to add codes" }, { status: 500 });
  }
}
