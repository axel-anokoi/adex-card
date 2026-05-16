"use client";

interface PaymentMethodStat {
  method: string;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  total: number;
  revenue: number;
}

interface PaymentMethodStatsProps {
  data: PaymentMethodStat[];
}

const METHOD_LABELS: Record<string, string> = {
  card: "Carte bancaire",
  djamo: "Djamo",
  moov: "Moov Money",
  wave: "Wave",
  unknown: "Inconnu",
};

function pct(count: number, total: number) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export function PaymentMethodStats({ data }: PaymentMethodStatsProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const totals = data.reduce(
    (acc, m) => ({
      paid: acc.paid + m.paid,
      pending: acc.pending + m.pending,
      failed: acc.failed + m.failed,
      refunded: acc.refunded + m.refunded,
      total: acc.total + m.total,
      revenue: acc.revenue + m.revenue,
    }),
    { paid: 0, pending: 0, failed: 0, refunded: 0, total: 0, revenue: 0 }
  );

  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <h3 className="mb-6 text-lg font-bold" style={{ color: "var(--text)" }}>
        Taux de paiement par moyen de paiement
      </h3>

      {/* Global summary chips */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SummaryChip label="Réussis" count={totals.paid} total={totals.total} color="#22c55e" />
        <SummaryChip label="En attente" count={totals.pending} total={totals.total} color="#f59e0b" />
        <SummaryChip label="Échoués" count={totals.failed} total={totals.total} color="#ef4444" />
        <SummaryChip label="Remboursés" count={totals.refunded} total={totals.total} color="#8b5cf6" />
      </div>

      {/* Per-method rows */}
      <div className="space-y-4">
        {data.map((m) => (
          <MethodRow key={m.method} stat={m} />
        ))}
      </div>
    </div>
  );
}

function SummaryChip({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-4 py-2"
      style={{ background: `${color}18`, border: `1px solid ${color}40` }}
    >
      <span className="text-lg font-bold" style={{ color }}>
        {pct(count, total)}%
      </span>
      <div>
        <p className="text-xs font-medium" style={{ color }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {count} transactions
        </p>
      </div>
    </div>
  );
}

function MethodRow({ stat }: { stat: PaymentMethodStat }) {
  const label = METHOD_LABELS[stat.method] ?? stat.method;
  const paidPct = pct(stat.paid, stat.total);
  const pendingPct = pct(stat.pending, stat.total);
  const failedPct = pct(stat.failed, stat.total);
  const refundedPct = pct(stat.refunded, stat.total);

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--border)", background: "var(--bg-secondary, var(--bg-card))" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {label}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{
              background: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {stat.total} txn
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {stat.revenue.toFixed(0)} FCFA
        </span>
      </div>

      {/* Stacked bar */}
      <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
        {paidPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${paidPct}%`, background: "#22c55e" }} />
        )}
        {pendingPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${pendingPct}%`, background: "#f59e0b" }} />
        )}
        {failedPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${failedPct}%`, background: "#ef4444" }} />
        )}
        {refundedPct > 0 && (
          <div className="h-full transition-all" style={{ width: `${refundedPct}%`, background: "#8b5cf6" }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <StatusBadge label="Réussi" count={stat.paid} pct={paidPct} color="#22c55e" />
        <StatusBadge label="En attente" count={stat.pending} pct={pendingPct} color="#f59e0b" />
        <StatusBadge label="Échoué" count={stat.failed} pct={failedPct} color="#ef4444" />
        {stat.refunded > 0 && (
          <StatusBadge label="Remboursé" count={stat.refunded} pct={refundedPct} color="#8b5cf6" />
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  count,
  pct: pctValue,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}:
      </span>
      <span className="text-xs font-semibold" style={{ color }}>
        {pctValue}%
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        ({count})
      </span>
    </div>
  );
}
