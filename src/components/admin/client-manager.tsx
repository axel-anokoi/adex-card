"use client";

import { useCallback, useEffect, useState } from "react";
import { Pagination } from "./pagination";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  email: string;
  nom: string | null;
  prenoms: string | null;
  telephone: string | null;
  role: string;
  is_blocked: boolean;
  created_at: string;
  photo_profile: string | null;
  total_spent: number;
  purchase_count: number;
  last_purchase_at: string | null;
}

interface PurchaseItem {
  id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  product: { id: string; amount: number; category: { name: string; slug: string; logo_url: string | null } | null } | null;
  gift_code: { code: string } | null;
}

interface Purchase {
  id: string;
  total_amount: number;
  total_buy_cost: number;
  profit: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  purchase_items: PurchaseItem[];
}

interface ClientDetail extends Client {
  purchases: Purchase[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  paid:                  { label: "Payé",       bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  pending:               { label: "En attente", bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  pending_manual_review: { label: "En revue",   bg: "rgba(99,102,241,0.12)",  color: "#6366f1" },
  failed:                { label: "Échoué",     bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  refunded:              { label: "Remboursé",  bg: "rgba(107,114,128,0.12)", color: "#9ca3af" },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: string }> = {
  card:  { label: "Carte",      icon: "💳" },
  djamo: { label: "Djamo",      icon: "💳" },
  moov:  { label: "Moov Money", icon: "📱" },
  wave:  { label: "Wave",       icon: "🌊" },
};

const CATEGORY_ICONS: Record<string, string> = {
  playstation: "🎮", xbox: "🎯", nintendo: "🍄", apple: "🍎",
};

const AVATAR_COLORS = ["#7b2ff7", "#00b4d8", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(c: Pick<Client, "prenoms" | "nom" | "email">): string {
  const p = c.prenoms?.[0] ?? "";
  const n = c.nom?.[0] ?? "";
  return (p + n).toUpperCase() || c.email[0].toUpperCase();
}

function getDisplayName(c: Pick<Client, "prenoms" | "nom" | "email">): string {
  const parts = [c.prenoms, c.nom].filter(Boolean);
  return parts.length ? parts.join(" ") : c.email.split("@")[0];
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d: string): string {
  return new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ client, size = 40 }: { client: Pick<Client, "id" | "prenoms" | "nom" | "email" | "photo_profile">; size?: number }) {
  const color = getAvatarColor(client.id);
  if (client.photo_profile) {
    return (
      <img
        src={client.photo_profile}
        alt={getDisplayName(client)}
        style={{ width: size, height: size, borderRadius: size / 2, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: `${color}28`, border: `2px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, color, flexShrink: 0, letterSpacing: "-0.5px",
    }}>
      {getInitials(client)}
    </div>
  );
}

// ── Client Detail Modal ───────────────────────────────────────────────────────

function ClientModal({
  clientId,
  onClose,
  onUpdate,
}: {
  clientId: string;
  onClose: () => void;
  onUpdate: (updated: Partial<Client>) => void;
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom: "", prenoms: "", telephone: "" });

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setDetail(json.data);
          setEditForm({ nom: json.data.nom || "", prenoms: json.data.prenoms || "", telephone: json.data.telephone || "" });
        } else {
          setFetchError("Client introuvable");
        }
      })
      .catch(() => setFetchError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const { data } = await res.json();
        setDetail((prev) => (prev ? { ...prev, ...data } : prev));
        onUpdate(data);
        setEditMode(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!detail) return;
    setBlocking(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_blocked: !detail.is_blocked }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setDetail((prev) => (prev ? { ...prev, is_blocked: data.is_blocked } : prev));
        onUpdate({ is_blocked: data.is_blocked });
      }
    } finally {
      setBlocking(false);
    }
  };

  const paidOrders = detail?.purchases.filter((p) => p.status === "paid") ?? [];
  const totalCodes = paidOrders.reduce((s, p) => s + p.purchase_items.length, 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 24, width: "100%", maxWidth: 640, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.7)", animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>Chargement...</div>
        ) : fetchError || !detail ? (
          <div style={{ padding: 60, textAlign: "center", color: "#ef4444" }}>{fetchError ?? "Erreur"}</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 14 }}>
              <Avatar client={detail} size={54} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{getDisplayName(detail)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 8px", background: detail.is_blocked ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: detail.is_blocked ? "#ef4444" : "#10b981" }}>
                    {detail.is_blocked ? "Bloqué" : "Actif"}
                  </span>
                  {detail.role === "admin" && (
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "2px 8px", background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>Admin</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{detail.email}</p>
                <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>Membre depuis {fmtDate(detail.created_at)}</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>

            {/* Quick stats */}
            <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Total dépensé", value: fmt(detail.total_spent), color: "var(--cyan)" },
                { label: "Commandes",     value: detail.purchase_count,   color: "var(--text)" },
                { label: "Codes achetés", value: totalCodes,              color: "#a78bfa" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, minWidth: 90, borderRadius: 10, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 60%, transparent)", padding: "8px 12px" }}>
                  <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Info / Edit */}
              <div style={{ borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Informations</p>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--cyan)", background: "var(--cyan-dim)", border: "1px solid var(--border-cyan)", cursor: "pointer", padding: "3px 10px", borderRadius: 6 }}
                    >
                      Modifier
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditMode(false)} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)", cursor: "pointer", padding: "3px 10px", borderRadius: 6 }}>
                        Annuler
                      </button>
                      <button onClick={handleSave} disabled={saving} style={{ fontSize: 12, fontWeight: 700, color: "#000", background: "var(--cyan, #00ffe0)", border: "none", cursor: saving ? "wait" : "pointer", padding: "3px 12px", borderRadius: 6, opacity: saving ? 0.7 : 1 }}>
                        {saving ? "..." : "Enregistrer"}
                      </button>
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {([
                      { label: "Prénom(s)", key: "prenoms" as const, placeholder: "Prénom" },
                      { label: "Nom",       key: "nom"     as const, placeholder: "Nom de famille" },
                      { label: "Téléphone", key: "telephone" as const, placeholder: "+225 00 00 00 00" },
                    ] as const).map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>{label}</label>
                        <input
                          type="text"
                          value={editForm[key]}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 14 }}>
                    {detail.telephone && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>📞 {detail.telephone}</span>}
                    {detail.last_purchase_at && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>🛒 Dernière commande {fmtDate(detail.last_purchase_at)}</span>}
                    {!detail.telephone && !detail.last_purchase_at && (
                      <span style={{ fontSize: 13, color: "var(--text-faint)" }}>Aucune info supplémentaire</span>
                    )}
                  </div>
                )}
              </div>

              {/* Order history */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Historique commandes ({detail.purchases.length})
                </p>
                {detail.purchases.length === 0 ? (
                  <div style={{ borderRadius: 10, border: "1px dashed var(--border)", padding: 28, textAlign: "center", color: "var(--text-faint)", fontSize: 13 }}>
                    Aucune commande
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {detail.purchases.map((order) => {
                      const st = STATUS_STYLES[order.status] ?? { label: order.status, bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
                      const pm = order.payment_method ? (PAYMENT_LABELS[order.payment_method] ?? { label: order.payment_method, icon: "💰" }) : null;
                      const isOpen = expandedOrder === order.id;
                      const isPaid = order.status === "paid";

                      return (
                        <div key={order.id} style={{ borderRadius: 12, border: `1px solid ${isOpen ? "var(--border-cyan)" : "var(--border)"}`, background: "color-mix(in srgb, var(--bg) 50%, transparent)", overflow: "hidden", transition: "border-color 0.2s" }}>
                          <button
                            onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                            style={{ width: "100%", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                          >
                            <div style={{ minWidth: 80 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", fontFamily: "monospace" }}>#{shortId(order.id)}</p>
                              <p style={{ fontSize: 11, color: "var(--text-faint)" }}>{fmtDateTime(order.created_at)}</p>
                            </div>
                            <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 5, padding: "2px 7px", background: st.bg, color: st.color }}>{st.label}</span>
                              {pm && <span style={{ fontSize: 11, color: "var(--text-muted)", borderRadius: 5, padding: "2px 7px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>{pm.icon} {pm.label}</span>}
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(order.total_amount)}</p>
                              <p style={{ fontSize: 11, color: "var(--text-faint)" }}>{order.purchase_items.length} article{order.purchase_items.length > 1 ? "s" : ""}</p>
                            </div>
                            <svg style={{ width: 14, height: 14, color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {isOpen && (
                            <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--border)" }}>
                              <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                {order.purchase_items.map((item) => {
                                  const cat = item.product?.category;
                                  const icon = cat ? (CATEGORY_ICONS[cat.slug] ?? "🎮") : "🎮";
                                  return (
                                    <div key={item.id} style={{ borderRadius: 10, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 40%, transparent)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                                        {cat?.logo_url
                                          ? <img src={cat.logo_url} alt={cat.name} style={{ width: 30, height: 30, borderRadius: 8, objectFit: "contain" }} />
                                          : <span style={{ fontSize: 20 }}>{icon}</span>}
                                        <div>
                                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{cat?.name ?? "—"}</p>
                                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.product?.amount?.toLocaleString("fr-FR")} FCFA × {item.quantity}</p>
                                        </div>
                                      </div>
                                      {isPaid && item.gift_code?.code ? (
                                        <div style={{ flex: 1, minWidth: 110 }}>
                                          <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Code</p>
                                          <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--cyan)", letterSpacing: "0.04em" }}>{item.gift_code.code}</p>
                                        </div>
                                      ) : !isPaid ? (
                                        <p style={{ flex: 1, fontSize: 12, color: "#f59e0b" }}>🔒 En attente</p>
                                      ) : null}
                                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{fmt(item.total_price)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <button
                onClick={handleToggleBlock}
                disabled={blocking || detail.role === "admin"}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${detail.is_blocked ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"}`, background: detail.is_blocked ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", color: detail.is_blocked ? "#10b981" : "#ef4444", fontSize: 13, fontWeight: 700, cursor: (blocking || detail.role === "admin") ? "not-allowed" : "pointer", opacity: (blocking || detail.role === "admin") ? 0.5 : 1, transition: "all 0.2s" }}
              >
                {blocking ? "..." : detail.is_blocked ? "✓ Débloquer" : "⊘ Bloquer"}
              </button>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type SortKey = "spent" | "recent" | "orders" | "last_order";
type StatusFilter = "all" | "active" | "blocked";

export function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("spent");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const { data } = await res.json();
        setClients(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Computed
  const filtered = clients
    .filter((c) => {
      if (filterStatus === "active" && c.is_blocked) return false;
      if (filterStatus === "blocked" && !c.is_blocked) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.email.toLowerCase().includes(q) ||
          c.nom?.toLowerCase().includes(q) ||
          c.prenoms?.toLowerCase().includes(q) ||
          c.telephone?.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "spent")      return b.total_spent - a.total_spent;
      if (sortBy === "recent")     return b.created_at.localeCompare(a.created_at);
      if (sortBy === "orders")     return b.purchase_count - a.purchase_count;
      if (sortBy === "last_order") {
        if (!a.last_purchase_at) return 1;
        if (!b.last_purchase_at) return -1;
        return b.last_purchase_at.localeCompare(a.last_purchase_at);
      }
      return 0;
    });

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const top5 = [...clients].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5);
  const totalSpent = clients.reduce((s, c) => s + c.total_spent, 0);
  const activeCount = clients.filter((c) => !c.is_blocked).length;
  const now = new Date();
  const newThisMonth = clients.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleUpdate = (id: string, updated: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement des clients...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
          {[
            { label: "Total clients",    value: clients.length,              color: "var(--cyan)" },
            { label: "Actifs",           value: activeCount,                 color: "#10b981" },
            { label: "Bloqués",          value: clients.length - activeCount, color: "#ef4444" },
            { label: "Nouveaux / mois",  value: newThisMonth,               color: "#a78bfa" },
            { label: "CA total",         value: fmt(totalSpent),             color: "var(--cyan)" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 80%, transparent)", padding: "14px 16px" }}>
              <p style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{kpi.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Top 5 */}
        {top5.length > 0 && (
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 70%, transparent)", padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Top 5 clients
            </p>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {top5.map((client, idx) => {
                const color = getAvatarColor(client.id);
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedId(client.id)}
                    style={{ minWidth: 164, borderRadius: 12, border: `1px solid ${color}30`, background: `${color}0a`, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", minWidth: 22 }}>#{idx + 1}</span>
                      <Avatar client={client} size={30} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getDisplayName(client)}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{fmt(client.total_spent)}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{client.purchase_count} commande{client.purchase_count > 1 ? "s" : ""}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ flex: 1, minWidth: 200, borderRadius: 10, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 60%, transparent)", color: "var(--text)", padding: "8px 14px", fontSize: 13, outline: "none" }}
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as StatusFilter); setPage(0); }}
            style={{ borderRadius: 10, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 60%, transparent)", color: "var(--text)", padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="blocked">Bloqués</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{ borderRadius: 10, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 60%, transparent)", color: "var(--text)", padding: "8px 12px", fontSize: 13, outline: "none", cursor: "pointer" }}
          >
            <option value="spent">Trier par dépenses</option>
            <option value="recent">Trier par inscription</option>
            <option value="orders">Trier par commandes</option>
            <option value="last_order">Trier par dernière commande</option>
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Aucun client trouvé</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {paginated.map((client) => {
              const color = getAvatarColor(client.id);
              return (
                <div
                  key={client.id}
                  style={{ borderRadius: 14, border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg2) 70%, transparent)", display: "flex", alignItems: "center", overflow: "hidden", transition: "border-color 0.2s" }}
                >
                  <button
                    onClick={() => setSelectedId(client.id)}
                    style={{ flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", minWidth: 0 }}
                  >
                    <Avatar client={client} size={42} />

                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{getDisplayName(client)}</p>
                        {client.is_blocked && (
                          <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px", background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Bloqué</span>
                        )}
                        {client.role === "admin" && (
                          <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px", background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>Admin</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{client.email}</p>
                      {client.telephone && <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>📞 {client.telephone}</p>}
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dépensé</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: client.total_spent > 0 ? color : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(client.total_spent)}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Commandes</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{client.purchase_count}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Inscrit</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(client.created_at)}</p>
                      </div>
                      {client.last_purchase_at && (
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dernière cmd</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(client.last_purchase_at)}</p>
                        </div>
                      )}
                    </div>
                  </button>
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

      {selectedId && (
        <ClientModal
          clientId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={(updated) => handleUpdate(selectedId, updated)}
        />
      )}
    </>
  );
}
