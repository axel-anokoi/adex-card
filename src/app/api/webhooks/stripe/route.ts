import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";

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

  const { createClient } = await import("@/lib/supabase/server");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);

        // Check if already processed
        const supabase = await createClient();
        const { data: existingEvent } = await supabase
          .from("webhook_events")
          .select("id")
          .eq("provider", "stripe")
          .eq("event_id", event.id)
          .single();

        if (existingEvent) {
          console.log("Event already processed:", event.id);
          return NextResponse.json({ received: true });
        }

        // Record webhook event for idempotency
        await supabase
          .from("webhook_events")
          .insert({ provider: "stripe", event_id: event.id, event_type: "checkout.session.completed" });

        // Fetch session details with Stripe
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });

        // Update purchase status and assign codes
        if (fullSession.client_reference_id) {
          // TODO: Implement purchase update and code assignment
          // This should be done in a transaction to ensure atomicity
          const { error: updateError } = await supabase
            .from("purchases")
            .update({ status: "paid" })
            .eq("stripe_session_id", session.id);

          if (updateError) {
            console.error("Failed to update purchase:", updateError);
          }
        }

        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Erreur traitement webhook" }, { status: 500 });
  }
}
