"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
is_active: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const { data } = await res.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = editingId
        ? `/api/admin/categories?id=${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: editingId ? "Catégorie mise à jour" : "Catégorie créée" });
        resetForm();
        fetchCategories();
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

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      logo_url: category.logo_url || "",
      is_active: category.is_active,
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Catégorie supprimée" });
        fetchCategories();
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
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: isActive }),
      });

      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Failed to toggle category:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", logo_url: "", is_active: true });
    setShowCreate(false);
    setEditingId(null);
  };

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
        <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Gestion des catégories
        </h3>
        <button
          onClick={() => { resetForm(); setShowCreate(!showCreate); }}
          className="rounded-lg bg-cyan px-4 py-2 text-sm font-medium text-black hover:bg-cyan/80"
        >
          + Nouvelle catégorie
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-cyan/30 bg-white p-6">
          <h4 className="mb-4 text-lg font-bold">
            {editingId ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingId ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                placeholder="PlayStation"
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="playstation"
                required
                className="w-full rounded-lg border border-black/20 p-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Logo URL</label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
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
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-black/20 px-4 py-2">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan px-4 py-2 font-medium text-black hover:bg-cyan/80 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <p className="text-center text-black/60">Aucune catégorie</p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                category.is_active ? "border-black/10 bg-white" : "border-black/5 bg-black/5"
              }`}
            >
              <div className="flex items-center gap-4">
                {category.logo_url && (
                  <img src={category.logo_url} alt={category.name} className="h-10 w-10 rounded-lg object-cover" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{category.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-black/60">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="rounded-lg border border-black/20 px-3 py-1 text-sm hover:bg-black/5"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleActive(category.id, !category.is_active)}
                  className="rounded-lg border border-black/20 px-3 py-1 text-sm hover:bg-black/5"
                >
                  {category.is_active ? "Désactiver" : "Activer"}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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
