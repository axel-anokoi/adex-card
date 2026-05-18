import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createDiscountSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.number().positive(),
  max_discount_amount: z.number().positive().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  min_order_amount: z.number().min(0).default(0),
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive().default(1),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { isAdmin: userData?.role === "admin", user, supabase };
}

// GET: List all discount codes
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Discounts error:", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

// POST: Create a new discount code
export async function POST(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Normalize code to uppercase
    const discountData = {
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
    };

    const { data, error } = await supabase
      .from("discount_codes")
      .insert(discountData)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ce code promo existe déjà" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Discount create error:", error);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
