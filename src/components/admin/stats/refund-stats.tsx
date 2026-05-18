"use client";

import { KpiCard } from "@/components/admin/kpi-card";

interface RefundStatsData {
  totalRefunded: number;
  refundCount: number;
  refundRate: string;
  reasons: { reason: string; count: number }[];
}

interface RefundStatsProps {
  data: RefundStatsData;
  title?: string;
}

export function RefundStats({ data, title = "Statistiques de remboursement" }: RefundStatsProps) {
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
      
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total remboursé"
          value={`${(data.totalRefunded || 0).toFixed(2)} FCFA`}
          subValue={`${data.refundCount || 0} demandes`}
        />
        <KpiCard
          label="Taux de remboursement"
          value={`${data.refundRate || 0}%`}
          subValue="sur 12 mois"
        />
        <KpiCard
          label="Motifs fréquents"
          value={data.reasons?.[0]?.reason || "N/A"}
          subValue={data.reasons?.[1]?.reason || "-"}
        />
      </div>

      {data.reasons && data.reasons.length > 0 && (
        <div className="mt-4">
          <h4
            className="mb-2 text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            Répartition des motifs
          </h4>
          <div className="space-y-2">
            {data.reasons.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className="flex-1 rounded-lg bg-red-500/10 p-2"
                  style={{ minWidth: 0 }}
                >
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{
                      width: `${Math.min(
                        (item.count / Math.max(...data.reasons.map((r) => r.count), 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span
                  className="w-32 truncate text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.reason}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
