"use client";

import { useState } from "react";

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  actor?: {
    email: string;
  };
}

interface AuditLogsProps {
  logs: AuditLog[];
}

const actionLabels: Record<string, { label: string; color: string }> = {
  insert: { label: "Créé", color: "text-emerald-600 bg-emerald-100" },
  update: { label: "Modifié", color: "text-amber-600 bg-amber-100" },
  delete: { label: "Supprimé", color: "text-red-600 bg-red-100" },
};

const tableLabels: Record<string, string> = {
  purchases: "Achats",
  gift_codes: "Codes",
  users: "Utilisateurs",
  products: "Produits",
  categories: "Catégories",
  discount_codes: "Codes promo",
  refund_requests: "Remboursements",
};

export function AuditLogs({ logs }: AuditLogsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold">Journal d &#39; audit</h3>
        <p className="text-center text-black/60">Aucune activité</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold">Journal d &#39; audit</h3>
      <div className="space-y-2">
        {logs.slice(0, 50).map((log) => {
          const actionInfo = actionLabels[log.action] || { label: log.action, color: "text-gray-600 bg-gray-100" };
          const tableLabel = tableLabels[log.table_name] || log.table_name;

          return (
            <div key={log.id} className="rounded-lg border border-black/5 p-3">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                  <span className="text-sm font-medium">{tableLabel}</span>
                </div>
                <span className="text-xs text-black/40">
                  {new Date(log.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mt-1 text-xs text-black/50">
                ID: {log.record_id.slice(0, 8)}...
                {log.ip_address && ` • ${log.ip_address}`}
              </p>

              {expanded === log.id && (
                <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
                  {log.old_data && (
                    <div>
                      <p className="text-xs font-medium text-black/60">Avant:</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-black/5 p-2 text-xs">
                        {JSON.stringify(log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_data && (
                    <div>
                      <p className="text-xs font-medium text-black/60">Après:</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-black/5 p-2 text-xs">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
