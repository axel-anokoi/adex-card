import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, supabase: null };
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  return { isAdmin: userData?.role === "admin", supabase };
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const { isAdmin, supabase } = await checkAdmin();
  if (!isAdmin || !supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [userResult, purchasesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, nom, prenoms, telephone, role, is_blocked, created_at, photo_profile")
      .eq("id", id)
      .single(),
    supabase
      .from("purchases")
      .select(`
        id, total_amount, total_cost, total_profit, status, payment_method,
        customer_name, customer_phone, customer_email, created_at,
        purchase_items(
          id, quantity, unit_price, unit_cost, total_price,
          product:product_id(id, amount, category:category_id(name, slug, logo_url)),
          gift_code:gift_code_id(code)
        )
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (userResult.error) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Aggregate stats from paid purchases only
  const purchases = (purchasesResult.data || []).map((p) => {
    const items = (p.purchase_items ?? []) as Array<{ unit_cost?: number; quantity: number; product?: { buy_price?: number } | null }>;
    const totalBuyCost = p.total_cost ?? items.reduce((s, i) => s + (i.unit_cost ?? 0) * i.quantity, 0);
    const profit = p.total_profit ?? p.total_amount - totalBuyCost;
    return { ...p, total_buy_cost: totalBuyCost, profit };
  });

  const paidPurchases = purchases.filter((p) => p.status === "paid");
  const totalSpent = paidPurchases.reduce((s, p) => s + (p.total_amount || 0), 0);
  const lastPurchaseAt = paidPurchases[0]?.created_at ?? null;

  return NextResponse.json({
    data: {
      ...userResult.data,
      total_spent: totalSpent,
      purchase_count: paidPurchases.length,
      last_purchase_at: lastPurchaseAt,
      purchases,
    },
  });
}

const updateSchema = z.object({
  nom: z.string().optional(),
  prenoms: z.string().optional(),
  telephone: z.string().optional(),
  is_blocked: z.boolean().optional(),
});

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { isAdmin, supabase } = await checkAdmin();
  if (!isAdmin || !supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
