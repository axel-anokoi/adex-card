import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServer() {
  if (stripeClient) return stripeClient;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing.");
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-04-30.basil",
  });

  return stripeClient;
}
