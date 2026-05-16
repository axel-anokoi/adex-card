"use client";

interface DailyRevenue {
  day: string;
  orders_count: number;
  gross_revenue: number;
  net_revenue: number;
}

interface SalesChartProps {
  data: DailyRevenue[];
}

export function SalesChart({ data }: SalesChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.net_revenue), 1);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
        Revenus quotidiens <span style={{ color: "var(--text-faint)", fontSize: 13, fontWeight: 400 }}>(30 derniers jours)</span>
      </h3>

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Aucune donnée disponible
        </p>
      ) : (
        <>
          <div className="relative h-48">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {data.map((item, index) => {
                const height  = (item.net_revenue / maxRevenue) * 100;
                const date    = new Date(item.day);
                const isToday = index === 0;

                return (
                  <div key={item.day} className="group relative flex-1">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                        background: isToday
                          ? "linear-gradient(to top, var(--cyan), var(--violet))"
                          : "color-mix(in srgb, var(--text) 15%, transparent)",
                        opacity: isToday ? 1 : 0.6,
                      }}
                    />
                    {/* Tooltip */}
                    <div
                      className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-2 text-xs group-hover:block"
                      style={{
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <p className="font-semibold" style={{ color: "var(--text)" }}>
                        {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                      <p style={{ color: "var(--cyan)" }}>
                        {item.net_revenue.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p style={{ color: "var(--text-muted)" }}>
                        {item.orders_count} commande{item.orders_count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
            <span>
              {data[data.length - 1]?.day
                ? new Date(data[data.length - 1].day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                : ""}
            </span>
            <span>Aujourd'hui</span>
          </div>
        </>
      )}
    </div>
  );
}
