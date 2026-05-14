"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 3000);
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (error) {
      setError("Une erreur réseau est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 440, width: "100%", borderRadius: 24, border: "1px solid rgba(0,255,136,0.3)", background: "linear-gradient(145deg, rgba(0,18,12,0.95), rgba(0,30,20,0.9))", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,136,0.12)", overflow: "hidden" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ff88, transparent)" }} />
          <div style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "iconFloat 3s ease-in-out infinite" }}>📧</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>Code envoyé !</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>Vérifiez votre boîte mail. Vous allez être redirigé vers la page de vérification…</p>
          </div>
        </div>
        <style>{`@keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
      </main>
    );
  }

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(123,47,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 440, width: "100%", animation: "liftIn 0.45s cubic-bezier(.2,.7,.2,1) both" }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 14, display: "inline-flex" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            Récupération
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.2rem)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 8 }}>
            Mot de passe{" "}
            <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              oublié
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Entrez votre email pour recevoir un code de réinitialisation</p>
        </div>

        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "linear-gradient(145deg, var(--bg2), var(--bg3))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(123,47,255,0.07)",
          position: "relative",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #7b2fff, #00ffe0, transparent)" }} />
          <div style={{ padding: "2rem", position: "relative", zIndex: 2 }}>
            {error && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(255,80,80,0.3)", background: "rgba(255,50,50,0.08)", padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 13, color: "rgba(255,120,120,0.9)" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ position: "relative" }}>
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Envoyer le code OTP
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.2), transparent)" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Besoin d'aide ?{" "}
          <Link href="/login" style={{ color: "var(--cyan)", fontWeight: 600, textDecoration: "none" }}>
            Retour à la connexion →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes liftIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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
    </main>
  );
}
