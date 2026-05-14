import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const useDiscountSchema = z.object({
  discount_code_id: z.string().uuid(),
  purchase_id: z.string().uuid(),
  discount_applied: z.number().nonnegative(),
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
    const parsed = useDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { discount_code_id, purchase_id, discount_applied } = parsed.data;

    // Record the usage
    const { error: insertError } = await supabase
      .from("discount_code_uses")
      .insert({
        discount_code_id,
        user_id: user.id,
        purchase_id,
        discount_applied,
      });

    if (insertError) {
      console.error("Record discount use error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Increment the uses_count for the discount code
    const { error: updateError } = await supabase.rpc("increment_discount_uses", {
      p_discount_code_id: discount_code_id,
    });

    if (updateError) {
      console.error("Increment uses error:", updateError);
      // Continue anyway - usage is recorded
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discount use error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
