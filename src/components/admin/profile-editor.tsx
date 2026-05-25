"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  nom: string | null;
  prenoms: string | null;
  telephone: string | null;
  is_blocked: boolean;
  created_at: string;
}

export function ProfileEditor() {
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [nom, setNom]           = useState("");
  const [prenoms, setPrenoms]   = useState("");
  const [telephone, setTel]     = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile");
        if (res.ok) {
          const { data } = await res.json();
          setProfile(data);
          setNom(data.nom ?? "");
          setPrenoms(data.prenoms ?? "");
          setTel(data.telephone ?? "");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim() || null, prenoms: prenoms.trim() || null, telephone: telephone.trim() || null }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profil mis à jour avec succès ✓" });
        setProfile((prev) => prev ? { ...prev, nom, prenoms, telephone } : prev);
      } else {
        const { error } = await res.json();
        setMessage({ type: "error", text: error || "Erreur lors de la mise à jour" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

  const initials = [prenoms?.[0], nom?.[0]].filter(Boolean).join("").toUpperCase() || profile?.email?.[0]?.toUpperCase() || "A";
  const displayName = [prenoms, nom].filter(Boolean).join(" ") || profile?.email?.split("@")[0] || "Admin";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Avatar card */}
      <div style={{
        borderRadius: 16, border: "1px solid var(--border)",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--cyan) 8%, var(--bg2)), color-mix(in srgb, var(--violet) 6%, var(--bg2)))",
        padding: "28px 24px", display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--cyan), var(--violet))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, color: "#000",
          boxShadow: "0 0 24px var(--cyan-glow)",
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{displayName}</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{profile?.email}</p>
          <span style={{
            display: "inline-block", marginTop: 8,
            fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
            background: "linear-gradient(135deg, var(--cyan), var(--violet))",
            color: "#000", borderRadius: 6, padding: "2px 10px", textTransform: "uppercase",
          }}>
            Administrateur
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div style={{
        borderRadius: 16, border: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--bg2) 80%, transparent)",
        padding: "24px",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>
          Modifier mes informations
        </h3>

        {message && (
          <div style={{
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13,
            background: message.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            color: message.type === "success" ? "#10b981" : "#ef4444",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Read-only fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={profile?.email ?? ""} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
            </div>
            <div>
              <label style={labelStyle}>Rôle</label>
              <input value="Administrateur" disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
            </div>
          </div>

          {/* Editable fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Prénom(s)</label>
              <input
                type="text"
                value={prenoms}
                onChange={(e) => setPrenoms(e.target.value)}
                placeholder="Ex: Jean-Paul"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: KOUASSI"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTel(e.target.value)}
              placeholder="Ex: +225 07 00 00 00 00"
              style={inputStyle}
            />
          </div>

          {/* Metadata */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Membre depuis</label>
              <input
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
                disabled
                style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Statut du compte</label>
              <div style={{ display: "flex", alignItems: "center", height: 40 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "4px 12px",
                  background: profile?.is_blocked ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                  color: profile?.is_blocked ? "#ef4444" : "#10b981",
                }}>
                  {profile?.is_blocked ? "Bloqué" : "Actif"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700,
                background: saving ? "var(--cyan-dim)" : "linear-gradient(135deg, var(--cyan), #00c8b0)",
                color: "#000", border: "none", cursor: saving ? "not-allowed" : "pointer",
                transition: "opacity 0.2s", opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div style={{
        borderRadius: 16, border: "1px solid rgba(239,68,68,0.2)",
        background: "rgba(239,68,68,0.03)", padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Déconnexion</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Terminer la session administrateur</p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700,
            background: "rgba(239,68,68,0.1)", color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer",
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", textTransform: "uppercase",
  letterSpacing: "0.08em", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: 10, border: "1px solid var(--border)",
  background: "color-mix(in srgb, var(--bg) 60%, transparent)",
  color: "var(--text)", padding: "9px 12px", fontSize: 13,
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
};
