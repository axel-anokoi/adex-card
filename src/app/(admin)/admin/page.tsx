"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KpiCard } from "@/components/admin/kpi-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { StockAlerts } from "@/components/admin/stock-alerts";
import { RefundManager } from "@/components/admin/refund-manager";
import { DiscountManager } from "@/components/admin/discount-manager";
import { AuditLogs } from "@/components/admin/audit-logs";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProfileEditor } from "@/components/admin/profile-editor";
import { CategoryManager } from "@/components/admin/category-manager";
import { ProductManager } from "@/components/admin/product-manager";
import { CodeManager } from "@/components/admin/code-manager";
import { StatsTab, StatsData } from "@/components/admin/stats/stats-tab";
import { PaymentsTab } from "@/components/admin/payments-tab";
import { ClientManager } from "@/components/admin/client-manager";

type TabType = "overview" | "stats" | "purchases" | "refunds" | "discounts" | "users" | "audit" | "categorie" | "produit" | "code" | "profil";

interface Stats {
  salesToday: number;
  salesThisMonth: number;
  transactionsTodayCount: number;
  totalOrders: number;
  totalRefunded: number;
  refundRatePct: number;
  activeClients: number;
  newClients30d: number;
  totalCodesAvailable: number;
  productsOutOfStock: number;
  productsLowStock: number;
  ordersPendingReview: number;
  refundsPending: number;
}

// Extended stats for StatsTab - matches API response
interface ExtendedStats {
  salesToday: number;
  salesThisMonth: number;
  transactionsTodayCount: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  dailyRevenue: { day: string; orders_count: number; gross_revenue: number; net_revenue: number }[];
  monthlyRevenue: { month: string; orders_count: number; revenue: number }[];
  salesByCategory: { name: string; value: number; count: number }[];
  topProducts: { id: string; name: string; revenue: number; quantity: number }[];
  refundStats: {
    totalRefunded: number;
    refundCount: number;
    refundRate: string;
    reasons: { reason: string; count: number }[];
  };
  customerStats: {
    totalCustomers: number;
    newCustomersLast30d: number;
  };
  hourlySales: number[];
  stockValue?: number;
  lowStock?: Array<{ id: string; amount: number; stock_available: number; category: { name: string } }>;
}

interface DailyRevenue {
  day: string;
  orders_count: number;
  gross_revenue: number;
  net_revenue: number;
}

interface RecentActivity {
  event_type: string;
  event_id: string;
  occurred_at: string;
  actor_email: string | null;
  status: string | null;
  amount: number | null;
  detail: string | null;
}

interface StockAlert {
  product_id: string;
  product_label: string;
  category_name: string;
  amount: number;
  stock_available: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

interface RefundRequest {
  id: string;
  purchase_id: string;
  user_id: string;
  reason: string;
  status: string;
  admin_note: string | null;
  amount: number | null;
  created_at: string;
  user?: { email: string };
}

interface PurchaseFull {
  id: string;
  total_amount: number;
  total_buy_cost: number;
  profit: number;
  status: string;
  payment_method: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  user: { email: string; nom: string | null; prenoms: string | null; telephone: string | null } | null;
  purchase_items: {
    id: string;
    quantity: number;
    unit_price: number;
    unit_cost?: number;
    total_price: number;
    product: {
      id: string;
      amount: number;
      sell_price: number;
      buy_price: number;
      category: { name: string; slug: string; logo_url: string | null } | null;
    } | null;
    gift_code: { code: string } | null;
  }[];
}

import { DiscountCode } from "@/types/discounts";

import { AuditLog } from "@/types/audit";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [purchases, setPurchases] = useState<PurchaseFull[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.status === 401 || statsRes.status === 403) {
          router.push("/login");
          return;
        }
        
        // Fetch all data in parallel
        const [statsData, purchasesData, refundsData, discountsData, auditData] = await Promise.all([
          fetch("/api/admin/stats").then(r => r.ok ? r.json() : Promise.resolve({})),
          fetch("/api/admin/purchases").then(r => r.ok ? r.json() : Promise.resolve({ data: [] })),
          fetch("/api/admin/refunds").then(r => r.ok ? r.json() : Promise.resolve({ data: [] })),
          fetch("/api/admin/discounts").then(r => r.ok ? r.json() : Promise.resolve({ data: [] })),
          fetch("/api/admin/audit").then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
        ]);

        setStats(statsData);

        // Store full purchases data
        if (purchasesData?.data) {
          setPurchases(purchasesData.data as PurchaseFull[]);

          // Calculate daily revenue from purchases data
          const byDay: Record<string, DailyRevenue> = {};
          purchasesData.data.forEach((p: { created_at: string; total_amount: number; status: string }) => {
            if (p.status === "paid") {
              const day = p.created_at.split("T")[0];
              if (!byDay[day]) {
                byDay[day] = { day, orders_count: 0, gross_revenue: 0, net_revenue: 0 };
              }
              byDay[day].orders_count++;
              byDay[day].gross_revenue += p.total_amount;
              byDay[day].net_revenue += p.total_amount;
            }
          });
          setDailyRevenue(Object.values(byDay).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 30));
        }

        // Set stock alerts from stats
        if (statsData?.lowStock) {
          setStockAlerts(statsData.lowStock.map((p: { id: string; amount: number; stock_available: number; category: { name: string } }) => ({
            product_id: p.id,
            product_label: `${p.category?.name || "Produit"} ${p.amount} FCFA`,
            category_name: p.category?.name || "",
            amount: p.amount,
            stock_available: p.stock_available,
            low_stock_threshold: 5,
            is_low_stock: p.stock_available < 5,
            is_out_of_stock: p.stock_available === 0
          })));
        }

        setRefunds(refundsData?.data || []);
        setDiscounts(discountsData?.data || []);

        // For now, use purchases as recent activity (placeholder)
        setActivities(purchasesData?.data?.slice(0, 5).map((p: { id: string; created_at: string; user: { email: string }; status: string; total_amount: number }) => ({
          event_type: "purchase",
          event_id: p.id,
          occurred_at: p.created_at,
          actor_email: p.user?.email,
          status: p.status,
          amount: p.total_amount,
          detail: null
        })) || []);

        setAuditLogs(auditData?.data || []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleApproveRefund = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/refunds/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      }
    } catch (error) {
      console.error("Failed to approve refund:", error);
    }
  };

  const handleRejectRefund = async (id: string, note: string) => {
    try {
      const res = await fetch(`/api/admin/refunds/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: note })
      });
      if (res.ok) {
        setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "rejected", admin_note: note } : r));
      }
    } catch (error) {
      console.error("Failed to reject refund:", error);
    }
  };

  const handleUpdatePurchaseStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/purchases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPurchases((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
      }
    } catch (error) {
      console.error("Failed to update purchase status:", error);
    }
  };

  const handleProcessRefund = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/refunds/${id}/process`, { method: "POST" });
      if (res.ok) {
        setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: "processed" } : r));
      }
    } catch (error) {
      console.error("Failed to process refund:", error);
    }
  };

  const handleToggleDiscount = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive })
      });
      if (res.ok) {
        setDiscounts(prev => prev.map(d => d.id === id ? { ...d, is_active: isActive } : d));
      }
    } catch (error) {
      console.error("Failed to toggle discount:", error);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDiscounts(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete discount:", error);
    }
  };

if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      </div>
    );
  }

const handleTabChange = (tab: string) => {
    const tabMap: Record<string, TabType> = {
      dashboard:  "overview",
      stats:      "stats",
      categorie:  "categorie",
      produit:    "produit",
      code:       "code",
      client:     "users",
      publicite:  "discounts",
      paiement:   "purchases",
      profil:     "profil",
    };
    setActiveTab(tabMap[tab] || (tab as TabType));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onToggle={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <AdminHeader
          title={activeTab}
          notificationCount={stats?.refundsPending || 0}
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Content */}
        <main
          className="p-3 md:p-6"
          style={{ background: "var(--bg)" }}
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="Ventes aujourd'hui"
                  value={`${(stats?.salesToday || 0).toFixed(2)} FCFA`}
                  subValue={`${stats?.transactionsTodayCount || 0} commandes`}
                />
                <KpiCard
                  label="Ventes du mois"
                  value={`${(stats?.salesThisMonth || 0).toFixed(2)} FCFA`}
                />
                <KpiCard
                  label="Total commandes"
                  value={stats?.totalOrders || 0}
                  subValue={`${stats?.activeClients || 0} clients`}
                />
                <KpiCard
                  label="Alertes stock"
                  value={(stats?.productsOutOfStock || 0) + (stats?.productsLowStock || 0)}
                  subValue={stats?.productsLowStock ? `${stats.productsLowStock} faible` : "Aucun"}
                />
              </div>

              {/* Chart and Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                <SalesChart data={dailyRevenue} />
                <ActivityFeed activities={activities} />
              </div>

{/* Stock Alerts */}
              <StockAlerts alerts={stockAlerts} />
            </div>
          )}

{/* Stats Tab */}
          {activeTab === "stats" && (
            <StatsTab stats={stats as unknown as StatsData | null} />
          )}

          {/* Purchases Tab */}
          {activeTab === "purchases" && (
            <PaymentsTab purchases={purchases} onUpdateStatus={handleUpdatePurchaseStatus} />
          )}

          {/* Refunds Tab */}
          {activeTab === "refunds" && (
            <RefundManager
              refunds={refunds}
              onApprove={handleApproveRefund}
              onReject={handleRejectRefund}
              onProcess={handleProcessRefund}
            />
          )}

          {/* Discounts Tab */}
          {activeTab === "discounts" && (
            <DiscountManager
              codes={discounts}
              onToggleActive={handleToggleDiscount}
              onDelete={handleDeleteDiscount}
            />
          )}

          {/* Users Tab */}
          {activeTab === "users" && <ClientManager />}

          {/* Audit Tab */}
          {activeTab === "audit" && (
            <AuditLogs logs={auditLogs} />
          )}

{["categorie", "produit", "code"].includes(activeTab) && (
            <div className="rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              {activeTab === "categorie" && <CategoryManager />}
              {activeTab === "produit" && <ProductManager />}
              {activeTab === "code" && <CodeManager />}
            </div>
          )}

          {activeTab === "profil" && <ProfileEditor />}
        </main>
      </div>
    </div>
  );
}
