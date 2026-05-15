"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
  title?: string;
}

export function TopProductsChart({
  data,
  title = "Top produits",
}: TopProductsChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
    revenue: item.revenue,
    quantity: item.quantity,
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
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              type="number"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickFormatter={(value) => `${value} FCFA`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              width={75}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} FCFA`, "Revenu"]}
              labelStyle={{ color: "var(--text)" }}
            />
            <Bar
              dataKey="revenue"
              fill="#7b2ff7"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
