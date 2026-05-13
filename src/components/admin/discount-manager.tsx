"use client";

import { useState } from "react";

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  max_discount_amount: number | null;
  product_id: string | null;
  category_id: string | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface DiscountManagerProps {
  codes: DiscountCode[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const typeLabels = {
  percentage: "Pourcentage",
  fixed_amount: "Montant fixe",
};

export function DiscountManager({ codes, onToggleActive, onDelete }: DiscountManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: 0,
    max_discount_amount: 0,
    min_order_amount: 0,
    max_uses: 0,
    max_uses_per_user: 1,
  });

  const filteredCodes = codes.filter((c) => {
    if (filter === "active") return c.is_active;
    if (filter === "inactive") return !c.is_active;
    return true;
  });

  const formatDiscount = (code: DiscountCode) => {
    if (code.discount_type === "percentage") {
      return `${code.discount_value}%${code.max_discount_amount ? ` (max ${code.max_discount_amount}€)` : ""}`;
    }
    return `${code.discount_value}€`;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-cyan text-black"
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              {f === "all" ? "Tout" : f === "active" ? "Actif" : "Inactif"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black hover:bg-cyan/80"
        >
          + Nouveau code
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-cyan/30 bg-white p-6">
          <h4 className="mb-4 text-lg font-bold">Créer un code promo</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Code</label>
              <input
                type="text"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="EXEMPLE2024"
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={newCode.discount_type}
                onChange={(e) => setNewCode({ ...newCode, discount_type: e.target.value as "percentage" | "fixed_amount" })}
                className="w-full rounded-lg border border-black/20 p-2"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed_amount">Montant fixe (€)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {newCode.discount_type === "percentage" ? "Pourcentage" : "Montant (€)"}
              </label>
              <input
                type="number"
                value={newCode.discount_value}
                onChange={(e) => setNewCode({ ...newCode, discount_value: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Montant max (€)</label>
              <input
                type="number"
                value={newCode.max_discount_amount}
                onChange={(e) => setNewCode({ ...newCode, max_discount_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Optionnel"
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Commande min (€)</label>
              <input
                type="number"
                value={newCode.min_order_amount}
                onChange={(e) => setNewCode({ ...newCode, min_order_amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Utilisation max</label>
              <input
                type="number"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) || 0 })}
                placeholder="Illimité si vide"
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input
              type="text"
              value={newCode.description}
              onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
              placeholder="Description optionnelle"
              className="w-full rounded-lg border border-black/20 p-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-black/20 px-4 py-2"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                // TODO: Implement API call
                alert("API non implémentée");
                setShowCreate(false);
              }}
              className="rounded-lg bg-cyan px-4 py-2 font-medium text-black"
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {filteredCodes.length === 0 ? (
        <p className="text-center text-black/60">Aucun code promo</p>
      ) : (
        <div className="space-y-2">
          {filteredCodes.map((code) => (
            <div
              key={code.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                code.is_active ? "border-black/10 bg-white" : "border-black/5 bg-black/5"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{code.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    code.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {code.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-black/60">
                  {code.description || typeLabels[code.discount_type]} • {formatDiscount(code)}
                </p>
                <p className="mt-1 text-xs text-black/40">
                  {code.uses_count}/{code.max_uses || "∞"} utilisations
                  {code.min_order_amount > 0 && ` • Min ${code.min_order_amount}€`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleActive(code.id, !code.is_active)}
                  className="rounded-lg border border-black/20 px-3 py-1 text-sm hover:bg-black/5"
                >
                  {code.is_active ? "Désactiver" : "Activer"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Supprimer ce code?")) {
                      onDelete(code.id);
                    }
                  }}
                  className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
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
