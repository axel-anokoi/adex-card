import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripeServer } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1), // Product ID
        name: z.string().min(1),
        eur: z.number().positive(),
        quantity: z.number().int().positive(),
        cat: z.string().optional(),
      }),
    )
    .min(1),
  paymentMethod: z.string().min(1),
  customer: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
  }),
  promo: z.object({
    code: z.string(),
    discount: z.number(),
  }).nullable().optional(),
});

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

    const { items, paymentMethod, customer, promo } = parsed.data;
    const supabase = await createClient();

    // 1. Validation du stock et récupération des prix d'achat
    const productIds = items.map((item) => item.id);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, stock_available, buy_price, sell_price, category_id")
      .in("id", productIds);

    if (prodError || !products) {
      return NextResponse.json({ error: "Erreur lors de la récupération des produits" }, { status: 500 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    
    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product || item.quantity > product.stock_available) {
        return NextResponse.json({ error: `Stock insuffisant pour ${item.name}` }, { status: 400 });
      }
    }

    // 2. Calcul des montants
    let totalSale = 0;
    let totalCost = 0;

    items.forEach(item => {
      const product = productMap.get(item.id)!;
      totalSale += item.eur * item.quantity;
      totalCost += product.buy_price * item.quantity;
    });

    const finalAmount = totalSale - (promo?.discount || 0);
    const totalProfit = finalAmount - totalCost;

    // 3. Création de la commande (Purchase)
    // On récupère l'ID de l'utilisateur connecté si possible
    const { data: { user } } = await supabase.auth.getUser();

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user?.id || null,
        total_amount: finalAmount,
        status: "pending",
        payment_method: paymentMethod,
        customer_name: customer.fullName,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        total_cost: totalCost,
        total_profit: totalProfit,
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: "Erreur lors de la création de la commande", message:purchaseError }, { status: 500 });
    }

    // 4. Réservation des codes cadeaux (Gift Codes)
    // Pour chaque item, on cherche des codes 'available'
    const allPurchasedCodes: { productName: string; codes: string[] }[] = [];

    for (const item of items) {
      const { data: availableCodes, error: codeError } = await supabase
        .from("gift_codes")
        .select("id, code")
        .eq("product_id", item.id)
        .eq("status", "available")
        .limit(item.quantity);

      if (codeError || !availableCodes || availableCodes.length < item.quantity) {
        return NextResponse.json({ error: `Plus de codes disponibles pour ${item.name}` }, { status: 400 });
      }

      const codeData = availableCodes.map(c => ({ id: c.id, code: c.code }));
      const codeIds = codeData.map(c => c.id);

      await supabase
        .from("gift_codes")
        .update({
          status: "reserved",
          sold_to_user_id: user?.id || null,
          sold_at: new Date().toISOString()
        })
        .in("id", codeIds);

      allPurchasedCodes.push({
        productName: item.name,
        codes: codeData.map(c => c.code)
      });

      for (const codeId of codeIds) {
        const product = productMap.get(item.id)!;
        await supabase.from("purchase_items").insert({
          purchase_id: purchase.id,
          product_id: item.id,
          category_id: product.category_id,
          gift_code_id: codeId,
          quantity: 1,
          unit_price: item.eur,
          unit_cost: product.buy_price,
          total_price: item.eur,
        });
      }
    }

    // Envoi des codes par email
    if (customer.email) {
      try {
        const { sendMail } = await import("@/lib/mail");
        
        const codesHtml = allPurchasedCodes
          .map(item => `
            <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
              <strong style="color: #00ffe0;">${item.productName}</strong><br/>
              ${item.codes.map(c => `<code style="display: block; background: #f4f4f4; padding: 4px; margin-top: 5px; font-family: monospace;">${c}</code>`).join('')}
            </div>
          `).join('');

        await sendMail({
          to: customer.email,
          subject: `Confirmation de commande - Adex Card`,
          text: `Merci pour votre achat ! Voici vos codes : \n\n${allPurchasedCodes.map(i => `${i.productName}: ${i.codes.join(', ')}`).join('\n\n')}`,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00ffe0;">Merci pour votre commande !</h2>
              <p>Votre paiement a été validé avec succès. Voici vos codes cadeaux :</p>
              ${codesHtml}
              <p style="margin-top: 30px; font-size: 12px; color: #888;">Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.error("Email sending failed:", mailError);
        // On ne bloque pas la réponse 200 si seul l'email échoue, mais on log l'erreur
      }
    }

    return NextResponse.json({ data: { statut: "success" } });

    // // 5. Intégration Stripe
    // const stripe = getStripeServer();
    // const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   mode: "payment",
    //   line_items: items.map((item) => ({
    //     price_data: {
    //       currency: "eur",
    //       product_data: { name: item.name },
    //       unit_amount: Math.round(item.eur * 100),
    //     },
    //     quantity: item.quantity,
    //   })),
    //   // On ajoute la réduction si présente via Stripe Coupons ou en ajustant le prix
    //   // Pour simplifier ici, on utilise le montant total calculé
    //   payment_intent_data: {
    //     metadata: { purchase_id: purchase.id },
    //   },
    //   success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${origin}/cart`,
    //   metadata: {
    //     purchase_id: purchase.id,
    //   },
    // });

    // // Mise à jour de la purchase avec le stripe_session_id
    // await supabase
    //   .from("purchases")
    //   .update({ stripe_session_id: session.id })
    //   .eq("id", purchase.id);

    // return NextResponse.json({ data: { url: session.url, id: session.id } });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erreur interne lors du checkout" }, { status: 500 });
  }
}
