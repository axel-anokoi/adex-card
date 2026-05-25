import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, supabase };
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return { isAdmin: userData?.role === "admin", supabase };
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { isAdmin, supabase } = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: purchase, error } = await supabase
      .from("purchases")
      .select(`
        id, status, customer_email, customer_name,
        user:user_id(email, nom, prenoms),
        purchase_items(
          unit_price,
          gift_code:gift_code_id(code),
          product:product_id(
            category:category_id(name)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !purchase) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (purchase.status !== "paid") {
      return NextResponse.json({ error: "La commande n'est pas payée" }, { status: 400 });
    }

    const userEmail = Array.isArray(purchase.user)
      ? (purchase.user[0] as { email?: string })?.email
      : (purchase.user as { email?: string } | null)?.email;
    const email = userEmail || purchase.customer_email;

    if (!email) {
      return NextResponse.json({ error: "Aucun email client disponible" }, { status: 400 });
    }

    type RawItem = {
      gift_code: { code: string }[] | { code: string } | null;
      product: { category: { name: string }[] | { name: string } | null }[] | { category: { name: string } | null } | null;
    };

    const items = purchase.purchase_items as unknown as RawItem[];
    const codes = items.flatMap((item) => {
      const gc = Array.isArray(item.gift_code) ? item.gift_code[0] : item.gift_code;
      const code = gc?.code;
      const prod = Array.isArray(item.product) ? item.product[0] : item.product;
      const cat = Array.isArray(prod?.category) ? prod.category[0] : prod?.category;
      const product_name = cat?.name ?? "Produit";
      return code ? [{ code, product_name }] : [];
    });

    if (codes.length === 0) {
      return NextResponse.json({ error: "Aucun code trouvé pour cette commande" }, { status: 400 });
    }

    const byProduct = codes.reduce<Record<string, string[]>>(
      (acc, { product_name, code }) => {
        (acc[product_name] ??= []).push(code);
        return acc;
      },
      {},
    );

    const codesHtml = Object.entries(byProduct)
      .map(
        ([name, cs]) => `
          <div style="margin-bottom:20px;padding:12px;border:1px solid #333;border-radius:8px;">
            <strong style="color:#00ffe0;">${name}</strong><br/>
            ${cs.map((c) => `<code style="display:block;background:#1a1a1a;color:#fff;padding:6px 8px;margin-top:6px;font-family:monospace;border-radius:4px;">${c}</code>`).join("")}
          </div>`,
      )
      .join("");

    const textCodes = Object.entries(byProduct)
      .map(([name, cs]) => `${name}:\n${cs.join("\n")}`)
      .join("\n\n");

    await sendMail({
      to: email,
      subject: "Vos codes cadeaux — Adex Card",
      text: `Voici vos codes suite à votre commande :\n\n${textCodes}\n\nCeci est un email automatique.`,
      html: `
        <div style="font-family:sans-serif;color:#eee;background:#0d0d0d;max-width:600px;margin:0 auto;padding:24px;border-radius:12px;">
          <h2 style="color:#00ffe0;margin-top:0;">Vos codes cadeaux — Adex Card</h2>
          <p>Voici vos codes suite à votre commande :</p>
          ${codesHtml}
          <p style="margin-top:30px;font-size:12px;color:#666;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend email error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}
