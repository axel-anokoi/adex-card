"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [visible, setVisible] = useState(false);
  const [codeRevealed, setCodeRevealed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setCodeRevealed(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div className="bg-grid-overlay" style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,136,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        maxWidth: 560, width: "100%",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        {/* Main card */}
        <div style={{
          borderRadius: 24,
          border: "1px solid rgba(0,255,136,0.3)",
          background: "linear-gradient(145deg, rgba(0,18,12,0.95), rgba(0,30,20,0.9))",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,136,0.12)",
          overflow: "hidden",
          position: "relative",
        }}>
          {/* Scanlines */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 2px, transparent 4px)",
            zIndex: 1,
          }} />

          {/* Top accent line */}
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ff88, transparent)" }} />

          <div style={{ padding: "2.5rem", position: "relative", zIndex: 2 }}>

            {/* Icon */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "rgba(0,255,136,0.12)",
              border: "1px solid rgba(0,255,136,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, marginBottom: 24,
              animation: "iconFloat 3s ease-in-out infinite",
              boxShadow: "0 0 30px rgba(0,255,136,0.2)",
            }}>✅</div>

            {/* Badge */}
            <div className="badge badge-cyan animate-badge" style={{ marginBottom: 16 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              Commande confirmée
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800,
              color: "var(--text)", lineHeight: 1.15, marginBottom: 12,
              fontFamily: "var(--font-display)", letterSpacing: "-0.5px",
            }}>
              Paiement{" "}
              <span style={{ background: "linear-gradient(135deg,#00ff88,#00ffe0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                confirmé
              </span>
            </h1>

            <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Merci pour votre achat. Vos codes seront disponibles dans votre dashboard client d&apos;ici quelques instants.
            </p>

            {/* Info boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              <div style={{ borderRadius: 12, border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.06)", padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: "rgba(0,255,136,0.7)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>Livraison</p>
                <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>⚡ &lt; 2 minutes</p>
              </div>
              <div style={{ borderRadius: 12, border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.06)", padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: "rgba(0,255,136,0.7)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>Codes</p>
                <p style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>📧 Par email</p>
              </div>
            </div>

            {/* Code reveal area */}
            <div style={{
              borderRadius: 14, border: "1px solid rgba(0,255,224,0.2)",
              background: "rgba(0,255,224,0.04)", padding: "18px 20px",
              marginBottom: 28,
              opacity: codeRevealed ? 1 : 0.3,
              transition: "opacity 0.6s ease",
            }}>
              <p style={{ fontSize: 11, color: "rgba(0,255,224,0.6)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Dashboard client</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Vos codes de téléchargement sont disponibles dans votre espace personnel. Connectez-vous pour y accéder.
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn-primary" style={{ flex: 1 }}>
                Accéder au dashboard
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link href="/shop" className="btn-outline">
                Continuer les achats
              </Link>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.3), transparent)" }} />
        </div>

        {/* Support note */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Un problème ?{" "}
          <a href="https://wa.me/" style={{ color: "#00ffe0", textDecoration: "none", fontWeight: 600 }}>
            Contactez le support WhatsApp →
          </a>
        </p>
      </div>

      <style>{`
        @keyframes iconFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </main>
  );
}