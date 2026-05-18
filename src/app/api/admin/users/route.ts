import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, supabase };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return { isAdmin: userData?.role === "admin", user, supabase };
}

// GET: List all users
export async function GET(request: Request) {
  try {
    const { isAdmin, supabase } = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";

    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        role,
        is_blocked,
        created_at,
        purchases(count)
      `)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate total spent per user
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("total_amount")
          .eq("user_id", user.id)
          .eq("status", "paid");

        const totalSpent = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

        return {
          ...user,
          total_spent: totalSpent,
          purchase_count: purchases?.length || 0,
        };
      })
    );

    return NextResponse.json({ data: enrichedUsers });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
