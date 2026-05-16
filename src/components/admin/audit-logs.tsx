"use client";

import { useState } from "react";
import { AuditLog } from "@/types/audit";

interface AuditLogsProps {
  logs: AuditLog[];
}

const actionConfig: Record<string, { label: string; bg: string; color: string }> = {
  insert: { label: "Créé",     bg: "rgba(16,185,129,0.15)",  color: "#10b981" },
  update: { label: "Modifié", bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" },
  delete: { label: "Supprimé", bg: "rgba(239,68,68,0.15)",   color: "#ef4444" },
};

const tableLabels: Record<string, string> = {
  purchases:       "Achats",
  gift_codes:      "Codes",
  users:           "Utilisateurs",
  products:        "Produits",
  categories:      "Catégories",
  discount_codes:  "Codes promo",
  refund_requests: "Remboursements",
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "20px 24px",
};

export function AuditLogs({ logs }: AuditLogsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!logs || logs.length === 0) {
    return (
      <div style={card}>
        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
          Journal d'audit
        </h3>
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Aucune activité enregistrée
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
        Journal d'audit
      </h3>
      <div className="space-y-2">
        {logs.slice(0, 50).map((log) => {
          const actionInfo = actionConfig[log.action] ?? {
            label: log.action,
            bg: "color-mix(in srgb, var(--text) 8%, transparent)",
            color: "var(--text-muted)",
          };
          const tableLabel = tableLabels[log.table_name] || log.table_name;
          const isExpanded = expanded === log.id;

          return (
            <div
              key={log.id}
              style={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "color-mix(in srgb, var(--text) 2%, transparent)",
                overflow: "hidden",
              }}
            >
              <div
                className="flex cursor-pointer items-center justify-between p-3"
                onClick={() => setExpanded(isExpanded ? null : log.id)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: actionInfo.bg, color: actionInfo.color }}
                  >
                    {actionInfo.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {tableLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {new Date(log.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <svg
                    className="h-3 w-3 transition-transform"
                    style={{
                      color: "var(--text-faint)",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                    }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <p className="px-3 pb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                ID&nbsp;: {log.record_id.slice(0, 8)}…
                {log.ip_address && ` • ${log.ip_address}`}
              </p>

              {isExpanded && (
                <div
                  className="space-y-2 px-3 pb-3 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {log.old_data && (
                    <div>
                      <p className="mb-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        Avant&nbsp;:
                      </p>
                      <pre
                        className="overflow-x-auto rounded p-2 text-xs"
                        style={{
                          background: "color-mix(in srgb, var(--text) 5%, transparent)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {JSON.stringify(log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_data && (
                    <div>
                      <p className="mb-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        Après&nbsp;:
                      </p>
                      <pre
                        className="overflow-x-auto rounded p-2 text-xs"
                        style={{
                          background: "color-mix(in srgb, var(--text) 5%, transparent)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
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
