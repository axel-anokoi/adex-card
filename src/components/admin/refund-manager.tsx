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
  user?: {
    email: string;
  };
}

interface RefundManagerProps {
  refunds: RefundRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onProcess: (id: string) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-amber-600 bg-amber-100" },
  approved: { label: "Approuvé", color: "text-cyan-600 bg-cyan-100" },
  rejected: { label: "Rejeté", color: "text-red-600 bg-red-100" },
  processed: { label: "Traité", color: "text-emerald-600 bg-emerald-100" },
};

export function RefundManager({ refunds, onApprove, onReject, onProcess }: RefundManagerProps) {
  const [selectedRefund, setSelectedRefund] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<string>("pending");

  const filteredRefunds = refunds.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const handleApprove = (id: string) => {
    onApprove(id);
    setSelectedRefund(null);
    setAdminNote("");
  };

  const handleReject = (id: string) => {
    if (!adminNote.trim()) {
      alert("Veuillez ajouter une note pour rejet");
      return;
    }
    onReject(id, adminNote);
    setSelectedRefund(null);
    setAdminNote("");
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["all", "pending", "approved", "processed", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              filter === status
                ? "bg-cyan text-black"
                : "bg-black/5 text-black/60 hover:bg-black/10"
            }`}
          >
            {status === "all" ? "Tout" : statusLabels[status]?.label || status}
          </button>
        ))}
      </div>

      {filteredRefunds.length === 0 ? (
        <p className="text-center text-black/60">Aucun remboursement</p>
      ) : (
        <div className="space-y-3">
          {filteredRefunds.map((refund) => {
            const statusInfo = statusLabels[refund.status] || { label: refund.status, color: "text-gray-600 bg-gray-100" };

            return (
              <div
                key={refund.id}
                className="rounded-xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {refund.amount && (
                        <span className="text-sm font-medium">{refund.amount.toFixed(2)} FCFA</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-black/80">{refund.reason}</p>
                    <p className="mt-1 text-xs text-black/40">
                      Demandé le{" "}
                      {new Date(refund.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {refund.admin_note && (
                      <p className="mt-2 rounded-lg bg-black/5 p-2 text-xs">
                        <strong>Note admin:</strong> {refund.admin_note}
                      </p>
                    )}
                  </div>

                  {refund.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRefund(refund.id)}
                        className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-200"
                      >
                        Traiter
                      </button>
                    </div>
                  )}

                  {refund.status === "approved" && (
                    <button
                      onClick={() => onProcess(refund.id)}
                      className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-200"
                    >
                      Procéder au remboursement
                    </button>
                  )}
                </div>

                {selectedRefund === refund.id && (
                  <div className="mt-4 border-t border-black/10 pt-4">
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Note administrative (requis pour rejet)"
                      className="w-full rounded-lg border border-black/20 p-2 text-sm"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleApprove(refund.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(refund.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Rejeter
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRefund(null);
                          setAdminNote("");
                        }}
                        className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium"
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
