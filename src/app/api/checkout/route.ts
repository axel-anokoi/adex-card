import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripeServer } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        unitAmount: z.number().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = checkoutSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload checkout invalide", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const stripe = getStripeServer();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: parsed.data.items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.unitAmount * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        source: "adex-cards",
      },
    });

    return NextResponse.json({ data: { url: session.url, id: session.id } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erreur interne checkout" }, { status: 500 });
  }
}
