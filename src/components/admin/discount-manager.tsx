"use client";

import { useState } from "react";
import { DiscountCode } from "@/types/discounts";

interface DiscountManagerProps {
  codes: DiscountCode[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const typeLabels = {
  percentage:   "Pourcentage",
  fixed_amount: "Montant fixe",
};

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 8,
  border: "1px solid var(--border)",
  background: "color-mix(in srgb, var(--bg) 60%, transparent)",
  color: "var(--text)", padding: "9px 12px", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-muted)", marginBottom: 6,
};

export function DiscountManager({ codes, onToggleActive, onDelete }: DiscountManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter]         = useState<"all" | "active" | "inactive">("all");
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newCode, setNewCode]       = useState({
    code: "", description: "",
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: 0, max_discount_amount: 0,
    min_order_amount: 0, max_uses: 0, max_uses_per_user: 1,
  });

  const filteredCodes = codes.filter((c) => {
    if (filter === "active")   return c.is_active;
    if (filter === "inactive") return !c.is_active;
    return true;
  });

  const formatDiscount = (code: DiscountCode) => {
    if (code.discount_type === "percentage") {
      return `${code.discount_value}%${code.max_discount_amount ? ` (max ${code.max_discount_amount} FCFA)` : ""}`;
    }
    return `${code.discount_value} FCFA`;
  };

  const handleCreate = async () => {
    if (!newCode.code || newCode.discount_value <= 0) {
      setMessage({ type: "error", text: "Veuillez remplir le code et la valeur" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCode),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Code promo créé avec succès" });
        setNewCode({ code: "", description: "", discount_type: "percentage", discount_value: 0, max_discount_amount: 0, min_order_amount: 0, max_uses: 0, max_uses_per_user: 1 });
        setShowCreate(false);
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur lors de la création" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  };

  const filterOpts: { key: "all" | "active" | "inactive"; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "active", label: "Actif" },
    { key: "inactive", label: "Inactif" },
  ];

  return (
    <div>
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {filterOpts.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                background: filter === key ? "var(--cyan)" : "color-mix(in srgb, var(--text) 6%, transparent)",
                color: filter === key ? "#000" : "var(--text-muted)",
                border: `1px solid ${filter === key ? "var(--border-cyan)" : "var(--border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
          style={{ background: "var(--cyan)", color: "#000", border: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          + Nouveau code
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{
            background: message.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            color: message.type === "success" ? "#10b981" : "#ef4444",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div
          className="mb-6 rounded-xl p-6"
          style={{
            border: "1px solid var(--border-cyan)",
            background: "var(--bg-card)",
          }}
        >
          <h4 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
            Créer un code promo
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Code", key: "code", type: "text", placeholder: "EXEMPLE2024" },
              { label: newCode.discount_type === "percentage" ? "Pourcentage (%)" : "Montant (FCFA)", key: "discount_value", type: "number" },
              { label: "Montant max (FCFA)", key: "max_discount_amount", type: "number", placeholder: "Optionnel" },
              { label: "Commande min (FCFA)", key: "min_order_amount", type: "number" },
              { label: "Utilisation max", key: "max_uses", type: "number", placeholder: "Illimité si 0" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  value={(newCode as Record<string, string | number>)[key]}
                  placeholder={placeholder}
                  onChange={(e) => setNewCode({
                    ...newCode,
                    [key]: type === "text" ? e.target.value.toUpperCase() : (parseFloat(e.target.value) || 0),
                  })}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={newCode.discount_type}
                onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as "percentage" | "fixed_amount" })}
                style={inputStyle}
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed_amount">Montant fixe (FCFA)</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={newCode.description}
              onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
              placeholder="Description optionnelle"
              style={inputStyle}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)" }}
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "var(--cyan)", color: "#000", border: "none" }}
            >
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Code list */}
      {filteredCodes.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Aucun code promo
        </p>
      ) : (
        <div className="space-y-2">
          {filteredCodes.map((code) => (
            <div
              key={code.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: code.is_active
                  ? "var(--bg-card)"
                  : "color-mix(in srgb, var(--text) 3%, transparent)",
                padding: "14px 16px",
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold" style={{ color: "var(--text)" }}>
                    {code.code}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: code.is_active ? "rgba(16,185,129,0.15)" : "color-mix(in srgb, var(--text) 8%, transparent)",
                      color: code.is_active ? "#10b981" : "var(--text-muted)",
                    }}
                  >
                    {code.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {code.description || typeLabels[code.discount_type]} • {formatDiscount(code)}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>
                  {code.uses_count}/{code.max_uses || "∞"} utilisations
                  {code.min_order_amount > 0 && ` • Min ${code.min_order_amount} FCFA`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleActive(code.id, !code.is_active)}
                  className="rounded-lg px-3 py-1.5 text-sm transition-all"
                  style={{
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-cyan)";
                    e.currentTarget.style.color = "var(--cyan)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {code.is_active ? "Désactiver" : "Activer"}
                </button>
                <button
                  onClick={() => { if (confirm("Supprimer ce code ?")) onDelete(code.id); }}
                  className="rounded-lg px-3 py-1.5 text-sm transition-all"
                  style={{
                    border: "1px solid rgba(239,68,68,0.25)",
                    background: "rgba(239,68,68,0.06)",
                    color: "#ef4444",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
