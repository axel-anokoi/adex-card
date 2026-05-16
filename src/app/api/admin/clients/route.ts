import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, supabase: null };
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  return { isAdmin: userData?.role === "admin", supabase };
}

export async function GET() {
  const { isAdmin, supabase } = await checkAdmin();
  if (!isAdmin || !supabase) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [usersResult, purchasesResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, nom, prenoms, telephone, role, is_blocked, created_at, photo_profile")
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select("user_id, total_amount, created_at")
      .eq("status", "paid"),
  ]);

  if (usersResult.error) {
    return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  }

  const purchasesByUser: Record<string, { total: number; count: number; last: string }> = {};
  purchasesResult.data?.forEach((p) => {
    if (!p.user_id) return;
    const entry = purchasesByUser[p.user_id];
    if (!entry) {
      purchasesByUser[p.user_id] = { total: p.total_amount || 0, count: 1, last: p.created_at };
    } else {
      entry.total += p.total_amount || 0;
      entry.count++;
      if (p.created_at > entry.last) entry.last = p.created_at;
    }
  });

  const data = (usersResult.data || []).map((u) => ({
    ...u,
    total_spent: purchasesByUser[u.id]?.total ?? 0,
    purchase_count: purchasesByUser[u.id]?.count ?? 0,
    last_purchase_at: purchasesByUser[u.id]?.last ?? null,
  }));

  return NextResponse.json({ data });
}
