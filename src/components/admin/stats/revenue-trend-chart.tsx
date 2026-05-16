"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface DailyRevenue {
  day: string;
  orders_count: number;
  gross_revenue: number;
  net_revenue: number;
}

interface RevenueTrendChartProps {
  data: DailyRevenue[];
  title?: string;
}

export function RevenueTrendChart({ data, title = "Revenus quotidiens (30 derniers jours)" }: RevenueTrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
  }));

  return (
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
        {title}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffe0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00ffe0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="date"
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
              labelStyle={{ color: "var(--text)" }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(2)} FCFA`, "Revenu"]}
            />
            <Area
              type="monotone"
              dataKey="net_revenue"
              stroke="#00ffe0"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
