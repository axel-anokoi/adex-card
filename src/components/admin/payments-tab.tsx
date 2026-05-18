"use client";

import { useState, useEffect } from "react";
import { Pagination } from "./pagination";

interface PurchaseItem {
  id: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  total_price: number;
  product: {
    id: string;
    amount: number;
    sell_price: number;
    buy_price: number;
    category: {
      name: string;
      slug: string;
      logo_url: string | null;
    } | null;
  } | null;
  gift_code: { code: string } | null;
}

interface Purchase {
  id: string;
  total_amount: number;
  total_buy_cost: number;
  profit: number;
  status: string;
  payment_method: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  user: {
    email: string;
    nom: string | null;
    prenoms: string | null;
    telephone: string | null;
  } | null;
  purchase_items: PurchaseItem[];
}

interface PaymentsTabProps {
  purchases: Purchase[];
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  paid:                  { label: "Payé",       bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  pending:               { label: "En attente", bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  pending_manual_review: { label: "En revue",   bg: "rgba(99,102,241,0.12)",  color: "#6366f1" },
  failed:                { label: "Échoué",     bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  refunded:              { label: "Remboursé",  bg: "color-mix(in srgb, var(--text) 8%, transparent)", color: "var(--text-muted)" },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  djamo: { label: "Djamo",      icon: "💳" },
  moov:  { label: "Moov Money", icon: "📱" },
  wave:  { label: "Wave",       icon: "🌊" },
};

const CATEGORY_ICONS: Record<string, string> = {
  playstation: "🎮",
  xbox:        "🎯",
  nintendo:    "🍄",
  apple:       "🍎",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function getDisplayName(p: Purchase): string {
  const fromUser = [p.user?.prenoms, p.user?.nom].filter(Boolean).join(" ");
  return fromUser || p.customer_name || p.user?.email || p.customer_email || "—";
}

function getDisplayEmail(p: Purchase): string | null {
  return p.user?.email || p.customer_email || null;
}

function getDisplayPhone(p: Purchase): string | null {
  return p.user?.telephone || p.customer_phone || null;
}

function isPendingStatus(status: string): boolean {
  return status === "pending" || status === "pending_manual_review";
}

// ─── Purchase detail modal ────────────────────────────────────────────────────

function PurchaseModal({
  purchase,
  onClose,
  onMarkPaid,
  updating,
}: {
  purchase: Purchase;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  updating: boolean;
}) {
  const status = STATUS_STYLES[purchase.status] ?? { label: purchase.status, bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
  const pm     = purchase.payment_method ? (PAYMENT_LABELS[purchase.payment_method] ?? { label: purchase.payment_method, icon: "💰" }) : null;
  const isPending = isPendingStatus(purchase.status);
  const margin    = purchase.total_amount > 0 ? ((purchase.profit / purchase.total_amount) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 24, width: "100%", maxWidth: 560,
          maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--cyan)", fontFamily: "monospace" }}>
                #{shortId(purchase.id)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 8px", background: status.bg, color: status.color }}>
                {status.label}
              </span>
              {pm && (
                <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "2px 8px", background: "color-mix(in srgb, var(--text) 6%, transparent)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  {pm.icon} {pm.label}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {new Date(purchase.created_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Customer info */}
        <div style={{
          padding: "14px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13,
        }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>👤 {getDisplayName(purchase)}</span>
          {getDisplayEmail(purchase) && <span style={{ color: "var(--text-muted)" }}>📧 {getDisplayEmail(purchase)}</span>}
          {getDisplayPhone(purchase) && <span style={{ color: "var(--text-muted)" }}>📞 {getDisplayPhone(purchase)}</span>}
        </div>

        {/* Items list — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Produits ({purchase.purchase_items.length})
          </p>

          {isPending ? (
            /* Pending state — codes hidden */
            <div style={{
              borderRadius: 14, border: "1px dashed rgba(245,158,11,0.4)",
              background: "rgba(245,158,11,0.06)", padding: "32px 20px",
              textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 32 }}>🔒</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>Informations non disponible</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Les codes cadeaux seront visibles une fois le paiement confirmé.
              </p>
            </div>
          ) : (
            purchase.purchase_items.map((item) => {
              const cat       = item.product?.category;
              const catIcon   = cat ? (CATEGORY_ICONS[cat.slug] ?? "🎮") : "🎮";
              const sellP     = item.unit_price;
              const buyP      = item.unit_cost ?? item.product?.buy_price ?? 0;
              const itemProfit = (sellP - buyP) * item.quantity;

              return (
                <div key={item.id} style={{
                  borderRadius: 14, border: "1px solid var(--border)",
                  background: "color-mix(in srgb, var(--bg) 55%, transparent)",
                  overflow: "hidden",
                }}>
                  {/* Category + product info */}
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: "color-mix(in srgb, var(--bg2) 80%, transparent)",
                      border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, flexShrink: 0, overflow: "hidden",
                    }}>
                      {cat?.logo_url
                        ? <img src={cat.logo_url} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        : catIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        {cat?.name ?? "Catégorie inconnue"}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Carte {item.product?.amount?.toLocaleString("fr-FR") ?? "—"} FCFA · Qté {item.quantity}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bénéfice</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: itemProfit >= 0 ? "#10b981" : "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(itemProfit)}
                      </p>
                    </div>
                  </div>

                  {/* Gift code */}
                  <div style={{ padding: "12px 16px", background: "var(--cyan-dim)" }}>
                    <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Code cadeau livré
                    </p>
                    <p style={{
                      fontSize: 16, fontFamily: "monospace", fontWeight: 800, color: "var(--cyan)",
                      letterSpacing: "0.06em", wordBreak: "break-all",
                      background: "var(--cyan-dim)", borderRadius: 8, padding: "8px 12px",
                      border: "1px solid var(--border-cyan)",
                    }}>
                      {item.gift_code?.code ?? "—"}
                    </p>
                  </div>

                  {/* Price breakdown */}
                  <div style={{ padding: "10px 16px", display: "flex", gap: 20, flexWrap: "wrap", borderTop: "1px solid var(--border)" }}>
                    {[
                      { label: "Prix vente",  value: fmt(sellP),  color: "var(--text)" },
                      { label: "Prix achat",  value: fmt(buyP),   color: "#f59e0b" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            {[
              { label: "Total vente", value: fmt(purchase.total_amount),  color: "var(--cyan)" },
              { label: "Coût total",  value: fmt(purchase.total_buy_cost), color: "#f59e0b" },
              { label: "Bénéfice",    value: fmt(purchase.profit),         color: purchase.profit >= 0 ? "#10b981" : "#ef4444" },
              { label: "Marge",       value: `${margin}%`,                 color: "var(--violet)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1, minWidth: 100,
                borderRadius: 10, border: "1px solid var(--border)",
                background: "color-mix(in srgb, var(--bg) 60%, transparent)",
                padding: "8px 12px",
              }}>
                <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: 10,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Fermer
            </button>
            {isPending && (
              <button
                onClick={() => onMarkPaid(purchase.id)}
                disabled={updating}
                style={{
                  flex: 2, padding: "10px", borderRadius: 10,
                  border: "1px solid rgba(16,185,129,0.5)",
                  background: "rgba(16,185,129,0.12)", color: "#10b981",
                  fontSize: 13, fontWeight: 700,
                  cursor: updating ? "not-allowed" : "pointer",
                  opacity: updating ? 0.6 : 1, transition: "all 0.2s",
                }}
              >
                {updating ? "Mise à jour…" : "✓ Confirmer le paiement"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentsTab({ purchases, onUpdateStatus }: PaymentsTabProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(0); }, [search, filterStatus, filterMethod]);

  const filtered = purchases.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchMethod = filterMethod === "all" || p.payment_method === filterMethod;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.id.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.user?.nom?.toLowerCase().includes(q) ||
      p.user?.prenoms?.toLowerCase().includes(q) ||
      p.user?.telephone?.includes(q) ||
      p.customer_name?.toLowerCase().includes(q) ||
      p.customer_email?.toLowerCase().includes(q) ||
      p.customer_phone?.includes(q);
    return matchStatus && matchMethod && matchSearch;
  });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalRevenue = filtered.reduce((s, p) => s + p.total_amount, 0);
  const totalCost    = filtered.reduce((s, p) => s + p.total_buy_cost, 0);
  const totalProfit  = filtered.reduce((s, p) => s + p.profit, 0);
  const paidCount    = filtered.filter((p) => p.status === "paid").length;

  const methodStats: Record<string, { total: number; paid: number; failed: number }> = {};
  purchases.forEach((p) => {
    const m = p.payment_method || "unknown";
    if (!methodStats[m]) methodStats[m] = { total: 0, paid: 0, failed: 0 };
    methodStats[m].total++;
    if (p.status === "paid")   methodStats[m].paid++;
    if (p.status === "failed") methodStats[m].failed++;
  });

  const handleMarkPaid = async (id: string) => {
    if (!onUpdateStatus) return;
    setUpdating(id);
    try {
      await onUpdateStatus(id, "paid");
      // Update modal if it's open on this purchase
      if (selectedPurchase?.id === id) {
        setSelectedPurchase((prev) => prev ? { ...prev, status: "paid" } : prev);
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { label: "Commandes",     value: filtered.length,                                   color: "var(--cyan)" },
            { label: "Payées",        value: paidCount,                                         color: "#10b981" },
            { label: "Chiffre d'aff", value: fmt(totalRevenue),                                 color: "var(--cyan)" },
            { label: "Coût d'achat",  value: fmt(totalCost),                                    color: "#f59e0b" },
            { label: "Bénéfice net",  value: fmt(totalProfit), color: totalProfit >= 0 ? "#10b981" : "#ef4444" },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              borderRadius: 12, border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--bg2) 80%, transparent)",
              padding: "14px 16px",
            }}>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: "tabular-nums" }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Payment method stats */}
        {Object.keys(methodStats).length > 0 && (
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 70%, transparent)", padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Taux de réussite par moyen de paiement
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(methodStats).map(([method, stats]) => {
                const resolved  = stats.paid + stats.failed;
                const rate      = resolved > 0 ? Math.round((stats.paid / resolved) * 100) : null;
                const pm        = PAYMENT_LABELS[method] ?? { label: method, icon: "💰" };
                const rateColor = rate === null ? "var(--text-muted)" : rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={method} style={{
                    borderRadius: 10, border: "1px solid var(--border)",
                    background: "color-mix(in srgb, var(--bg) 60%, transparent)",
                    padding: "10px 16px", minWidth: 160,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                      {pm.icon} {pm.label}
                    </p>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--text-muted)" }}>{stats.total} cmd</span>
                      <span style={{ color: "#10b981" }}>{stats.paid} payées</span>
                      {stats.failed > 0 && <span style={{ color: "#ef4444" }}>{stats.failed} échouées</span>}
                    </div>
                    {rate !== null && (
                      <p style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: rateColor, fontVariantNumeric: "tabular-nums" }}>
                        {rate}% <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>réussite</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Rechercher par email, nom, téléphone, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, borderRadius: 10, border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--bg2) 60%, transparent)",
              color: "var(--text)", padding: "8px 14px", fontSize: 13, outline: "none",
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              borderRadius: 10, border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--bg2) 60%, transparent)",
              color: "var(--text)", padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="pending_manual_review">En revue</option>
            <option value="failed">Échoué</option>
            <option value="refunded">Remboursé</option>
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            style={{
              borderRadius: 10, border: "1px solid var(--border)",
              background: "color-mix(in srgb, var(--bg2) 60%, transparent)",
              color: "var(--text)", padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer",
            }}
          >
            <option value="all">Tous les moyens</option>
            <option value="djamo">💳 Djamo</option>
            <option value="moov">📱 Moov Money</option>
            <option value="wave">🌊 Wave</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            Aucune commande trouvée
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginated.map((purchase) => {
              const isOpen    = expanded === purchase.id;
              const status    = STATUS_STYLES[purchase.status] ?? { label: purchase.status, bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
              const pm        = purchase.payment_method ? (PAYMENT_LABELS[purchase.payment_method] ?? { label: purchase.payment_method, icon: "💰" }) : null;
              const margin    = purchase.total_amount > 0 ? ((purchase.profit / purchase.total_amount) * 100).toFixed(1) : "0.0";
              const isPending = isPendingStatus(purchase.status);

              return (
                <div
                  key={purchase.id}
                  style={{
                    borderRadius: 14, border: "1px solid var(--border)",
                    background: "color-mix(in srgb, var(--bg2) 70%, transparent)",
                    overflow: "hidden", transition: "border-color 0.2s",
                    ...(isOpen && { borderColor: "var(--border-cyan)" }),
                  }}
                >
                  {/* Header row — expands inline */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : purchase.id)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap",
                        gap: 12, padding: "14px 16px", background: "transparent",
                        border: "none", cursor: "pointer", textAlign: "left", minWidth: 0,
                      }}
                    >
                      {/* ID + date */}
                      <div style={{ minWidth: 100 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--cyan)", fontFamily: "monospace" }}>
                          #{shortId(purchase.id)}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                          {new Date(purchase.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>

                      {/* Buyer */}
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {getDisplayName(purchase)}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {getDisplayEmail(purchase)}
                        </p>
                        {getDisplayPhone(purchase) && (
                          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
                            📞 {getDisplayPhone(purchase)}
                          </p>
                        )}
                      </div>

                      {/* Amounts */}
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {[
                          { label: "Vente",    value: fmt(purchase.total_amount),  color: "var(--text)" },
                          { label: "Coût",     value: fmt(purchase.total_buy_cost), color: "#f59e0b" },
                          { label: "Bénéfice", value: fmt(purchase.profit),         color: purchase.profit >= 0 ? "#10b981" : "#ef4444" },
                          { label: "Marge",    value: `${margin}%`,                color: "var(--violet)" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Payment method + Status */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {pm && (
                          <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: "3px 8px", background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                            {pm.icon} {pm.label}
                          </span>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px", background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                        <svg
                          style={{ width: 16, height: 16, color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* "Voir détails" button — opens modal */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPurchase(purchase); }}
                      title="Voir le détail complet"
                      style={{
                        padding: "0 16px", height: "100%", minHeight: 56,
                        background: "rgba(0,255,224,0.04)", border: "none",
                        borderLeft: "1px solid var(--border)",
                        color: "var(--cyan)", cursor: "pointer",
                        fontSize: 18, transition: "background 0.2s", flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,255,224,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,255,224,0.04)")}
                    >
                      🔍
                    </button>
                  </div>

                  {/* Inline expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                        Produits achetés ({purchase.purchase_items.length})
                      </p>

                      {isPending ? (
                        <div style={{
                          borderRadius: 10, border: "1px dashed rgba(245,158,11,0.4)",
                          background: "rgba(245,158,11,0.05)", padding: "20px",
                          textAlign: "center", color: "#f59e0b", fontSize: 13, fontWeight: 600,
                        }}>
                          🔒 Informations non disponible — paiement en attente de confirmation
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {purchase.purchase_items.map((item) => {
                            const cat       = item.product?.category;
                            const catIcon   = cat ? (CATEGORY_ICONS[cat.slug] ?? "🎮") : "🎮";
                            const sellP     = item.unit_price;
                            const buyP      = item.unit_cost ?? item.product?.buy_price ?? 0;
                            const itemProfit = (sellP - buyP) * item.quantity;

                            return (
                              <div key={item.id} style={{
                                display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12,
                                borderRadius: 10, border: "1px solid var(--border)",
                                background: "color-mix(in srgb, var(--bg) 60%, transparent)",
                                padding: "10px 14px",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                                  {cat?.logo_url
                                    ? <img src={cat.logo_url} alt={cat.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
                                    : <span style={{ fontSize: 24 }}>{catIcon}</span>
                                  }
                                  <div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{cat?.name ?? "—"}</p>
                                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                      {item.product?.amount?.toLocaleString("fr-FR")} FCFA
                                    </p>
                                  </div>
                                </div>

                                <div style={{ flex: 1, minWidth: 120 }}>
                                  <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Code livré</p>
                                  <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--cyan)", letterSpacing: "0.04em", marginTop: 2 }}>
                                    {item.gift_code?.code ?? "—"}
                                  </p>
                                </div>

                                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>×{item.quantity}</span>

                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  {[
                                    { label: "Vente",  value: fmt(sellP),  color: "var(--text)" },
                                    { label: "Achat",  value: fmt(buyP),   color: "#f59e0b" },
                                    { label: "Profit", value: fmt(itemProfit), color: itemProfit >= 0 ? "#10b981" : "#ef4444" },
                                  ].map(({ label, value, color }) => (
                                    <div key={label} style={{ textAlign: "right" }}>
                                      <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                                      <p style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer actions */}
                      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                        <div style={{
                          flex: 1, padding: "10px 14px", borderRadius: 10,
                          background: "color-mix(in srgb, var(--bg) 40%, transparent)",
                          border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)",
                          display: "flex", flexWrap: "wrap", gap: 16,
                        }}>
                          {getDisplayEmail(purchase) && <span>📧 {getDisplayEmail(purchase)}</span>}
                          {getDisplayPhone(purchase) && <span>📞 {getDisplayPhone(purchase)}</span>}
                          {pm && <span>{pm.icon} {pm.label}</span>}
                          <span style={{ opacity: 0.5 }}>🆔 {purchase.id}</span>
                        </div>

                        {isPending && onUpdateStatus && (
                          <button
                            onClick={() => handleMarkPaid(purchase.id)}
                            disabled={updating === purchase.id}
                            style={{
                              padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.5)",
                              background: "rgba(16,185,129,0.12)", color: "#10b981",
                              fontSize: 12, fontWeight: 700,
                              cursor: updating === purchase.id ? "not-allowed" : "pointer",
                              opacity: updating === purchase.id ? 0.6 : 1, transition: "all 0.2s", flexShrink: 0,
                            }}
                          >
                            {updating === purchase.id ? "…" : "✓ Marquer payée"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
        />
      </div>

      {/* Purchase detail modal */}
      {selectedPurchase && (
        <PurchaseModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onMarkPaid={handleMarkPaid}
          updating={updating === selectedPurchase.id}
        />
      )}
    </>
  );
}
