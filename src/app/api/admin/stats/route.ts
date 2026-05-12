import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayPurchases, error: todayError } = await supabase
      .from("purchases")
      .select("total_amount")
      .eq("status", "paid")
      .gte("created_at", today.toISOString());

    if (todayError) {
      return NextResponse.json({ error: todayError.message }, { status: 500 });
    }

    const salesToday = todayPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const transactionsTodayCount = todayPurchases.length;

    // Get this month's sales
    const monthStart = new Date(today);
    monthStart.setDate(1);

    const { data: monthPurchases } = await supabase
      .from("purchases")
      .select("total_amount")
      .eq("status", "paid")
      .gte("created_at", monthStart.toISOString());

    const salesThisMonth = monthPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

    // Get total stock value
    const { data: giftCodes } = await supabase
      .from("gift_codes")
      .select("buy_price, status")
      .eq("status", "available");

    const stockValue = giftCodes?.reduce((sum, code) => sum + (code.buy_price || 0), 0) || 0;

    // Get top categories
    const { data: topCategories } = await supabase
      .from("purchase_items")
      .select(`
        total_price,
        product:product_id(category:category_id(name))
      `)
      .order("total_price", { ascending: false })
      .limit(5);

    // Get low stock alert
    const { data: lowStock } = await supabase
      .from("products")
      .select("id, amount, stock_available, category:category_id(name)")
      .lt("stock_available", 5);

    return NextResponse.json({
      salesToday,
      transactionsTodayCount,
      salesThisMonth,
      stockValue,
      topCategories,
      lowStock,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
