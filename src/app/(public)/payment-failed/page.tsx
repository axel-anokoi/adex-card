"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const pid    = searchParams.get("pid");
  const reason = searchParams.get("reason");
  const isExpired = reason === "reservation_expired";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const accentRgb   = isExpired ? "245,158,11" : "239,68,68";
  const accentHex   = isExpired ? "#f59e0b"    : "#ef4444";
  const topGradient = isExpired
    ? "linear-gradient(90deg, transparent, #f59e0b, transparent)"
    : "linear-gradient(90deg, transparent, #ef4444, transparent)";
  const glowBg = isExpired
    ? "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)"
    : "radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)";

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 300, borderRadius: "50%", background: glowBg, pointerEvents: "none" }} />

      <div style={{ maxWidth: 480, width: "100%", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
        <div style={{ borderRadius: 24, border: `1px solid rgba(${accentRgb},0.3)`, background: "var(--bg2)", boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(${accentRgb},0.08)`, overflow: "hidden" }}>
          <div style={{ height: 3, background: topGradient }} />

          <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            {/* Icon */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `rgba(${accentRgb},0.08)`, border: `2px solid rgba(${accentRgb},0.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 24px", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              {isExpired ? "⏱️" : "❌"}
            </div>

            {/* Badge */}
            <div className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "4px 12px", borderRadius: 99, border: `1px solid rgba(${accentRgb},0.3)`, background: `rgba(${accentRgb},0.08)`, fontSize: 12, color: accentHex, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentHex }} />
              {isExpired ? "Réservation expirée" : "Paiement échoué"}
            </div>

            <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, color: "var(--text)", marginBottom: 10, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
              {isExpired ? "Délai dépassé" : "Paiement non abouti"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 28 }}>
              {isExpired
                ? "Votre réservation de 32 minutes a expiré avant la finalisation du paiement. Aucun montant n'a été débité — vos codes ont été remis en stock."
                : "Votre paiement n'a pas pu être traité. Aucun montant n'a été débité. Vous pouvez réessayer ou choisir un autre moyen de paiement."}
            </p>

            {/* Info boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              <div style={{ borderRadius: 12, border: `1px solid rgba(${accentRgb},0.15)`, background: `rgba(${accentRgb},0.05)`, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: `rgba(${accentRgb},0.7)`, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>Débit</p>
                <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Aucun montant prélevé</p>
              </div>
              <div style={{ borderRadius: 12, border: `1px solid rgba(${accentRgb},0.15)`, background: `rgba(${accentRgb},0.05)`, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: `rgba(${accentRgb},0.7)`, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>Codes</p>
                <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                  {isExpired ? "Remis en stock" : "Aucun code attribué"}
                </p>
              </div>
            </div>

            {/* Expiry explanation box */}
            {isExpired && (
              <div style={{ borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.06)", padding: "14px 16px", marginBottom: 24, textAlign: "left" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                  <strong style={{ color: "#f59e0b" }}>Pourquoi ?</strong> Chaque réservation est valable 32 minutes. Passé ce délai, les codes sont automatiquement remis en vente pour d&apos;autres acheteurs.
                </p>
              </div>
            )}

            {pid && (
              <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 20, fontFamily: "monospace" }}>
                Réf : {pid.slice(0, 8).toUpperCase()}
              </p>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {isExpired ? (
                <Link href="/shop" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  Retourner à la boutique
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ) : (
                <Link href="/checkout" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  Réessayer le paiement
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0115 0m0 0v-3m0 3h-3" />
                  </svg>
                </Link>
              )}
              <Link href="/shop" className="btn-outline">
                {isExpired ? "Nouvelle commande" : "Retour boutique"}
              </Link>
            </div>
          </div>
        </div>

        {/* Support */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Un problème répété ?{" "}
          <a href="https://wa.me/" style={{ color: "#00ffe0", textDecoration: "none", fontWeight: 600 }}>
            Contactez le support WhatsApp →
          </a>
        </p>
      </div>

      <style>{`
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </main>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <PaymentFailedContent />
    </Suspense>
  );
}
