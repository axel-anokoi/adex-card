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

    // ====== NEW: Extended Stats ======
    
    // Get daily revenue for last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: purchases30d } = await supabase
      .from("purchases")
      .select("created_at, total_amount, status")
      .eq("status", "paid")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at");
    
    // Group by day
    const dailyRevenueMap: Record<string, { day: string; orders_count: number; gross_revenue: number; net_revenue: number }> = {};
    purchases30d?.forEach(p => {
      const day = p.created_at.split("T")[0];
      if (!dailyRevenueMap[day]) {
        dailyRevenueMap[day] = { day, orders_count: 0, gross_revenue: 0, net_revenue: 0 };
      }
      dailyRevenueMap[day].orders_count++;
      dailyRevenueMap[day].gross_revenue += p.total_amount || 0;
      dailyRevenueMap[day].net_revenue += p.total_amount || 0;
    });
    const dailyRevenue = Object.values(dailyRevenueMap).sort((a, b) => a.day.localeCompare(b.day));
    
    // Get monthly revenue for last 12 months
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    
    const { data: purchases12m } = await supabase
      .from("purchases")
      .select("created_at, total_amount, status")
      .eq("status", "paid")
      .gte("created_at", twelveMonthsAgo.toISOString());
    
    const monthlyRevenueMap: Record<string, { month: string; orders_count: number; revenue: number }> = {};
    purchases12m?.forEach(p => {
      const month = p.created_at.substring(0, 7);
      if (!monthlyRevenueMap[month]) {
        monthlyRevenueMap[month] = { month, orders_count: 0, revenue: 0 };
      }
      monthlyRevenueMap[month].orders_count++;
      monthlyRevenueMap[month].revenue += p.total_amount || 0;
    });
    const monthlyRevenue = Object.values(monthlyRevenueMap).sort((a, b) => a.month.localeCompare(b.month));
    
    // Get sales by category
    const { data: categorySales } = await supabase
      .from("purchase_items")
      .select(`
        total_price,
        product:product_id(category:category_id(name))
      `)
      .gte("created_at", twelveMonthsAgo.toISOString());
    
    const categoryMap: Record<string, { name: string; value: number; count: number }> = {};
    categorySales?.forEach(item => {
      const catName = item.product?.category?.name || "Autre";
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, value: 0, count: 0 };
      }
      categoryMap[catName].value += item.total_price || 0;
      categoryMap[catName].count += 1;
    });
    const salesByCategory = Object.values(categoryMap).sort((a, b) => b.value - a.value);
    
    // Get top products
    const { data: productSales } = await supabase
      .from("purchase_items")
      .select(`
        total_price,
        quantity,
        product:product_id(id, amount, category:category_id(name))
      `)
      .gte("created_at", twelveMonthsAgo.toISOString())
      .order("total_price", { ascending: false })
      .limit(10);
    
    const topProductsMap: Record<string, { id: string; name: string; revenue: number; quantity: number }> = {};
    productSales?.forEach(item => {
      const prodId = item.product?.id;
      const prodName = `${item.product?.category?.name || "Produit"} ${item.product?.amount} FCFA`;
      if (!topProductsMap[prodId]) {
        topProductsMap[prodId] = { id: prodId, name: prodName, revenue: 0, quantity: 0 };
      }
      topProductsMap[prodId].revenue += item.total_price || 0;
      topProductsMap[prodId].quantity += item.quantity || 1;
    });
    const topProducts = Object.values(topProductsMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    // Get refund statistics
    const { data: refunds } = await supabase
      .from("refunds")
      .select("amount, reason, created_at, status");
    
    const totalRefunded = refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const refundCount = refunds?.length || 0;
    const refundRate = purchases12m?.length ? (refundCount / purchases12m.length) * 100 : 0;
    
    // Refund reasons
    const reasonMap: Record<string, number> = {};
    refunds?.forEach(r => {
      const reason = r.reason || "Autre";
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });
    const refundReasons = Object.entries(reasonMap).map(([reason, count]) => ({ reason, count }));
    
    // Get customer stats
    const { data: allPurchases } = await supabase
      .from("purchases")
      .select("user_id, created_at")
      .eq("status", "paid");
    
    const uniqueCustomers = new Set(allPurchases?.map(p => p.user_id)).size;
    
    const thirtyDaysAgo2 = new Date(today);
    thirtyDaysAgo2.setDate(thirtyDaysAgo2.getDate() - 30);
    const newCustomers = allPurchases?.filter(p => new Date(p.created_at) >= thirtyDaysAgo2).length || 0;
    
    // Calculate AOV (Average Order Value)
    const totalOrders = purchases12m?.length || 0;
    const totalRevenue = purchases12m?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    
    // Hourly sales distribution (last 30 days)
    const hourlySales: number[] = new Array(24).fill(0);
    purchases30d?.forEach(p => {
      const hour = new Date(p.created_at).getHours();
      hourlySales[hour] += p.total_amount || 0;
    });
    
    return NextResponse.json({
      salesToday,
      transactionsTodayCount,
      salesThisMonth,
      stockValue,
      topCategories,
      lowStock,
      // New extended stats
      dailyRevenue,
      monthlyRevenue,
      salesByCategory,
      topProducts,
      refundStats: {
        totalRefunded,
        refundCount,
        refundRate: refundRate.toFixed(1),
        reasons: refundReasons
      },
      customerStats: {
        totalCustomers: uniqueCustomers,
        newCustomersLast30d: newCustomers
      },
      averageOrderValue,
      hourlySales,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
