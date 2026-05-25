import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail } from "@/app/api/checkout/route";

const GENIUSPAY_BASE_URL = "https://pay.genius.ci/api/v1/merchant";

interface GeniusPayTransaction {
  id?: number;
  reference?: string;
  amount?: number;
  currency?: string;
  status?: "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded";
  payment_method?: string;
  customer?: { name?: string; email?: string; phone?: string };
  metadata?: { purchase_id?: string };
  created_at?: string;
  completed_at?: string;
}

interface PurchaseResult {
  purchase_id: string;
  customer_email: string | null;
  customer_name: string;
  total_amount: number;
  codes: Array<{ code: string; product_name: string; unit_price: number }>;
}

/**
 * GET /api/payment/verify?pid=<purchase_id>&reference=<geniuspay_reference>
 *
 * Called by the success page when GeniusPay redirects back with status=success.
 * Queries GET /api/v1/merchant/payments/{reference} directly and acts on the result:
 *   - completed  → finalize_purchase + email
 *   - failed / cancelled → cancel_purchase
 *   - pending / processing → return current status (keep polling)
 */
export async function GET(req: NextRequest) {
  const pid       = req.nextUrl.searchParams.get("pid")       ?? "";
  const reference = req.nextUrl.searchParams.get("reference") ?? "";

  if (!pid || !/^[0-9a-f-]{36}$/.test(pid)) {
    return NextResponse.json({ error: "Invalid pid" }, { status: 400 });
  }
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
  const secretKey = process.env.GENIUSPAY_SECRET_KEY;

  if (!publicKey || !secretKey) {
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }

  const supabase = createAdminClient();

  // ── 1. Check DB first — avoid re-processing if already finalized ────────────
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select(`
      id,
      status,
      total_amount,
      customer_email,
      customer_name,
      purchase_items (
        gift_code:gift_code_id ( code ),
        product:product_id (
          amount,
          category:category_id ( name )
        ),
        unit_price
      )
    `)
    .eq("id", pid)
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status === "paid") {
    return NextResponse.json({ status: "paid", codes: extractCodes(purchase) });
  }

  // ── 2. Query GeniusPay API for real-time transaction status ─────────────────
  let gpTx: GeniusPayTransaction | null = null;
  try {
    const gpRes = await fetch(`${GENIUSPAY_BASE_URL}/payments/${reference}`, {
      headers: {
        "X-API-Key":    publicKey,
        "X-API-Secret": secretKey,
        "Content-Type": "application/json",
      },
    });

    console.log("GeniusPay API response:", { status: gpRes, reference });

    if (gpRes.ok) {
      const gpData = await gpRes.json() as { success?: boolean; data?: GeniusPayTransaction };
      if (gpData.success && gpData.data) {
        gpTx = gpData.data;
      } else {
        console.warn("verify: GeniusPay returned success=false", { reference, gpData });
      }
    } else {
      const raw = await gpRes.text();
      console.error("verify: GeniusPay non-200", gpRes.status, raw.slice(0, 200), { reference });
    }
  } catch (e) {
    console.error("verify: GeniusPay fetch error", e, { reference });
    return NextResponse.json({ status: purchase.status ?? "pending" });
  }

  // GeniusPay API unavailable or returned no data — fall back to DB status
  if (!gpTx) {
    return NextResponse.json({ status: purchase.status ?? "pending" });
  }

  const gpStatus = gpTx.status;

  // ── 3a. Payment completed — finalize purchase + send email ─────────────────
  if (gpStatus === "completed") {
    const { data: finalized, error: finalizeError } = await supabase.rpc(
      "finalize_purchase",
      { p_purchase_id: pid, p_geniuspay_reference: reference },
    );

    if (finalizeError) {
      // Could be a race with the webhook — refetch to check real status
      console.error("verify: finalize_purchase error", finalizeError, { pid, reference });
      const { data: refetched } = await supabase
        .from("purchases")
        .select("status")
        .eq("id", pid)
        .single();

      if (refetched?.status === "paid") {
        return NextResponse.json({ status: "paid" });
      }
      return NextResponse.json({ status: "pending" });
    }

    const result = finalized as PurchaseResult;
    let emailTo = result?.customer_email;
    if (!emailTo && result?.purchase_id) {
      const { data: pd } = await supabase
        .from("purchases")
        .select("customer_email, user:user_id(email)")
        .eq("id", result.purchase_id)
        .single();
      const rawUser = pd?.user;
      const userEmail = ((Array.isArray(rawUser) ? rawUser[0] : rawUser) as { email?: string } | null)?.email ?? null;
      emailTo = pd?.customer_email || userEmail || null;
    }
    if (emailTo) {
      sendPurchaseConfirmationEmail(emailTo, { ...result, customer_email: emailTo }).catch((e) =>
        console.error("verify: confirmation email failed", e),
      );
    }

    return NextResponse.json({ status: "paid" });
  }

  // ── 3b. Payment definitively failed — cancel purchase (release codes) ──────
  if (gpStatus === "failed" || gpStatus === "cancelled") {
    const { error: cancelError } = await supabase.rpc("cancel_purchase", { p_purchase_id: pid });
    if (cancelError) {
      console.error("verify: cancel_purchase error", cancelError, { pid });
    }
    return NextResponse.json({ status: gpStatus });
  }

  // ── 3c. Still processing — return current status so client keeps polling ───
  // gpStatus === "pending" | "processing" | "refunded"
  return NextResponse.json({ status: gpStatus ?? purchase.status ?? "pending" });
}

function extractCodes(purchase: {
  purchase_items?: Array<Record<string, unknown>>;
}): Array<{ code: string; product_name: string; unit_price: number }> {
  return (purchase.purchase_items ?? []).map((item) => {
    const gc      = Array.isArray(item.gift_code) ? item.gift_code[0]  : item.gift_code  as { code?: string } | null;
    const product = Array.isArray(item.product)   ? item.product[0]    : item.product    as { amount?: number; category?: { name?: string } | { name?: string }[] | null } | null;
    const cat     = product?.category
      ? (Array.isArray(product.category) ? product.category[0] : product.category) as { name?: string } | null
      : null;
    return {
      code:         (gc as { code?: string } | null)?.code ?? "",
      product_name: cat?.name ? `${cat.name} ${product?.amount ?? ""} FCFA` : "Produit",
      unit_price:   (item.unit_price as number) ?? 0,
    };
  });
}
