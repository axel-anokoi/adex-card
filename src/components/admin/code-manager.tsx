"use client";

import { useEffect, useState, useCallback } from "react";
import { Pagination } from "./pagination";

interface Product {
  id: string;
  category: { name: string };
  amount: number;
}

interface GiftCode {
  id: string;
  product_id: string;
  product: Product;
  code: string;
  status: string;
  buy_price: number;
  sold_to_user_id: string | null;
  sold_at: string | null;
  batch_reference: string | null;
  expires_at: string | null;
  created_at: string;
}

export function CodeManager() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterProduct, setFilterProduct] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

const [formData, setFormData] = useState({
    product_id: "",
    codes: "",
    buy_price: 0,
    batch_reference: "",
    expires_at: "",
  });

const fetchData = useCallback(async () => {
    try {
      const [codesRes, productsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/products"),
      ]);
      if (codesRes.ok) {
        const { data } = await codesRes.json();
        setCodes(data?.flatMap((p: { id: string; category: { name: string }; amount: number }) => []) || []);
      }
      if (productsRes.ok) {
        const { data } = await productsRes.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
}, []);

  // Call fetchData on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCodes = async () => {
    if (!formData.product_id || !formData.codes) {
      setMessage({ type: "error", text: "Veuillez sélectionner un produit et entrer au moins un code" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const codeList = formData.codes.split("\n").map((c) => c.trim()).filter(Boolean);
      const res = await fetch("/api/admin/codes/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
          product_id: formData.product_id,
          codes: codeList.map((code) => ({ code, buy_price: formData.buy_price })),
          batch_reference: formData.batch_reference || undefined,
          expires_at: formData.expires_at || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `${codeList.length} code(s) ajouté(s)` });
        setFormData({ product_id: "", codes: "", buy_price: 0, batch_reference: "", expires_at: "" });
        fetchData();
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'ajout" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Supprimer ce code ?")) return;

    try {
      const res = await fetch(`/api/admin/codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Code supprimé" });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete code:", error);
    }
  };

  useEffect(() => {
    const fetchCodesForProducts = async () => {
      if (!products.length) return;
      try {
        const allCodes: GiftCode[] = [];
        for (const p of products) {
          const res = await fetch(`/api/admin/products/${p.id}/codes`);
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              allCodes.push(...data.map((c: GiftCode) => ({ ...c, product: p })));
            }
          }
        }
        setCodes(allCodes);
      } catch (error) {
        console.error("Failed to fetch codes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCodesForProducts();
  }, [products]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      </div>
    );
  }

const filteredCodes = codes.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterProduct && c.product?.id !== filterProduct) return false;
    return true;
  });
  const paginatedCodes = filteredCodes.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filterStatus || ""}
            onChange={(e) => { setFilterStatus(e.target.value || null); setPage(0); }}
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="sold">Vendu</option>
            <option value="reserved">Réservé</option>
          </select>
          <select
            value={filterProduct || ""}
            onChange={(e) => { setFilterProduct(e.target.value || null); setPage(0); }}
            className="rounded-lg border border-black/20 p-2"
          >
            <option value="">Tous les produits</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.category?.name} {p.amount} FCFA</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black hover:bg-cyan/80"
        >
          + Ajouter des codes
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
          {message.text}
        </div>
      )}

      {showAdd && (
        <div className="mb-6 rounded-xl border border-cyan/30 bg-white p-6">
          <h4 className="mb-4 text-lg font-bold">Ajouter des codes</h4>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Produit</label>
              <select
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full rounded-lg border border-black/20 p-2"
              >
                <option value="">Sélectionner...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.category?.name} {p.amount} FCFA</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Codes (un par ligne)</label>
              <textarea
                value={formData.codes}
                onChange={(e) => setFormData({ ...formData, codes: e.target.value })}
                placeholder="ABCD-1234-EFGH-5678&#10;ABCD-1234-EFGH-5679"
                rows={4}
                className="w-full rounded-lg border border-black/20 p-2 font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Prix d&apos;achat (FCFA)</label>
                <input
                  type="number"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-black/20 p-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">RéférenceBatch</label>
                <input
                  type="text"
                  value={formData.batch_reference}
                  onChange={(e) => setFormData({ ...formData, batch_reference: e.target.value })}
                  placeholder="Optionnel"
                  className="w-full rounded-lg border border-black/20 p-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Expire le</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full rounded-lg border border-black/20 p-2"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-black/20 px-4 py-2">Annuler</button>
            <button onClick={handleAddCodes} disabled={saving} className="rounded-lg bg-cyan px-4 py-2 font-medium text-black hover:bg-cyan/80 disabled:opacity-50">
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {filteredCodes.length === 0 ? (
        <p className="text-center text-black/60">Aucun code</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedCodes.map((code) => (
            <div key={code.id} className={`rounded-lg border p-3 ${code.status === "available" ? "border-black/10 bg-white" : "border-black/5 bg-black/5"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{code.product?.category?.name} {code.product?.amount} FCFA</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  code.status === "available" ? "bg-emerald-100 text-emerald-700" :
                  code.status === "sold" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {code.status}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm">{code.code}</p>
              <div className="mt-2 flex gap-1">
                {code.status === "available" && (
                  <button onClick={() => handleDeleteCode(code.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={filteredCodes.length}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
      />
    </div>
  );
}
