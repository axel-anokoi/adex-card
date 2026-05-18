"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Le mot de passe doit contenir au moins une majuscule");
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins un chiffre");
      setLoading(false);
      return;
    }

    // Email validation - accepted providers
    const validEmailProviders = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"];
    if (!validEmailProviders.some(provider => email.toLowerCase().endsWith(provider))) {
      setError("Utilisez Gmail, Yahoo, Outlook ou Hotmail");
      setLoading(false);
      return;
    }

    // Phone validation
    const phoneDigits = telephone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      setError("Le numéro doit contenir entre 8 et 15 chiffres");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password, nom, prenoms, telephone }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Échec de l'inscription");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 440, width: "100%", borderRadius: 24, border: "1px solid rgba(0,255,136,0.3)", background: "linear-gradient(145deg, rgba(0,18,12,0.95), rgba(0,30,20,0.9))", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,136,0.12)", overflow: "hidden" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ff88, transparent)" }} />
          <div style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "iconFloat 3s ease-in-out infinite" }}>✅</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>Inscription réussie !</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>Vérifiez votre email pour confirmer votre compte. Redirection en cours…</p>
          </div>
        </div>
        <style>{`@keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
      </main>
    );
  }

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(123,47,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 440, width: "100%", animation: "liftIn 0.45s cubic-bezier(.2,.7,.2,1) both" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 14, display: "inline-flex" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            Nouveau compte
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.2rem)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 8 }}>
            Créer un{" "}
            <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              compte
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Rejoignez AdexCard et achetez vos cartes gaming</p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "linear-gradient(145deg, var(--bg2), var(--bg3))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(123,47,255,0.07)",
          position: "relative",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #7b2fff, #00ffe0, transparent)" }} />

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

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }} className="reg-fields-grid">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Nom</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Votre nom"
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
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Prénoms</label>
                  <input
                    type="text"
                    value={prenoms}
                    onChange={(e) => setPrenoms(e.target.value)}
                    placeholder="Vos prénoms"
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
              </div>

<div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Téléphone</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+229 XX XX XX XX"
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
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
                    Création…
                  </>
                ) : (
                  <>
                    Créer le compte
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.2), transparent)" }} />
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Déjà inscrit ?{" "}
          <Link href="/login" style={{ color: "var(--cyan)", fontWeight: 600, textDecoration: "none" }}>
            Se connecter →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes liftIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
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
      <style>{`
        @media (min-width: 640px) {
          .reg-fields-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}