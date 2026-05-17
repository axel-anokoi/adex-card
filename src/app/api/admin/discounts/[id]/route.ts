import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateDiscountSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed_amount"]).optional(),
  discount_value: z.number().positive().optional(),
  max_discount_amount: z.number().positive().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  min_order_amount: z.number().min(0).optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

// GET: Fetch single discount code
export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Discount fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch discount" }, { status: 500 });
  }
}

// PATCH: Update a discount code
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Normalize code to uppercase if provided
    const updateData = {
      ...parsed.data,
      code: parsed.data.code?.toUpperCase(),
    };

    const { data, error } = await supabase
      .from("discount_codes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Discount update error:", error);
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}

// DELETE: Delete a discount code
export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin || !supabase) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Discount deleted" }, { status: 200 });
  } catch (error) {
    console.error("Discount delete error:", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
