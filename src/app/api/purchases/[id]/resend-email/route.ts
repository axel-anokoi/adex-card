import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/mail";

// Public endpoint — purchase UUID is known only to the buyer (128-bit secret).
// Only sends email if the purchase is paid, and only to the email on record.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: purchase, error } = await supabase
    .from("purchases")
    .select(`
      id, status, customer_email, customer_name,
      user:user_id(email, nom, prenoms),
      purchase_items(
        unit_price,
        gift_code:gift_code_id(code),
        product:product_id(
          amount,
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
    return NextResponse.json({ error: "Commande non payée" }, { status: 400 });
  }

  const rawUser = purchase.user;
  const userEmail = ((Array.isArray(rawUser) ? rawUser[0] : rawUser) as { email?: string } | null)?.email ?? null;
  const email = purchase.customer_email || userEmail;

  if (!email) {
    return NextResponse.json({ error: "Aucun email disponible pour cette commande" }, { status: 400 });
  }

  type RawItem = {
    unit_price: number;
    gift_code: { code: string }[] | { code: string } | null;
    product: { amount?: number; category: { name: string }[] | { name: string } | null }[] | { amount?: number; category: { name: string } | null } | null;
  };

  const items = purchase.purchase_items as unknown as RawItem[];
  const codes = items.flatMap((item) => {
    const gc = Array.isArray(item.gift_code) ? item.gift_code[0] : item.gift_code;
    const code = gc?.code;
    const prod = Array.isArray(item.product) ? item.product[0] : item.product;
    const cat = Array.isArray(prod?.category) ? prod.category[0] : prod?.category;
    const product_name = cat?.name ? `${cat.name} ${prod?.amount ?? ""} FCFA` : "Produit";
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
}
