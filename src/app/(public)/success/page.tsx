"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PurchaseCode {
  code: string;
  product_name: string;
  unit_price: number;
}

type PollStatus = "polling" | "paid" | "failed" | "timeout" | "no_id";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS  = 45_000;

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const pid = searchParams.get("pid");

  const [pollStatus, setPollStatus]   = useState<PollStatus>(pid ? "polling" : "no_id");
  const [codes, setCodes]             = useState<PurchaseCode[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [copiedCode, setCopiedCode]   = useState<string | null>(null);
  const [visible, setVisible]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!pid) return;

    let stopped = false;
    const start = Date.now();

    const poll = async () => {
      if (stopped) return;

      if (Date.now() - start > POLL_TIMEOUT_MS) {
        setPollStatus("timeout");
        return;
      }

      try {
        const res  = await fetch(`/api/purchases/${pid}`);
        const data = await res.json();

        if (data.status === "paid") {
          setCodes(data.codes ?? []);
          setTotalAmount(data.total_amount ?? 0);
          setPollStatus("paid");
          return;
        }

        if (data.status === "failed") {
          setPollStatus("failed");
          return;
        }
      } catch {
        // network hiccup — keep polling
      }

      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      stopped = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pid]);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  // ── Success state ────────────────────────────────────────────────────────────
  if (pollStatus === "paid") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,136,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 540, width: "100%", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
          <div style={{ borderRadius: 24, border: "1px solid rgba(0,255,224,0.35)", background: "var(--bg2)", boxShadow: "0 0 0 1px rgba(0,255,224,0.08), 0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(0,255,224,0.12)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #00ffe0, #7b2fff, transparent)" }} />

            <div style={{ padding: "2rem 1.75rem" }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,255,224,0.08)", border: "2px solid var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px", animation: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  ✅
                </div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", marginBottom: 6, fontFamily: "var(--font-display)" }}>
                  Paiement{" "}
                  <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    réussi !
                  </span>
                </h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Vos codes sont prêts. Copiez-les et utilisez-les immédiatement.
                </p>
              </div>

              {/* Codes */}
              {codes.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    🎁 Vos codes cadeaux
                  </p>
                  {codes.map((item, i) => (
                    <div key={i} style={{ borderRadius: 14, border: "1px solid rgba(0,255,224,0.18)", background: "rgba(0,255,224,0.04)", padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", background: "rgba(0,255,224,0.1)", border: "1px solid rgba(0,255,224,0.2)", padding: "2px 8px", borderRadius: 99 }}>
                          {item.product_name}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {item.unit_price.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <code style={{ flex: 1, fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: "#00ffe0", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 8, padding: "8px 12px", fontFamily: "monospace", wordBreak: "break-all", display: "block" }}>
                          {item.code}
                        </code>
                        <button
                          onClick={() => copy(item.code)}
                          style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, border: copiedCode === item.code ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(0,255,224,0.3)", background: copiedCode === item.code ? "rgba(0,255,136,0.1)" : "rgba(0,255,224,0.07)", color: copiedCode === item.code ? "#00ff88" : "var(--cyan)", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                          aria-label="Copier"
                        >
                          {copiedCode === item.code ? "✓" : "⎘"}
                        </button>
                      </div>
                      {copiedCode === item.code && (
                        <p style={{ fontSize: 11, color: "#00ff88", marginTop: 6, fontWeight: 600 }}>✓ Copié dans le presse-papier</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Email notice */}
              <div style={{ borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 14px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                  📧 Ces codes ont également été envoyés à votre adresse email.
                </p>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/dashboard" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  Mon dashboard
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/shop" className="btn-outline">
                  Continuer les achats
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      </main>
    );
  }

  // ── Failure (webhook confirmed failed) ───────────────────────────────────────
  if (pollStatus === "failed") {
    return <FailureCard reason="declined" pid={pid} />;
  }

  // ── Timeout (webhook never arrived in time) ──────────────────────────────────
  if (pollStatus === "timeout") {
    return <FailureCard reason="timeout" pid={pid} />;
  }

  // ── No purchase id in URL ────────────────────────────────────────────────────
  if (pollStatus === "no_id") {
    return (
      <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 20 }}>Commande introuvable.</p>
          <Link href="/shop" className="btn-primary" style={{ justifyContent: "center" }}>Retour à la boutique</Link>
        </div>
      </main>
    );
  }

  // ── Polling / waiting for webhook ────────────────────────────────────────────
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,224,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 420, width: "100%", textAlign: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--cyan)", borderTopColor: "transparent", animation: "spin 0.9s linear infinite", margin: "0 auto 24px" }} />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: 10, fontFamily: "var(--font-display)" }}>
          Confirmation en cours…
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
          Votre paiement est en cours de validation. Vos codes apparaîtront ici dans quelques secondes.
        </p>
        <div style={{ borderRadius: 12, border: "1px solid rgba(0,255,224,0.15)", background: "rgba(0,255,224,0.04)", padding: "12px 16px" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            📧 Un email de confirmation sera envoyé à votre adresse.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

// ── Page export ─────────────────────────────────────────────────────────────

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessPageContent />
    </Suspense>
  );
}

// ── Shared failure card ──────────────────────────────────────────────────────

function FailureCard({ reason, pid }: { reason: "declined" | "timeout"; pid: string | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 480, width: "100%", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
        <div style={{ borderRadius: 24, border: "1px solid rgba(239,68,68,0.3)", background: "var(--bg2)", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239,68,68,0.08)", overflow: "hidden" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }} />

          <div style={{ padding: "2rem 1.75rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>
              ❌
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>
              {reason === "timeout" ? "Confirmation en attente" : "Paiement non abouti"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
              {reason === "timeout"
                ? "La confirmation tarde à arriver. Vos codes vous seront envoyés par email une fois le paiement validé par GeniusPay."
                : "Votre paiement n'a pas pu être traité. Aucun montant n'a été débité. Vous pouvez réessayer."}
            </p>

            {pid && (
              <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 20, fontFamily: "monospace" }}>
                Réf : {pid.slice(0, 8).toUpperCase()}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/checkout" className="btn-primary" style={{ justifyContent: "center" }}>
                Réessayer le paiement
              </Link>
              <Link href="/shop" className="btn-outline">
                Retour à la boutique
              </Link>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 20 }}>
          Un problème ?{" "}
          <a href="https://wa.me/" style={{ color: "#00ffe0", textDecoration: "none", fontWeight: 600 }}>
            Contactez le support →
          </a>
        </p>
      </div>
    </main>
  );
}
