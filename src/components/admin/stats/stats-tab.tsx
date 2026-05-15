"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueTrendChart } from "./revenue-trend-chart";
import { CategoryPieChart } from "./category-pie-chart";
import { TopProductsChart } from "./top-products-chart";
import { RefundStats } from "./refund-stats";
import { HourlyHeatmap } from "./hourly-heatmap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface StatsData {
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
}

interface StatsTabProps {
  stats?: StatsData | null;
}

export function StatsTab({ stats: initialStats }: StatsTabProps) {
  const [loading, setLoading] = useState(!initialStats);
  const [data, setData] = useState<StatsData | null>(initialStats || null);

  useEffect(() => {
    if (initialStats) {
      setData(initialStats);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json as StatsData);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p style={{ color: "var(--text-muted)" }}>Chargement des statistiques...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p style={{ color: "var(--text-muted)" }}>Aucune donnée disponible</p>
      </div>
    );
  }

  // Format monthly data for chart
  const monthlyChartData = data.monthlyRevenue?.map((item) => ({
    month: new Date(item.month + "-01").toLocaleDateString("fr-FR", { month: "short" }),
    revenue: item.revenue,
    orders: item.orders_count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row 1 - Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventes aujourd'hui"
          value={`${(data.salesToday || 0).toFixed(2)} FCFA`}
          subValue={`${data.transactionsTodayCount || 0} commandes`}
        />
        <KpiCard
          label="Ventes du mois"
          value={`${(data.salesThisMonth || 0).toFixed(2)} FCFA`}
        />
        <KpiCard
          label="Panier moyen"
          value={`${(data.averageOrderValue || 0).toFixed(2)} FCFA`}
          subValue={`${data.totalOrders || 0} commandes`}
        />
        <KpiCard
          label="Total clients"
          value={data.customerStats?.totalCustomers || 0}
          subValue={`+${data.customerStats?.newCustomersLast30d || 0} ce mois`}
        />
      </div>

      {/* Revenue Trend Chart */}
      <RevenueTrendChart data={data.dailyRevenue || []} />

      {/* Two Column Row: Category + Monthly Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart data={data.salesByCategory || []} />
        
        {/* Monthly Revenue Trend */}
        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <h3
            className="mb-4 text-lg font-bold"
            style={{ color: "var(--text)" }}
          >
            Revenus mensuels (12 derniers mois)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickFormatter={(value) => `${value} FCFA`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)} FCFA`, "Revenu"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7b2ff7"
                  strokeWidth={2}
                  dot={{ fill: "#7b2ff7", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Row: Top Products + Hourly Heatmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsChart data={data.topProducts || []} />
        <HourlyHeatmap data={data.hourlySales || []} />
      </div>

      {/* Refund Stats */}
      <RefundStats
        data={{
          totalRefunded: data.refundStats?.totalRefunded || 0,
          refundCount: data.refundStats?.refundCount || 0,
          refundRate: data.refundStats?.refundRate || "0",
          reasons: data.refundStats?.reasons || [],
        }}
      />
    </div>
  );
}
