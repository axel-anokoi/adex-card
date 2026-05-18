"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { PurchaseCard } from "@/components/dashboard/purchase-card";
import { createClient } from "@/lib/supabase/client";

interface PurchaseItem {
  id: string;
  product: {
    id: string;
    amount: number;
    category: { name: string } | null;
  };
  gift_code: { code: string; expires_at: string | null } | null;
  quantity: number;
  unit_price: number;
}

interface Purchase {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  purchase_items: PurchaseItem[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

const ITEMS_PER_PAGE = 5;
let toastId = 0;

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const addToast = (message: string, type: Toast["type"]) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchPurchases = useCallback(async () => {
    try {
      const response = await fetch("/api/user/purchases");
      if (response.status === 401) { router.push("/login"); return; }
      if (!response.ok) throw new Error();
      const { data } = await response.json();
      setPurchases(data || []);
      setCurrentPage(1);
    } catch {
      // silent — user stays on page
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const channel = supabase
        .channel("purchases-realtime")
        .on("postgres_changes", {
          event: "*", schema: "public", table: "purchases",
          filter: `user_id=eq.${user.id}`,
        }, () => fetchPurchases())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    });
  }, [fetchPurchases]);

  const handleRefundRequest = async () => {
    if (!selectedPurchase || !refundReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_id: selectedPurchase, reason: refundReason }),
      });
      if (res.ok) {
        addToast("Demande de remboursement envoyée", "success");
        setShowRefundModal(false);
        setRefundReason("");
        setSelectedPurchase(null);
      } else {
        const err = await res.json();
        addToast(err.error || "Erreur lors de la soumission", "error");
      }
    } catch {
      addToast("Erreur lors de la soumission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10" style={{ minHeight: "100vh" }}>
        <div className="h-8 w-52 rounded-xl animate-pulse" style={{ background: "var(--bg3)" }} />
        <div className="mt-6 grid gap-3 grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl p-4 h-20 animate-pulse"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          ))}
        </div>
        <div className="mt-8 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 h-16 animate-pulse"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalCodeCount = purchases.reduce(
    (sum, p) => sum + p.purchase_items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const totalPages = Math.max(1, Math.ceil(purchases.length / ITEMS_PER_PAGE));
  const paginatedPurchases = purchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10" style={{ minHeight: "100vh" }}>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
            style={{
              background: toast.type === "success" ? "var(--green)" : "#ef4444",
              color: "#000",
              animation: "fadeUp 0.25s ease-out",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
        Mon Dashboard
      </h1>

      {/* Stats */}
      <div className="mt-4 sm:mt-6 grid gap-3 grid-cols-3">
        {[
          { label: "Commandes", value: purchases.length, suffix: "" },
          { label: "Total dépensé", value: totalSpent.toLocaleString("fr-FR"), suffix: " FCFA" },
          { label: "Codes livrés", value: totalCodeCount, suffix: "" },
        ].map(({ label, value, suffix }) => (
          <div
            key={label}
            className="rounded-xl p-3 sm:p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="text-base sm:text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
              {value}
              {suffix && (
                <span className="text-xs sm:text-sm font-normal" style={{ color: "var(--text-faint)" }}>
                  {suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Purchase History */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>
              Historique des commandes
            </h2>
            {purchases.length > 0 && (
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {purchases.length} commande{purchases.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {purchases.length === 0 ? (
            <div
              className="mt-4 rounded-xl p-6 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>Aucune commande pour le moment.</p>
              <Link href="/shop" className="mt-4 inline-block text-sm font-medium"
                style={{ color: "var(--cyan)" }}>
                Commencer à acheter
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {paginatedPurchases.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    onRefundRequest={(id) => { setSelectedPurchase(id); setShowRefundModal(true); }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-cyan)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Précédent
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: page === currentPage ? "var(--cyan)" : "var(--bg-card)",
                          border: "1px solid",
                          borderColor: page === currentPage ? "var(--cyan)" : "var(--border)",
                          color: page === currentPage ? "#000" : "var(--text-muted)",
                          fontWeight: page === currentPage ? 700 : 500,
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-cyan)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    Suivant
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Notifications */}
        <div>
          <NotificationPanel />
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text)" }}>
              Demander un remboursement
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Veuillez expliquer la raison de votre demande de remboursement.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Décrivez votre problème..."
              rows={4}
              className="mt-4 w-full rounded-lg p-3 text-sm resize-none outline-none focus:ring-1"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowRefundModal(false); setRefundReason(""); setSelectedPurchase(null); }}
                className="flex-1 min-h-[48px] rounded-xl px-4 py-2 text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}
              >
                Annuler
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={submitting || !refundReason.trim()}
                className="flex-1 min-h-[48px] rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
