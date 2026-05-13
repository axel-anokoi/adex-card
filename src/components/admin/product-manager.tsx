"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  category: Category;
  amount: number;
  sell_price: number;
  buy_price: number;
  stock_available: number;
  is_active: boolean;
  created_at: string;
}

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    amount: 10,
    sell_price: 0,
    buy_price: 0,
    stock_available: 0,
is_active: true,
});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      if (productsRes.ok) {
        const { data } = await productsRes.json();
        setProducts(data || []);
      }
      if (categoriesRes.ok) {
        const { data } = await categoriesRes.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editingId ? "Produit mis à jour" : "Produit créé" });
        resetForm();
        fetchData();
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      category_id: product.category?.id || "",
      amount: product.amount,
      sell_price: product.sell_price,
      buy_price: product.buy_price,
      stock_available: product.stock_available,
      is_active: product.is_active,
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });

      if (res.ok) {
        setMessage({ type: "success", text: "Produit supprimé" });
        fetchData();
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la suppression" });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: isActive }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to toggle product:", error);
    }
  };

  const resetForm = () => {
    setFormData({ category_id: "", amount: 10, sell_price: 0, buy_price: 0, stock_available: 0, is_active: true });
    setShowCreate(false);
    setEditingId(null);
  };

  const filteredProducts = filterCategory
    ? products.filter((p) => p.category?.slug === filterCategory)
    : products;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterCategory(null)}
            className={`rounded-lg px-3 py-1 text-sm font-medium whitespace-nowrap ${
              filterCategory === null
                ? "bg-cyan text-black"
                : "border border-black/20 text-black/60 hover:bg-black/5"
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.slug)}
              className={`rounded-lg px-3 py-1 text-sm font-medium whitespace-nowrap ${
                filterCategory === cat.slug
                  ? "bg-cyan text-black"
                  : "border border-black/20 text-black/60 hover:bg-black/5"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(!showCreate); }}
          className="rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black hover:bg-cyan/80"
        >
          + Nouveau produit
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
          {message.text}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-cyan/30 bg-white p-6">
          <h4 className="mb-4 text-lg font-bold">{editingId ? "Modifier le produit" : "Nouveau produit"}</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full rounded-lg border border-black/20 p-2"
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Montant (€)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Prix de vente (€)</label>
              <input
                type="number"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })}
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Prix d'achat (€)</label>
              <input
                type="number"
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Stock</label>
              <input
                type="number"
                value={formData.stock_available}
                onChange={(e) => setFormData({ ...formData, stock_available: parseInt(e.target.value) || 0 })}
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Statut</label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full rounded-lg border border-black/20 p-2"
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-black/20 px-4 py-2">Annuler</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-cyan px-4 py-2 font-medium text-black hover:bg-cyan/80 disabled:opacity-50">
              {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      )}

      {filteredProducts.length === 0 ? (
        <p className="text-center text-black/60">Aucun produit</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className={`rounded-xl border p-4 ${product.is_active ? "border-black/10 bg-white" : "border-black/5 bg-black/5"}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">{product.category?.name || "Produit"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {product.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">{product.amount}€</p>
              <p className="text-sm text-black/60">Vente: {product.sell_price}€ / Achat: {product.buy_price}€</p>
              <p className="mt-1 text-sm">Stock: {product.stock_available}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleEdit(product)} className="rounded-lg border border-black/20 px-2 py-1 text-xs hover:bg-black/5">Modifier</button>
                <button onClick={() => handleToggleActive(product.id, !product.is_active)} className="rounded-lg border border-black/20 px-2 py-1 text-xs hover:bg-black/5">
                  {product.is_active ? "Désactiver" : "Activer"}
                </button>
                <button onClick={() => handleDelete(product.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
