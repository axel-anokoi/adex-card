"use client";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, subValue, trend, icon }: KpiCardProps) {
  return (
    <div 
      className="rounded-xl border p-4 transition-all hover:border-cyan/30"
      style={{ 
        background: "var(--bg-card)", 
        borderColor: "var(--border)" 
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{value}</p>
          {subValue && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>{subValue}</p>
          )}
        </div>
        {icon && <div style={{ color: "var(--cyan)" }}>{icon}</div>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>vs last period</span>
        </div>
      )}
    </div>
  );
}
