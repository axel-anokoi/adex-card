"use client";

interface Activity {
  event_type: string;
  event_id: string;
  occurred_at: string;
  actor_email: string | null;
  status: string | null;
  amount: number | null;
  detail: string | null;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const eventTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
  purchase:        { label: "Commande",       bg: "rgba(16,185,129,0.15)",  color: "#10b981" },
  refund_request:  { label: "Remboursement",  bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" },
  new_user:        { label: "Nouveau client", bg: "rgba(139,92,246,0.15)",  color: "#8b5cf6" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  paid:       { label: "Payé",       color: "#10b981" },
  pending:    { label: "En attente", color: "#f59e0b" },
  refunded:   { label: "Remboursé",  color: "var(--text-muted)" },
  approved:   { label: "Approuvé",   color: "var(--cyan)" },
  rejected:   { label: "Rejeté",     color: "#ef4444" },
  registered: { label: "Inscription", color: "#8b5cf6" },
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "16px 20px",
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderRadius: 8,
  border: "1px solid var(--border)",
  padding: "10px 12px",
  background: "color-mix(in srgb, var(--text) 2%, transparent)",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div style={card}>
        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
          Activité récente
        </h3>
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Aucune activité récente
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
        Activité récente
      </h3>
      <div className="space-y-2">
        {activities.slice(0, 5).map((activity) => {
          const typeInfo = eventTypeConfig[activity.event_type] ?? {
            label: activity.event_type,
            bg: "color-mix(in srgb, var(--text) 8%, transparent)",
            color: "var(--text-muted)",
          };
          const statusInfo = activity.status
            ? (statusConfig[activity.status] ?? { label: activity.status, color: "var(--text-muted)" })
            : null;

          return (
            <div key={activity.event_id} style={row}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: typeInfo.bg, color: typeInfo.color }}
                  >
                    {typeInfo.label}
                  </span>
                  {statusInfo && (
                    <span className="text-xs font-medium" style={{ color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
                {activity.actor_email && (
                  <p className="mt-1 truncate text-sm" style={{ color: "var(--text)" }}>
                    {activity.actor_email}
                  </p>
                )}
                {activity.detail && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {activity.detail}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                {activity.amount !== null && (
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {activity.amount.toFixed(0)} FCFA
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {new Date(activity.occurred_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
