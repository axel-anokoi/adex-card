"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Step = "loading" | "set-password" | "success" | "error" | "resent";

export default function ActivatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data: { user } } = await supabase!.auth.getUser();

      if (!user) {
        setStep("error");
        return;
      }

      const displayName =
        user.user_metadata?.prenoms ||
        user.email?.split("@")[0] ||
        "vous";
      setUserName(displayName);
      setStep("set-password");
    }

    checkSession();
  }, []);

  const handleResendActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    if (!resendEmail) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (res.ok) {
        setStep("resent");
      } else {
        const data = await res.json();
        setResendError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setResendError("Une erreur inattendue est survenue.");
    } finally {
      setResendLoading(false);
    }
  };

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ["", "Faible", "Moyen", "Fort", "Très fort"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#00ff88", "#00ffe0"][strength];

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase!.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      // Mark account as fully activated (Fix 3: use implicit_checkout flag)
      await supabase!.auth.updateUser({ data: { implicit_checkout: false } });
      setStep("success");
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(0,255,224,0.2)", borderTopColor: "var(--cyan)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Vérification du lien…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (step === "resent") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
            Email envoyé !
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 24 }}>
            Si un compte Adex Card existe pour cette adresse, vous recevrez un nouveau lien d&apos;activation dans quelques instants.
          </p>
          <Link href="/" style={{ color: "var(--cyan)", fontSize: 13, textDecoration: "none" }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  if (step === "error") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
              Lien expiré ou invalide
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>
              Le lien d&apos;activation a expiré. Renseignez votre email pour en recevoir un nouveau.
            </p>
          </div>

          <form onSubmit={handleResendActivation} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              style={{
                width: "100%", borderRadius: 10, border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.04)", color: "var(--text)",
                padding: "11px 14px", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
              className="auth-input"
            />
            {resendError && (
              <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{resendError}</p>
            )}
            <button
              type="submit"
              disabled={resendLoading || !resendEmail}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", opacity: (resendLoading || !resendEmail) ? 0.6 : 1 }}
            >
              {resendLoading ? "Envoi…" : "Renvoyer le lien d'activation"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
            <Link href="/login" style={{ color: "var(--cyan)", textDecoration: "none" }}>
              Déjà un compte ? Se connecter
            </Link>
          </p>
        </div>
        <style>{`.auth-input::placeholder { color: rgba(255,255,255,0.2); } .auth-input:focus { border-color: rgba(0,255,224,0.4) !important; box-shadow: 0 0 0 3px rgba(0,255,224,0.07); }`}</style>
      </main>
    );
  }

  if (step === "success") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: 440, width: "100%", animation: "liftIn 0.4s ease both" }}>
          <div style={{
            borderRadius: 24,
            border: "1px solid rgba(0,255,136,0.35)",
            background: "linear-gradient(145deg, rgba(0,18,12,0.95), rgba(0,30,20,0.9))",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,136,0.12)",
            overflow: "hidden",
          }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #00ff88, transparent)" }} />
            <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(0,255,136,0.1)", border: "2px solid #00ff88",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, margin: "0 auto 20px",
                animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}>
                ✅
              </div>

              <div className="badge badge-cyan animate-badge" style={{ marginBottom: 16, display: "inline-flex" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", display: "inline-block" }} />
                Compte activé
              </div>

              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", marginBottom: 10, fontFamily: "var(--font-display)" }}>
                Bienvenue,{" "}
                <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {userName} !
                </span>
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 28 }}>
                Votre mot de passe a été défini avec succès. Votre compte est maintenant actif — vous pouvez accéder à votre tableau de bord et retrouver l&apos;historique de vos commandes.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Accéder à mon tableau de bord
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <Link href="/shop" className="btn-outline" style={{ textAlign: "center", display: "block" }}>
                  Continuer mes achats
                </Link>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes liftIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes popIn { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
        `}</style>
      </main>
    );
  }

  /* ── set-password step ── */
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,224,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 440, width: "100%", animation: "liftIn 0.45s cubic-bezier(.2,.7,.2,1) both" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 14, display: "inline-flex" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            Activation du compte
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 8 }}>
            Bonjour {userName},{" "}
            <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              définissez votre mot de passe
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Votre compte Adex Card est prêt. Choisissez un mot de passe pour sécuriser votre accès.
          </p>
        </div>

        {/* Card */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid var(--border)",
          background: "linear-gradient(145deg, var(--bg2), var(--bg3))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,224,0.05)",
          position: "relative",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ffe0, #7b2fff, transparent)" }} />
          <div style={{ padding: "2rem", position: "relative", zIndex: 2 }}>
            {error && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(255,80,80,0.3)", background: "rgba(255,50,50,0.08)", padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <p style={{ fontSize: 13, color: "rgba(255,120,120,0.9)", margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Password field */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  Mot de passe *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    required
                    style={{
                      width: "100%", borderRadius: 10, border: "1px solid var(--border)",
                      background: "rgba(255,255,255,0.04)", color: "var(--text)",
                      padding: "11px 44px 11px 14px", fontSize: 14, outline: "none",
                      boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)", padding: 0 }}
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Strength meter */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= strength ? strengthColor : "rgba(255,255,255,0.1)",
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                  </div>
                )}
              </div>

              {/* Confirm field */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  Confirmer *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  style={{
                    width: "100%", borderRadius: 10, border: confirm.length > 0
                      ? (confirm === password ? "1px solid rgba(0,255,136,0.4)" : "1px solid rgba(239,68,68,0.4)")
                      : "1px solid var(--border)",
                    background: "rgba(255,255,255,0.04)", color: "var(--text)",
                    padding: "11px 14px", fontSize: 14, outline: "none",
                    boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  className="auth-input"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Les mots de passe ne correspondent pas</p>
                )}
                {confirm.length > 0 && confirm === password && (
                  <p style={{ fontSize: 11, color: "#00ff88", marginTop: 4 }}>✓ Les mots de passe correspondent</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 8 || password !== confirm}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 4, opacity: (loading || password.length < 8 || password !== confirm) ? 0.6 : 1 }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Activation…
                  </>
                ) : (
                  <>
                    Activer mon compte
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,224,0.2), transparent)" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 20, lineHeight: 1.6 }}>
          Vous pouvez supprimer votre compte depuis votre profil.{" "}
          <Link href="/login" style={{ color: "var(--cyan)", textDecoration: "none" }}>
            Déjà un compte ?
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes liftIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.5); opacity:0.6; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus { border-color: rgba(0,255,224,0.4) !important; box-shadow: 0 0 0 3px rgba(0,255,224,0.07); }
      `}</style>
    </main>
  );
}
