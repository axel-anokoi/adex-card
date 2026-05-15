"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
  count: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
}

const COLORS = ["#00ffe0", "#7b2ff7", "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff8c42", "#845ec2"];

export function CategoryPieChart({
  data,
  title = "Ventes par catégorie",
}: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const pieData = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
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
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string, props) => [
                `${value.toFixed(2)} FCFA (${props.payload.percentage}%)`,
                name,
              ]}
            />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: "var(--text)", fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
