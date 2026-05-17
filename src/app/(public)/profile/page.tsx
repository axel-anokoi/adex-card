"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  role: "client" | "admin";
  nom: string | null;
  prenoms: string | null;
  created_at: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

function Avatar({ nom, prenoms, email, size = 64 }: { nom: string | null; prenoms: string | null; email: string; size?: number }) {
  const initials = [prenoms, nom]
    .filter(Boolean)
    .map((s) => s![0].toUpperCase())
    .join("")
    .slice(0, 2) || email[0].toUpperCase();

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--cyan), var(--violet))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 800, color: "#000",
        flexShrink: 0,
        boxShadow: "0 0 20px var(--cyan-glow)",
      }}
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const router = useRouter();

  const showToast = (message: string, type: Toast["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/user/profile")
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return; }
        const { data } = await res.json();
        if (data) {
          setProfile(data);
          setNom(data.nom ?? "");
          setPrenoms(data.prenoms ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenoms }),
      });
      const json = await res.json();
      if (res.ok) {
        setProfile(json.data);
        setEditing(false);
        showToast("Profil mis à jour", "success");
      } else {
        showToast(json.error || "Erreur lors de la mise à jour", "error");
      }
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNom(profile?.nom ?? "");
    setPrenoms(profile?.prenoms ?? "");
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10" style={{ minHeight: "100vh" }}>
        <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: "var(--bg3)" }} />
        <div className="mt-8 rounded-2xl p-6 animate-pulse"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", height: 220 }} />
      </div>
    );
  }

  if (!profile) return null;

  const memberSince = new Date(profile.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const displayName = [profile.prenoms, profile.nom].filter(Boolean).join(" ") || "—";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10" style={{ minHeight: "100vh" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
          style={{
            background: toast.type === "success" ? "var(--green)" : "#ef4444",
            color: "#000",
            animation: "fadeUp 0.25s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>Mon Profil</h1>

      {/* Profile card */}
      <div
        className="mt-6 rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <Avatar nom={profile.nom} prenoms={profile.prenoms} email={profile.email} size={64} />
          <div className="min-w-0">
            <p className="font-bold text-lg sm:text-xl truncate" style={{ color: "var(--text)" }}>
              {displayName}
            </p>
            <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{profile.email}</p>
            <span
              className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                background: profile.role === "admin" ? "linear-gradient(135deg, var(--cyan), var(--violet))" : "var(--bg2)",
                color: profile.role === "admin" ? "#000" : "var(--text-muted)",
                border: profile.role === "admin" ? "none" : "1px solid var(--border)",
              }}
            >
              {profile.role === "admin" ? "Admin" : "Client"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5" style={{ borderTop: "1px solid var(--border)" }} />

        {/* Info fields */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-faint)" }}>
                Prénoms
              </label>
              <input
                type="text"
                value={prenoms}
                onChange={(e) => setPrenoms(e.target.value)}
                placeholder="Ex : Jean-Baptiste"
                maxLength={100}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border-cyan)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-faint)" }}>
                Nom
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex : Dupont"
                maxLength={60}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border-cyan)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-faint)" }}>
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text-faint)",
                }}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                L&apos;email ne peut pas être modifié ici.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "transparent" }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 min-h-[44px] rounded-xl text-sm font-bold disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--cyan), var(--violet))",
                  color: "#000",
                  boxShadow: "0 0 20px var(--cyan-glow)",
                }}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: "Prénoms", value: profile.prenoms || "—" },
              { label: "Nom", value: profile.nom || "—" },
              { label: "Email", value: profile.email },
              { label: "Membre depuis", value: memberSince },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold uppercase tracking-wide w-32 shrink-0"
                  style={{ color: "var(--text-faint)" }}>
                  {label}
                </span>
                <span className="text-sm font-medium text-right truncate" style={{ color: "var(--text)" }}>
                  {value}
                </span>
              </div>
            ))}

            <div className="pt-2">
              <button
                onClick={() => setEditing(true)}
                className="w-full min-h-[44px] rounded-xl text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--cyan), var(--violet))",
                  color: "#000",
                  boxShadow: "0 0 20px var(--cyan-glow)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Modifier mon profil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl p-4 text-sm font-medium text-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Dashboard
        </Link>
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="rounded-xl p-4 text-sm font-medium text-center"
            style={{
              background: "var(--cyan-dim)",
              border: "1px solid var(--border-cyan)",
              color: "var(--cyan)",
            }}
          >
            Panel Admin
          </Link>
        )}
      </div>
    </div>
  );
}
