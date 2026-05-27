import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail, sendImplicitAccountActivationEmail } from "@/app/api/checkout/route";

interface PurchaseResult {
  purchase_id: string;
  customer_email: string | null;
  customer_name: string;
  total_amount: number;
  codes: Array<{ code: string; product_name: string; unit_price: number }>;
}

export async function POST(request: Request) {
  const stripe = getStripeServer();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Signature Stripe ou secret webhook manquant" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature error:", error);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // Use service-role client: bypasses RLS on webhook_events and purchase tables
  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Idempotency guard — Stripe may retry webhooks
        const { data: existingEvent } = await supabase
          .from("webhook_events")
          .select("id")
          .eq("provider", "stripe")
          .eq("event_id", event.id)
          .single();

        if (existingEvent) {
          return NextResponse.json({ received: true });
        }

        await supabase.from("webhook_events").insert({
          provider:   "stripe",
          event_id:   event.id,
          event_type: "checkout.session.completed",
        });

        const purchaseId = session.metadata?.purchase_id;
        if (!purchaseId) {
          console.error("checkout.session.completed: missing purchase_id in metadata", session.id);
          break;
        }

        // Finalize atomically: codes → sold, purchase → paid, reservations deleted
        const { data: finalized, error: finalizeError } = await supabase.rpc(
          "finalize_purchase",
          { p_purchase_id: purchaseId, p_stripe_session_id: session.id },
        );

        if (finalizeError) {
          console.error("finalize_purchase failed:", finalizeError, { purchaseId });
          // Return 500 so Stripe retries the webhook
          return NextResponse.json(
            { error: "Erreur finalisation achat" },
            { status: 500 },
          );
        }

        const result = finalized as PurchaseResult;

        let activationLink: string | null = null;
        let customerName = result?.customer_name;
        if (result?.purchase_id) {
          const { data: pd } = await supabase
            .from("purchases")
            .select("activation_link, customer_name")
            .eq("id", result.purchase_id)
            .single();
          activationLink = (pd as { activation_link?: string | null } | null)?.activation_link ?? null;
          customerName = pd?.customer_name || customerName;
        }

        if (result?.customer_email) {
          try {
            await sendPurchaseConfirmationEmail(result.customer_email, result);
          } catch (e) {
            console.error("Stripe webhook confirmation email failed:", e);
          }
          if (activationLink) {
            try {
              await sendImplicitAccountActivationEmail(result.customer_email, customerName, activationLink);
            } catch (e) {
              console.error("Stripe webhook activation email failed:", e);
            }
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.purchase_id;

        if (!purchaseId) break;

        // The cart_reservation expiry (32 min) and purge_expired_reservations()
        // handle cleanup automatically. Optionally mark purchase as failed here.
        await supabase
          .from("purchases")
          .update({ status: "failed" })
          .eq("id", purchaseId)
          .eq("status", "pending");

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Erreur traitement webhook" }, { status: 500 });
  }
}
