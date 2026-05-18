"use client";

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

interface StockAlertsProps {
  alerts: StockAlert[];
}

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "20px 24px",
};

export function StockAlerts({ alerts }: StockAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={card}>
        <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--text)" }}>
          Alertes stock
        </h3>
        <p className="text-center text-sm font-medium" style={{ color: "var(--green)" }}>
          ✓ Tous les produits sont bien approvisionnés
        </p>
      </div>
    );
  }

  const outOfStock = alerts.filter((a) => a.is_out_of_stock);
  const lowStock   = alerts.filter((a) => a.is_low_stock && !a.is_out_of_stock);

  return (
    <div style={card}>
      <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
        Alertes stock
      </h3>

      {outOfStock.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold" style={{ color: "#ef4444" }}>
            Rupture de stock ({outOfStock.length})
          </p>
          <div className="space-y-2">
            {outOfStock.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.06)",
                  padding: "8px 12px",
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {item.product_label}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(239,68,68,0.75)" }}>
                    {item.category_name}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#ef4444" }}>0</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold" style={{ color: "#f59e0b" }}>
            Stock faible ({lowStock.length})
          </p>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.product_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  border: "1px solid rgba(245,158,11,0.25)",
                  background: "rgba(245,158,11,0.06)",
                  padding: "8px 12px",
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {item.product_label}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(245,158,11,0.75)" }}>
                    Seuil&nbsp;: {item.low_stock_threshold}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>
                  {item.stock_available}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
