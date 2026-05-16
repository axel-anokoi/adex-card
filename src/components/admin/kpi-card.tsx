"use client";

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, subValue, trend, icon }: KpiCardProps) {
  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-cyan)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p
            className="mt-1 text-2xl font-bold"
            style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
          >
            {value}
          </p>
          {subValue && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>{subValue}</p>
          )}
        </div>
        {icon && <div style={{ color: "var(--cyan)" }}>{icon}</div>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: trend.isPositive ? "var(--green)" : "var(--pink)" }}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>vs période préc.</span>
        </div>
      )}
    </div>
  );
}
