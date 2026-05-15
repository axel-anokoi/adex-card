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

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  purchase: { label: "Commande", color: "text-emerald-600 bg-emerald-100" },
  refund_request: { label: "Remboursement", color: "text-amber-600 bg-amber-100" },
  new_user: { label: "Nouveau", color: "text-violet-600 bg-violet-100" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: "Payé", color: "text-emerald-600" },
  pending: { label: "En attente", color: "text-amber-600" },
  refunded: { label: "Remboursé", color: "text-gray-600" },
  approved: { label: "Approuvé", color: "text-cyan-600" },
  rejected: { label: "Rejeté", color: "text-red-600" },
  registered: { label: "Inscription", color: "text-violet-600" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Activité récente</h3>
        <p className="text-center text-black/60">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold">Activité récente</h3>
      <div className="space-y-3">
        {activities.slice(0, 10).map((activity) => {
          const typeInfo = eventTypeLabels[activity.event_type] || { label: activity.event_type, color: "text-gray-600 bg-gray-100" };
          const statusInfo = activity.status ? (statusLabels[activity.status] || { label: activity.status, color: "text-gray-600" }) : null;

          return (
            <div
              key={activity.event_id}
              className="flex items-center gap-3 rounded-lg border border-black/5 p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  {statusInfo && (
                    <span className={`text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
                {activity.actor_email && (
                  <p className="mt-1 truncate text-sm text-black/80">{activity.actor_email}</p>
                )}
                {activity.detail && (
                  <p className="mt-1 truncate text-xs text-black/50">{activity.detail}</p>
                )}
              </div>
              <div className="text-right">
                {activity.amount !== null && (
                  <p className="text-sm font-medium">{activity.amount.toFixed(2)} FCFA</p>
                )}
                <p className="text-xs text-black/40">
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
