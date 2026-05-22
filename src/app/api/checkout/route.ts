import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";
import crypto from "crypto";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        eur: z.number().positive(),
        quantity: z.number().int().positive(),
        cat: z.string().optional(),
      }),
    )
    .min(1),
  paymentMethod: z.string().optional().default("geniuspay"),
  customer: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
  }),
  createAccountConsent: z.boolean().optional(),
  promo: z
    .object({ code: z.string(), discount: z.number() })
    .nullable()
    .optional(),
});

interface PurchaseResult {
  purchase_id: string;
  customer_email: string | null;
  customer_name: string;
  total_amount: number;
  codes: Array<{ code: string; product_name: string; unit_price: number }>;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = checkoutSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données de commande invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { items, paymentMethod, customer, promo, createAccountConsent } = parsed.data;
    const supabase = await createClient();
    let checkoutClient = supabase;
    let implicitAccountCreated = false;
    let activationLink: string | null = null;

    // Authentication required — sold_to_user_id NOT NULL constraint on gift_codes
    const { data: { user } } = await supabase.auth.getUser();
    let checkoutUserId = user?.id;

    if (!checkoutUserId) {
      if (!customer.email) {
        return NextResponse.json(
          { error: "Une adresse email est requise pour créer votre compte et envoyer vos codes." },
          { status: 400 },
        );
      }

      if (!createAccountConsent) {
        return NextResponse.json(
          { error: "Veuillez confirmer la création du compte avant de payer." },
          { status: 400 },
        );
      }

      checkoutClient = createAdminClient();

      const { data: existingProfile, error: existingProfileError } = await checkoutClient
        .from("users")
        .select("id")
        .eq("email", customer.email)
        .maybeSingle();

      if (existingProfileError) {
        console.error("Implicit account lookup error:", existingProfileError);
        return NextResponse.json(
          { error: "Erreur lors de la vérification du compte client" },
          { status: 500 },
        );
      }

      if (existingProfile) {
        checkoutUserId = existingProfile.id;
      } else {
        const nameParts = customer.fullName.trim().split(/\s+/);
        const nom = nameParts.slice(-1).join(" ");
        const prenoms = nameParts.slice(0, -1).join(" ") || customer.fullName.trim();
        const temporaryPassword = crypto.randomBytes(18).toString("base64url");

        const { data: createdUser, error: createUserError } =
          await checkoutClient.auth.admin.createUser({
            email: customer.email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
              nom,
              prenoms,
              telephone: customer.phone,
              implicit_checkout: true,
            },
          });

        if (createUserError || !createdUser.user) {
          console.error("Implicit account creation error:", createUserError);
          return NextResponse.json(
            { error: "Impossible de créer le compte client automatiquement" },
            { status: 500 },
          );
        }

        checkoutUserId = createdUser.user.id;
        implicitAccountCreated = true;

        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const { data: activationData, error: activationLinkError } =
          await checkoutClient.auth.admin.generateLink({
            type: "recovery",
            email: customer.email,
            options: { redirectTo: `${origin}/auth/callback?next=/activate` },
          });

        if (activationLinkError) {
          console.error("Implicit account activation link error:", activationLinkError);
        } else {
          activationLink = activationData.properties?.action_link ?? null;
        }
      }
    }

    // 1. Validate stock and fetch pricing from DB
    const productIds = items.map((item) => item.id);
    const { data: products, error: prodError } = await checkoutClient
      .from("products")
      .select("id, stock_available, buy_price, category_id")
      .in("id", productIds);

    if (prodError || !products) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des produits" },
        { status: 500 },
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product || item.quantity > product.stock_available) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${item.name}` },
          { status: 400 },
        );
      }
    }

    // 2. Calculate amounts
    let totalSale = 0;
    let totalCost = 0;
    for (const item of items) {
      const product = productMap.get(item.id)!;
      totalSale += item.eur * item.quantity;
      totalCost += product.buy_price * item.quantity;
    }
    const finalAmount = totalSale - (promo?.discount ?? 0);
    const totalProfit = finalAmount - totalCost;

    // 3. Atomic reservation — SELECT FOR UPDATE SKIP LOCKED inside the RPC.
    //    Creates the purchase (pending) + cart_reservations + purchase_items
    //    in one transaction. Any exception rolls everything back.
    const { data: reservation, error: rpcError } = await checkoutClient.rpc(
      "checkout_reserve_codes",
      {
        p_items: items.map((item) => ({
          product_id:  item.id,
          name:        item.name,
          quantity:    item.quantity,
          unit_price:  item.eur,
          unit_cost:   productMap.get(item.id)!.buy_price,
          category_id: productMap.get(item.id)!.category_id,
        })),
        p_customer: {
          full_name: customer.fullName,
          phone:     customer.phone,
          email:     customer.email ?? "",
        },
        p_payment_method: paymentMethod,
        p_total_amount:   finalAmount,
        p_total_cost:     totalCost,
        p_total_profit:   totalProfit,
        p_user_id:        checkoutUserId,
      },
    );

    if (rpcError || !reservation) {
      const msg = rpcError?.message ?? "";
      if (msg.includes("gift_code_not_available")) {
        return NextResponse.json(
          { error: "Plus de codes disponibles pour un ou plusieurs articles" },
          { status: 400 },
        );
      }
      if (msg.includes("too_many_reservations")) {
        return NextResponse.json(
          { error: "Trop de commandes en attente, veuillez patienter quelques minutes" },
          { status: 429 },
        );
      }
      console.error("checkout_reserve_codes error:", rpcError);
      return NextResponse.json(
        { error: "Erreur lors de la réservation" },
        { status: 500 },
      );
    }

    const purchaseId = (reservation as { purchase_id: string }).purchase_id;

    // 4a. Stripe card payment — webhook will finalize once paid
    if (paymentMethod === "card" && process.env.STRIPE_SECRET_KEY) {
      const { getStripeServer } = await import("@/lib/stripe/server");
      const stripe = getStripeServer();
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: items.map((item) => ({
          price_data: {
            currency:     "eur",
            product_data: { name: item.name },
            unit_amount:  Math.round(item.eur * 100),
          },
          quantity: item.quantity,
        })),
        metadata:    { purchase_id: purchaseId },
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/cart`,
      });

      await checkoutClient
        .from("purchases")
        .update({ stripe_session_id: session.id })
        .eq("id", purchaseId);

      return NextResponse.json({ data: { url: session.url, id: session.id } });
    }

    // 4b. GeniusPay — auto or specific method
    const GENIUSPAY_BASE_URL = "https://pay.genius.ci/api/v1/merchant";
    const GENIUSPAY_METHOD_MAP: Record<string, string | null> = {
      geniuspay:    null,          // auto: GeniusPay hosted checkout, user picks
      wave:         "wave",
      moov:         "moov_money",
      orange_money: "orange_money",
      djamo:        null,
    };

    if (paymentMethod in GENIUSPAY_METHOD_MAP) {
      const publicKey  = process.env.GENIUSPAY_PUBLIC_KEY;
      const secretKey  = process.env.GENIUSPAY_SECRET_KEY;

      if (!publicKey || !secretKey) {
        return NextResponse.json(
          { error: "Paiement mobile indisponible pour le moment" },
          { status: 503 },
        );
      }

      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const gpPayload: Record<string, unknown> = {
        amount:      Math.round(finalAmount),
        currency:    "XOF",
        description: "Commande Adex Card",
        success_url: `${origin}/success?pid=${purchaseId}`,
        error_url:   `${origin}/payment-failed?pid=${purchaseId}`,
        metadata:    { purchase_id: purchaseId },
        customer: {
          name:  customer.fullName,
          phone: customer.phone,
          ...(customer.email ? { email: customer.email } : {}),
        },
      };

      const gpMethod = GENIUSPAY_METHOD_MAP[paymentMethod];
      if (gpMethod) gpPayload.payment_method = gpMethod;

      const gpRes  = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
        method:  "POST",
        headers: {
          "X-API-Key":    publicKey,
          "X-API-Secret": secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gpPayload),
      });
      const gpData = await gpRes.json();

      if (!gpData.success) {
        console.error("GeniusPay error:", gpData);
        await checkoutClient.from("purchases").update({ status: "failed" }).eq("id", purchaseId);
        return NextResponse.json(
          { error: gpData.error?.message || "Erreur lors de la création du paiement" },
          { status: 400 },
        );
      }

      const gpTx = gpData.data;

      await checkoutClient
        .from("purchases")
        .update({ geniuspay_reference: gpTx.reference })
        .eq("id", purchaseId);

      return NextResponse.json({ data: { url: gpTx.checkout_url || gpTx.payment_url } });
    }

    // 4c. Local payment fallback — finalize immediately (legacy / unknown methods)
    const { data: finalized, error: finalizeError } = await checkoutClient.rpc(
      "finalize_purchase",
      { p_purchase_id: purchaseId, p_stripe_session_id: null },
    );

    if (finalizeError || !finalized) {
      console.error("finalize_purchase error:", finalizeError);
      return NextResponse.json(
        { error: "Erreur lors de la finalisation de la commande" },
        { status: 500 },
      );
    }

    const result = finalized as PurchaseResult;

    if (customer.email) {
      sendPurchaseConfirmationEmail(customer.email, result).catch((e) =>
        console.error("Email sending failed:", e),
      );

      if (implicitAccountCreated) {
        sendImplicitAccountActivationEmail(customer.email, result.customer_name, activationLink).catch((e) =>
          console.error("Activation email sending failed:", e),
        );
      }
    }

    return NextResponse.json({
      data: { statut: "success", purchase_id: purchaseId, implicitAccountCreated, codes: result.codes },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du checkout" },
      { status: 500 },
    );
  }
}

async function sendImplicitAccountActivationEmail(
  email: string,
  customerName: string,
  activationLink: string | null,
) {
  const activationText = activationLink
    ? `Cliquez sur ce lien pour définir votre mot de passe : ${activationLink}`
    : "Utilisez la page de mot de passe oublié avec cette adresse email afin de définir votre mot de passe.";
  const activationHtml = activationLink
    ? `<p><a href="${activationLink}" style="display:inline-block;background:linear-gradient(135deg,#00ffe0,#7b2fff);color:#000;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:800;">Activer mon compte</a></p>`
    : "<p>Utilisez la page <strong>Mot de passe oublié</strong> avec cette adresse email afin de définir votre mot de passe.</p>";

  await sendMail({
    to: email,
    subject: "Activez votre compte Adex Card",
    text: `Bonjour ${customerName},\n\nUn compte Adex Card a été créé avec votre accord pendant votre achat. ${activationText}\n\nVous pourrez ensuite retrouver l'historique de vos commandes depuis votre tableau de bord.`,
    html: `
      <div style="font-family:sans-serif;color:#eee;background:#0d0d0d;max-width:600px;margin:0 auto;padding:24px;border-radius:12px;">
        <h2 style="color:#00ffe0;margin-top:0;">Votre compte Adex Card est prêt</h2>
        <p>Bonjour ${customerName},</p>
        <p>Un compte a été créé avec votre accord pendant votre achat.</p>
        ${activationHtml}
        <p>Vous pourrez ensuite retrouver votre historique de commandes depuis votre tableau de bord.</p>
        <p style="margin-top:30px;font-size:12px;color:#666;">Vous pouvez supprimer votre compte depuis votre profil ou contacter le support.</p>
      </div>`,
  });
}

export async function sendPurchaseConfirmationEmail(
  email: string,
  result: PurchaseResult,
) {
  // Group codes by product name for a cleaner email layout
  const byProduct = result.codes.reduce<Record<string, string[]>>(
    (acc, { product_name, code }) => {
      (acc[product_name] ??= []).push(code);
      return acc;
    },
    {},
  );

  const codesHtml = Object.entries(byProduct)
    .map(
      ([name, codes]) => `
        <div style="margin-bottom:20px;padding:12px;border:1px solid #333;border-radius:8px;">
          <strong style="color:#00ffe0;">${name}</strong><br/>
          ${codes
            .map(
              (c) =>
                `<code style="display:block;background:#1a1a1a;color:#fff;padding:6px 8px;margin-top:6px;font-family:monospace;border-radius:4px;">${c}</code>`,
            )
            .join("")}
        </div>`,
    )
    .join("");

  const textCodes = Object.entries(byProduct)
    .map(([name, codes]) => `${name}:\n${codes.join("\n")}`)
    .join("\n\n");

  await sendMail({
    to: email,
    subject: "Confirmation de commande — Adex Card",
    text: `Merci pour votre achat !\n\nVoici vos codes :\n\n${textCodes}\n\nCeci est un email automatique.`,
    html: `
      <div style="font-family:sans-serif;color:#eee;background:#0d0d0d;max-width:600px;margin:0 auto;padding:24px;border-radius:12px;">
        <h2 style="color:#00ffe0;margin-top:0;">Merci pour votre commande !</h2>
        <p>Votre paiement a été validé. Voici vos codes cadeaux :</p>
        ${codesHtml}
        <p style="margin-top:30px;font-size:12px;color:#666;">Ceci est un email automatique, merci de ne pas y répondre.</p>
      </div>`,
  });
}
