import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail, sendImplicitAccountActivationEmail } from "@/app/api/checkout/route";

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
  const mac = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(signature));
  } catch {
    return false;
  }
}

function problemDetail(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail, instance: "/api/webhooks/geniuspay" },
    { status },
  );
}

export async function POST(req: NextRequest) {
  const signature  = req.headers.get("x-webhook-signature")  ?? "";
  const timestamp  = req.headers.get("x-webhook-timestamp")  ?? "";
  const event      = req.headers.get("x-webhook-event")      ?? "";
  const deliveryId = req.headers.get("x-webhook-delivery")   ?? "";
  const retryNum   = req.headers.get("x-webhook-retry")      ?? "0";
  const rawBody    = await req.text();

  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GENIUSPAY_WEBHOOK_SECRET not configured");
    return problemDetail(500, "Internal Server Error", "Server misconfiguration");
  }

  // 1. Verify required headers
  if (!signature || !timestamp || !event) {
    return problemDetail(400, "Bad Request", "Required header is not present.");
  }

  // 2. Verify HMAC-SHA256: sign(timestamp + "." + rawBody, secret)
  if (!verifySignature(rawBody, timestamp, signature, secret)) {
    console.warn("GeniusPay webhook: invalid signature", { event, deliveryId, retry: retryNum });
    return problemDetail(401, "Unauthorized", "Invalid signature");
  }

  // 3. Replay-attack guard — real protection is HMAC + idempotency.
  // Allow 24 h so GeniusPay retries (5 min → 30 min → 2 h → 6 h) are not rejected.
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 86400) {
    return problemDetail(400, "Bad Request", "Timestamp too old");
  }

  // 4. webhook.test — acknowledge without processing
  if (event === "webhook.test") {
    console.log("GeniusPay webhook: test received", { deliveryId });
    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  }

  // 5. Parse payload
  let payload: {
    id?: string;
    data?: {
      id?: number;
      reference?: string;
      amount?: number;
      payment_method?: string;
      metadata?: { purchase_id?: string };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return problemDetail(400, "Bad Request", "Failed to read request");
  }

  const transaction = payload.data;
  const reference   = transaction?.reference;

  const supabase = createAdminClient();

  // 6. Idempotency — payload.id === X-Webhook-Delivery per GeniusPay spec
  const idempotencyKey = deliveryId || payload.id || `${reference}:${event}`;
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("provider", "geniuspay")
    .eq("event_id", idempotencyKey)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  }

  await supabase.from("webhook_events").insert({
    provider:   "geniuspay",
    event_id:   idempotencyKey,
    event_type: event,
  });

  console.log("GeniusPay webhook received", { event, deliveryId, reference, retry: retryNum });

  // 7. Handle events
  switch (event) {
    case "payment.initiated": {
      // Purchase already created pending by checkout — nothing to do
      break;
    }

    case "payment.success": {
      const purchaseId = transaction?.metadata?.purchase_id;
      if (!reference || !purchaseId) {
        console.error("GeniusPay webhook: missing reference or purchase_id", { event, payload });
        return problemDetail(400, "Bad Request", "Missing reference or purchase_id in metadata");
      }

      const { data: finalized, error: finalizeError } = await supabase.rpc(
        "finalize_purchase",
        { p_purchase_id: purchaseId, p_geniuspay_reference: reference },
      );

      if (finalizeError) {
        console.error("finalize_purchase (geniuspay) failed:", finalizeError, { purchaseId, reference });
        return problemDetail(500, "Internal Server Error", "Failed to process webhook");
      }

      const result = finalized as PurchaseResult;
      let emailTo = result?.customer_email;
      let activationLink: string | null = null;
      let customerName = result?.customer_name;

      if (result?.purchase_id) {
        const { data: pd } = await supabase
          .from("purchases")
          .select("customer_email, customer_name, activation_link, user:user_id(email)")
          .eq("id", result.purchase_id)
          .single();
        if (!emailTo) {
          const rawUser = pd?.user;
          const userEmail = ((Array.isArray(rawUser) ? rawUser[0] : rawUser) as { email?: string } | null)?.email ?? null;
          emailTo = pd?.customer_email || userEmail || null;
        }
        activationLink = (pd as { activation_link?: string | null } | null)?.activation_link ?? null;
        customerName = pd?.customer_name || customerName;
      }

      if (emailTo) {
        try {
          await sendPurchaseConfirmationEmail(emailTo, { ...result, customer_email: emailTo });
        } catch (e) {
          console.error("GeniusPay webhook confirmation email failed:", e);
        }
        if (activationLink) {
          try {
            await sendImplicitAccountActivationEmail(emailTo, customerName, activationLink);
          } catch (e) {
            console.error("GeniusPay webhook activation email failed:", e);
          }
        }
      }
      break;
    }

    case "payment.failed":
    case "payment.expired":
    case "payment.cancelled": {
      const purchaseId = transaction?.metadata?.purchase_id;
      if (!purchaseId) {
        console.warn("GeniusPay webhook: missing purchase_id for cancel event", { event, reference });
        break;
      }
      const { error: cancelError } = await supabase.rpc("cancel_purchase", { p_purchase_id: purchaseId });
      if (cancelError) {
        console.error("cancel_purchase failed:", cancelError, { purchaseId });
        return problemDetail(500, "Internal Server Error", "Failed to process webhook");
      }
      break;
    }

    case "payment.refunded": {
      if (reference) {
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("geniuspay_reference", reference);
      }
      console.log("GeniusPay webhook: payment refunded", { reference, amount: transaction?.amount });
      break;
    }

    case "cashout.requested":
    case "cashout.approved":
    case "cashout.completed":
    case "cashout.failed": {
      console.log(`GeniusPay webhook: cashout event "${event}"`, { reference, amount: transaction?.amount });
      break;
    }

    default:
      console.log(`GeniusPay webhook: unhandled event "${event}"`, { deliveryId });
  }

  return NextResponse.json({ success: true, message: "Webhook processed successfully" });
}
