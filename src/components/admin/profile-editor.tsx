"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        if (res.ok) {
          const { data } = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profil mis à jour avec succès" });
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6" style={{ 
      background: "var(--bg-card)", 
      borderColor: "var(--border)" 
    }}>
      <h3 className="mb-6 text-lg font-bold" style={{ color: "var(--text)" }}>
        Mon Profil
      </h3>

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

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text)" }}>
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="w-full rounded-lg border border-black/20 bg-black/5 p-2 opacity-60"
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
              L&apos;email ne peut pas être modifié
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text)" }}>
              Rôle
            </label>
            <input
              type="text"
              value={profile?.role === "admin" ? "Administrateur" : "Client"}
              disabled
              className="w-full rounded-lg border border-black/20 bg-black/5 p-2 opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text)" }}>
              Membre depuis
            </label>
            <input
              type="text"
              value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR") : ""}
              disabled
              className="w-full rounded-lg border border-black/20 bg-black/5 p-2 opacity-60"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text)" }}>
              Statut du compte
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  profile?.is_blocked
                    ? "bg-red-500/10 text-red-600"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                {profile?.is_blocked ? "Bloqué" : "Actif"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cyan px-4 py-2 font-medium text-black hover:bg-cyan/80 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
