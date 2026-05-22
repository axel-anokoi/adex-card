import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail } from "@/app/api/checkout/route";

interface PurchaseResult {
  purchase_id: string;
  customer_email: string | null;
  customer_name: string;
  total_amount: number;
  codes: Array<{ code: string; product_name: string; unit_price: number }>;
}

function verifySignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  // GeniusPay HMAC-SHA256: sign(timestamp + "." + rawBody, secret)
  const mac = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const signature  = req.headers.get("x-webhook-signature")  ?? "";
  const timestamp  = req.headers.get("x-webhook-timestamp")  ?? "";
  const event      = req.headers.get("x-webhook-event")      ?? "";
  // X-Webhook-Delivery is the canonical unique delivery ID for idempotency (optional per spec)
  const deliveryId = req.headers.get("x-webhook-delivery")   ?? "";
  const rawBody    = await req.text();

  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GENIUSPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // 1. Verify required headers
  if (!signature || !timestamp || !event) {
    return NextResponse.json({ error: "Required header is not present." }, { status: 400 });
  }

  // 2. Verify HMAC-SHA256 signature
  if (!verifySignature(rawBody, timestamp, signature, secret)) {
    console.warn("GeniusPay webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Replay-attack guard: reject webhooks older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return NextResponse.json({ error: "Timestamp too old" }, { status: 400 });
  }

  // 4. webhook.test — acknowledge without processing
  if (event === "webhook.test") {
    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  }

  // 5. Parse payload
  let payload: {
    data?: {
      reference?: string;
      payment_method?: string;
      metadata?: { purchase_id?: string };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const transaction = payload.data;
  const reference   = transaction?.reference;
  const purchaseId  = transaction?.metadata?.purchase_id;

  if (!reference || !purchaseId) {
    console.error("GeniusPay webhook: missing reference or purchase_id", payload);
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 6. Idempotency: use X-Webhook-Delivery when present, fall back to reference:event
  const idempotencyKey = deliveryId || `${reference}:${event}`;
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "geniuspay")
    .eq("event_id", idempotencyKey)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true });
  }

  await supabase.from("webhook_events").insert({
    provider:   "geniuspay",
    event_id:   idempotencyKey,
    event_type: event,
  });

  // 7. Handle events
  switch (event) {
    case "payment.success": {
      const { data: finalized, error: finalizeError } = await supabase.rpc(
        "finalize_purchase",
        {
          p_purchase_id:         purchaseId,
          p_geniuspay_reference: reference,
        },
      );

      if (finalizeError) {
        console.error("finalize_purchase (geniuspay) failed:", finalizeError, {
          purchaseId,
          reference,
        });
        // Return 500 so GeniusPay retries the webhook automatically
        return NextResponse.json({ error: "Erreur finalisation achat" }, { status: 500 });
      }

      const result = finalized as PurchaseResult;
      if (result?.customer_email) {
        sendPurchaseConfirmationEmail(result.customer_email, result).catch((e) =>
          console.error("GeniusPay webhook email failed:", e),
        );
      }
      break;
    }

    case "payment.failed":
    case "payment.expired":
    case "payment.cancelled": {
      // cancel_purchase : passe en failed + libère les codes réservés atomiquement
      const { error: cancelError } = await supabase.rpc("cancel_purchase", {
        p_purchase_id: purchaseId,
      });
      if (cancelError) {
        console.error("cancel_purchase failed:", cancelError, { purchaseId });
        return NextResponse.json({ error: "Erreur annulation achat" }, { status: 500 });
      }
      break;
    }

    default:
      console.log(`GeniusPay webhook: unhandled event "${event}"`);
  }

  return NextResponse.json({ success: true, message: "Webhook processed successfully" });
}
