import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const validateSchema = z.object({
  code: z.string().min(1),
  order_amount: z.number().positive(),
  product_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, order_amount, product_id, category_id } = parsed.data;

    // Call the PostgreSQL function to validate the discount code
    const { data, error } = await supabase.rpc("validate_discount_code", {
      p_code: code,
      p_user_id: user.id,
      p_order_amount: order_amount,
      p_product_id: product_id || null,
      p_category_id: category_id || null,
    });

    if (error) {
      console.error("Discount validation error:", error);
      return NextResponse.json({ error: "Erreur de validation" }, { status: 500 });
    }

    // data is an array with one row (table return from function)
    if (data && data.length > 0) {
      const result = data[0];
      
      if (!result.is_valid) {
        return NextResponse.json(
          { 
            is_valid: false, 
            error: result.rejection_reason,
            discount_applied: 0 
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        is_valid: true,
        discount_code_id: result.discount_code_id,
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        discount_applied: result.computed_discount,
      });
    }

    return NextResponse.json(
      { is_valid: false, error: "Code invalide", discount_applied: 0 },
      { status: 400 }
    );
  } catch (error) {
    console.error("Discount validation error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
