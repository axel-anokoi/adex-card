import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { purchase_id, reason } = body;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!purchase_id || !reason) {
      return NextResponse.json(
        { error: "purchase_id and reason are required" },
        { status: 400 }
      );
    }

    // Verify purchase belongs to user
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select("id, user_id, status")
      .eq("id", purchase_id)
      .eq("user_id", user.id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.status !== "paid") {
      return NextResponse.json(
        { error: "Only paid purchases can be refunded" },
        { status: 400 }
      );
    }

    // Check for existing refund request
    const { data: existingRefund } = await supabase
      .from("refund_requests")
      .select("id")
      .eq("purchase_id", purchase_id)
      .neq("status", "rejected")
      .single();

    if (existingRefund) {
      return NextResponse.json(
        { error: "A refund request already exists for this purchase" },
        { status: 400 }
      );
    }

    // Create refund request
    const { error: refundError } = await supabase
      .from("refund_requests")
      .insert({
        purchase_id,
        user_id: user.id,
        reason,
        status: "pending",
      });

    if (refundError) {
      return NextResponse.json({ error: refundError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refund request error:", error);
    return NextResponse.json(
      { error: "Failed to create refund request" },
      { status: 500 }
    );
  }
}
