"use client";

import { useState } from "react";

interface RefundRequest {
  id: string;
  purchase_id: string;
  user_id: string;
  reason: string;
  status: string;
  admin_note: string | null;
  amount: number | null;
  created_at: string;
  user?: { email: string };
}

interface RefundManagerProps {
  refunds: RefundRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onProcess: (id: string) => void;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "En attente", bg: "rgba(245,158,11,0.15)",  color: "#f59e0b" },
  approved:  { label: "Approuvé",   bg: "var(--cyan-dim)",         color: "var(--cyan)" },
  rejected:  { label: "Rejeté",     bg: "rgba(239,68,68,0.15)",    color: "#ef4444" },
  processed: { label: "Traité",     bg: "rgba(16,185,129,0.15)",   color: "#10b981" },
};

const filterLabels: Record<string, string> = {
  all: "Tout", pending: "En attente", approved: "Approuvé", processed: "Traité", rejected: "Rejeté",
};

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 8,
  border: "1px solid var(--border)",
  background: "color-mix(in srgb, var(--bg) 60%, transparent)",
  color: "var(--text)", padding: "8px 10px", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

export function RefundManager({ refunds, onApprove, onReject, onProcess }: RefundManagerProps) {
  const [selectedRefund, setSelectedRefund] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState("pending");

  const filteredRefunds = refunds.filter((r) => filter === "all" || r.status === filter);

  const handleApprove = (id: string) => {
    onApprove(id);
    setSelectedRefund(null);
    setAdminNote("");
  };

  const handleReject = (id: string) => {
    if (!adminNote.trim()) {
      alert("Veuillez ajouter une note pour le rejet");
      return;
    }
    onReject(id, adminNote);
    setSelectedRefund(null);
    setAdminNote("");
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(filterLabels).map(([status, label]) => {
          const isActive = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: isActive ? "var(--cyan)" : "color-mix(in srgb, var(--text) 6%, transparent)",
                color: isActive ? "#000" : "var(--text-muted)",
                border: `1px solid ${isActive ? "var(--border-cyan)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filteredRefunds.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Aucun remboursement
        </p>
      ) : (
        <div className="space-y-3">
          {filteredRefunds.map((refund) => {
            const statusInfo = statusConfig[refund.status] ?? {
              label: refund.status,
              bg: "color-mix(in srgb, var(--text) 8%, transparent)",
              color: "var(--text-muted)",
            };

            return (
              <div
                key={refund.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  padding: "16px",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.label}
                      </span>
                      {refund.amount && (
                        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                          {refund.amount.toFixed(0)} FCFA
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--text)" }}>
                      {refund.reason}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                      Demandé le{" "}
                      {new Date(refund.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    {refund.user?.email && (
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {refund.user.email}
                      </p>
                    )}
                    {refund.admin_note && (
                      <p
                        className="mt-2 rounded-lg p-2 text-xs"
                        style={{
                          background: "color-mix(in srgb, var(--text) 5%, transparent)",
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--text)" }}>Note admin&nbsp;:</strong>{" "}
                        {refund.admin_note}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {refund.status === "pending" && (
                      <button
                        onClick={() => setSelectedRefund(refund.id)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.25)",
                        }}
                      >
                        Traiter
                      </button>
                    )}
                    {refund.status === "approved" && (
                      <button
                        onClick={() => onProcess(refund.id)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
                        style={{
                          background: "rgba(16,185,129,0.12)",
                          color: "#10b981",
                          border: "1px solid rgba(16,185,129,0.25)",
                        }}
                      >
                        Procéder au remboursement
                      </button>
                    )}
                  </div>
                </div>

                {selectedRefund === refund.id && (
                  <div
                    className="mt-4 pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Note administrative (requis pour le rejet)"
                      style={{ ...inputStyle, resize: "vertical" }}
                      rows={2}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleApprove(refund.id)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                        style={{ background: "#059669", color: "white", border: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#047857")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#059669")}
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(refund.id)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                        style={{ background: "#dc2626", color: "white", border: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => { setSelectedRefund(null); setAdminNote(""); }}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                        style={{
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--text-muted)",
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
