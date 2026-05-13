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

export function StockAlerts({ alerts }: StockAlertsProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Alertes stock</h3>
        <p className="text-center text-emerald-600">✓ Tous les produits sont bien approvisionnés</p>
      </div>
    );
  }

  const outOfStock = alerts.filter((a) => a.is_out_of_stock);
  const lowStock = alerts.filter((a) => a.is_low_stock && !a.is_out_of_stock);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold">Alertes stock</h3>
      
      {outOfStock.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-red-600">
            Rupture de stock ({outOfStock.length})
          </p>
          <div className="space-y-2">
            {outOfStock.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.product_label}</p>
                  <p className="text-xs text-red-600/80">{item.category_name}</p>
                </div>
                <span className="text-sm font-bold text-red-600">0</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-amber-600">
            Stock faible ({lowStock.length})
          </p>
          <div className="space-y-2">
            {lowStock.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.product_label}</p>
                  <p className="text-xs text-amber-600/80">
                    Seuil: {item.low_stock_threshold}
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-600">{item.stock_available}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
