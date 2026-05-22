import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseConfirmationEmail } from "@/app/api/checkout/route";

interface PurchaseResult {
  purchase_id: string;
  customer_email: string | null;
  customer_name: string;
  total_amount: number;
  codes: Array<{ code: string; product_name: string; unit_price: number }>;
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
    const secretKey = process.env.GENIUSPAY_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: "GeniusPay non configuré" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const page   = searchParams.get("page")   ?? "1";
    const limit  = searchParams.get("limit")  ?? "50";
    const status = searchParams.get("status") ?? "";

    const url = new URL("https://pay.genius.ci/api/v1/merchant/payments");
    url.searchParams.set("page", page);
    url.searchParams.set("limit", limit);
    if (status) url.searchParams.set("status", status);

    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key":    publicKey,
        "X-API-Secret": secretKey,
        "Content-Type": "application/json",
      },
      next: { revalidate: 30 },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("GeniusPay payments list error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Erreur GeniusPay" },
        { status: res.status },
      );
    }

    const transactions: Array<{ metadata?: { purchase_id?: string } }> = data.data ?? [];

    // Collect purchase IDs from GeniusPay metadata
    const purchaseIds = transactions
      .map((tx) => tx.metadata?.purchase_id)
      .filter((id): id is string => !!id);

    // Enrich with our Supabase data in a single batch query
    let purchaseMap: Record<string, unknown> = {};
    if (purchaseIds.length > 0) {
      const supabase = createAdminClient();
      const { data: purchases, error } = await supabase
        .from("purchases")
        .select(`
          id, customer_name, customer_email, customer_phone, status,
          total_amount,
          user:users(email, nom, prenoms, telephone),
          purchase_items(
            id, quantity, unit_price, unit_cost, total_price,
            product:products(
              id, amount, sell_price, buy_price,
              category:categories(name, slug, logo_url)
            ),
            gift_code:gift_codes(code)
          )
        `)
        .in("id", purchaseIds);

      if (error) {
        console.error("GeniusPay payments Supabase enrich error:", error);
      } else if (purchases) {
        purchaseMap = Object.fromEntries(
          purchases.map((p) => {
            const items = (p.purchase_items ?? []) as Array<{ unit_cost?: number | null; quantity: number }>;
            const total_buy_cost = items.reduce((s, i) => s + (i.unit_cost ?? 0) * i.quantity, 0);
            const profit = p.total_amount - total_buy_cost;
            return [p.id, { ...p, total_buy_cost, profit }];
          }),
        );
      }
    }

    // Merge Supabase purchase data into each GeniusPay transaction
    const enriched = transactions.map((tx) => {
      const pid = tx.metadata?.purchase_id;
      return pid && purchaseMap[pid]
        ? { ...tx, db_purchase: purchaseMap[pid] }
        : tx;
    });

    return NextResponse.json({ data: enriched, meta: data.meta ?? null });
  } catch (err) {
    console.error("GeniusPay payments route error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// Admin-triggered remediation for discordant transactions
export async function PATCH(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, purchase_id, geniuspay_reference } = await request.json();

    if (!purchase_id) {
      return NextResponse.json({ error: "purchase_id manquant" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Force-deliver codes when GeniusPay confirmed success but webhook was missed
    if (action === "finalize") {
      if (!geniuspay_reference) {
        return NextResponse.json({ error: "geniuspay_reference manquant" }, { status: 400 });
      }

      const { data: finalized, error } = await supabase.rpc("finalize_purchase", {
        p_purchase_id:         purchase_id,
        p_geniuspay_reference: geniuspay_reference,
      });

      if (error) {
        console.error("Force finalize error:", error, { purchase_id, geniuspay_reference });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const result = finalized as PurchaseResult;
      if (result?.customer_email) {
        sendPurchaseConfirmationEmail(result.customer_email, result).catch((e) =>
          console.error("Force finalize email failed:", e),
        );
      }

      return NextResponse.json({ success: true });
    }

    // Release stuck reservation when GeniusPay failed/expired but purchase is still pending
    if (action === "cancel") {
      const { error } = await supabase.rpc("cancel_purchase", { p_purchase_id: purchase_id });
      if (error) {
        console.error("Force cancel error:", error, { purchase_id });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("GeniusPay PATCH error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
