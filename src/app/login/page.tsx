"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Échec de la connexion");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,224,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 420, width: "100%", animation: "liftIn 0.45s cubic-bezier(.2,.7,.2,1) both" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14, animation: "iconFloat 3s ease-in-out infinite" }}>🎮</div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.2rem)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 8 }}>
            Bon retour{" "}
            <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              sur BabiCard
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Connectez-vous pour accéder à vos codes</p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "linear-gradient(145deg, var(--bg2), var(--bg3))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,224,0.06)",
          position: "relative",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ffe0, #7b2fff, transparent)" }} />

          {/* Scanlines */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px)", zIndex: 1 }} />

          <div style={{ padding: "2rem", position: "relative", zIndex: 2 }}>

            {/* Error */}
            {error && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(255,80,80,0.3)", background: "rgba(255,50,50,0.08)", padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 13, color: "rgba(255,120,120,0.9)" }}>{error}</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.04)", color: "var(--text)",
                    padding: "11px 14px", fontSize: 14, outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  className="auth-input"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Mot de passe</label>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none", opacity: 0.8 }}>
                    Oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%", borderRadius: 10, border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.04)", color: "var(--text)",
                    padding: "11px 14px", fontSize: 14, outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  className="auth-input"
                />
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Connexion…
                  </>
                ) : (
                  <>
                    Se connecter
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            {/* Payment info */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(0,255,224,0.15)", background: "rgba(0,255,224,0.04)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>💳</span>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Paiement via <strong style={{ color: "var(--text)" }}>Djamo</strong> ou <strong style={{ color: "var(--text)" }}>Moov Money</strong> — 100% sécurisé
              </p>
            </div>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.2), transparent)" }} />
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "var(--cyan)", fontWeight: 600, textDecoration: "none" }}>
            S&apos;inscrire gratuitement →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes liftIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes iconFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-8px) rotate(3deg); }
          66%      { transform: translateY(-4px) rotate(-3deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus {
          border-color: rgba(0,255,224,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,255,224,0.07);
        }
      `}</style>
    </main>
  );
}