"use client";

import { useEffect, useState, useCallback } from "react";

interface ReservationTimerModalProps {
  expiresAt: string;         // ISO timestamp
  purchaseId: string;
  totalMinutes?: number;     // durée totale configurée (défaut : 32)
  redirectUrl?: string;      // URL to navigate to on proceed
  productNames?: string[];   // items being reserved
  onProceed: () => void;
  onExpired: () => void;
}

const WARNING_THRESHOLD = 5 * 60; // 5 minutes
const AUTO_REDIRECT_DELAY = 5; // seconds before auto-redirect

export function ReservationTimerModal({
  expiresAt,
  purchaseId,
  totalMinutes = 32,
  redirectUrl,
  productNames = [],
  onProceed,
  onExpired,
}: ReservationTimerModalProps) {
  const getSecondsLeft = useCallback(() => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  }, [expiresAt]);

  const [secondsLeft, setSecondsLeft] = useState<number>(getSecondsLeft);
  const [autoCountdown, setAutoCountdown] = useState(AUTO_REDIRECT_DELAY);
  const [proceeded, setProceeded] = useState(false);

  const isExpired = secondsLeft <= 0;
  const isWarning = secondsLeft > 0 && secondsLeft <= WARNING_THRESHOLD;

  // Main countdown — synced to wall clock to avoid drift
  useEffect(() => {
    if (proceeded) return;
    const tick = () => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s === 0) onExpired();
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [getSecondsLeft, onExpired, proceeded]);

  // Auto-redirect countdown (only on active + with redirect URL)
  useEffect(() => {
    if (isExpired || !redirectUrl || proceeded) return;
    if (autoCountdown <= 0) {
      setProceeded(true);
      onProceed();
      return;
    }
    const t = setTimeout(() => setAutoCountdown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [autoCountdown, isExpired, redirectUrl, onProceed, proceeded]);

  const handleProceed = () => {
    setProceeded(true);
    onProceed();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerText = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG ring progress
  const RADIUS = 44;
  const circumference = 2 * Math.PI * RADIUS;
  const progress = isExpired ? 0 : secondsLeft / (totalMinutes * 60);
  const dashOffset = circumference * (1 - progress);

  const accentColor = isExpired ? "#ef4444" : isWarning ? "#f59e0b" : "#00ffe0";
  const glowColor = isExpired
    ? "rgba(239,68,68,0.18)"
    : isWarning
    ? "rgba(245,158,11,0.18)"
    : "rgba(0,255,224,0.14)";
  const borderColor = isExpired
    ? "rgba(239,68,68,0.4)"
    : isWarning
    ? "rgba(245,158,11,0.4)"
    : "rgba(0,255,224,0.35)";
  const topGradient = isExpired
    ? "linear-gradient(90deg, transparent, #ef4444, transparent)"
    : isWarning
    ? "linear-gradient(90deg, transparent, #f59e0b, transparent)"
    : "linear-gradient(90deg, transparent, #00ffe0, #7b2fff, transparent)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        backgroundColor: "rgba(0,0,0,0.78)",
        animation: "rtm-fadeIn 0.2s ease",
      }}
    >
      <div
        className="glass rtm-card"
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          border: `1px solid ${borderColor}`,
          boxShadow: `0 0 0 1px ${glowColor}, 0 40px 100px rgba(0,0,0,0.7), 0 0 60px ${glowColor}`,
          overflow: "hidden",
          animation: "rtm-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Top accent border */}
        <div style={{ height: 3, flexShrink: 0, background: topGradient }} />

        <div style={{ padding: "2rem 1.75rem 1.75rem" }} className="rtm-inner">
          {/* SVG ring timer */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                style={{ transform: "rotate(-90deg)", display: "block" }}
              >
                {/* Background track */}
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="7"
                />
                {/* Progress arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: "stroke-dashoffset 0.9s linear, stroke 0.5s ease",
                    filter: `drop-shadow(0 0 6px ${accentColor}88)`,
                  }}
                />
              </svg>

              {/* Timer text centered */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)",
                    color: accentColor,
                    letterSpacing: "-1px",
                    lineHeight: 1,
                    transition: "color 0.5s ease",
                  }}
                >
                  {timerText}
                </span>
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isExpired ? "EXPIRÉ" : "RESTANT"}
                </span>
              </div>
            </div>
          </div>

          {/* Title + description */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {isExpired ? (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)",
                    fontSize: 11,
                    color: "#ef4444",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                  Réservation expirée
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--text)",
                    marginBottom: 8,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Codes libérés
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
                  Le délai de 32 minutes est dépassé. Vos codes ont été remis en stock.
                  Relancez votre commande pour en réserver de nouveaux.
                </p>
              </>
            ) : isWarning ? (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid rgba(245,158,11,0.3)",
                    background: "rgba(245,158,11,0.08)",
                    fontSize: 11,
                    color: "#f59e0b",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#f59e0b",
                      flexShrink: 0,
                      animation: "rtm-dot-pulse 1s ease-in-out infinite",
                    }}
                  />
                  Bientôt expiré
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--text)",
                    marginBottom: 8,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  Dépêchez-vous !
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
                  Votre réservation expire dans moins de 5 minutes.
                  Finalisez votre paiement avant que les codes soient libérés.
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "1px solid rgba(0,255,224,0.25)",
                    background: "rgba(0,255,224,0.07)",
                    fontSize: 11,
                    color: "var(--cyan)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--cyan)",
                      flexShrink: 0,
                      animation: "rtm-dot-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  Réservé pour vous
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "var(--text)",
                    marginBottom: 8,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {productNames.length === 1 ? "Votre code est réservé" : "Vos codes sont réservés"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {productNames.length === 1 ? "Ce code vous est" : "Ces codes vous sont"} exclusivement
                  réservé{productNames.length > 1 ? "s" : ""} pendant{" "}
                  <strong style={{ color: "var(--cyan)" }}>{totalMinutes} minutes</strong>.
                  Finalisez votre paiement avant l&apos;expiration.
                </p>
              </>
            )}
          </div>

          {/* Product tags */}
          {productNames.length > 0 && !isExpired && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              {productNames.slice(0, 4).map((name, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    background: isWarning ? "rgba(245,158,11,0.08)" : "rgba(0,255,224,0.07)",
                    border: `1px solid ${isWarning ? "rgba(245,158,11,0.25)" : "rgba(0,255,224,0.2)"}`,
                    color: isWarning ? "#f59e0b" : "var(--cyan)",
                    padding: "3px 10px",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                    maxWidth: 160,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </span>
              ))}
              {productNames.length > 4 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    padding: "3px 10px",
                    borderRadius: 99,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  +{productNames.length - 4}
                </span>
              )}
            </div>
          )}

          {/* CTA */}
          {isExpired ? (
            <button
              onClick={() => (window.location.href = "/checkout")}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 12,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              }}
            >
              Recommencer la commande
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handleProceed}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", gap: 10 }}
              >
                Procéder au paiement
                {redirectUrl && !proceeded && autoCountdown > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(0,0,0,0.25)",
                      padding: "2px 7px",
                      borderRadius: 99,
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {autoCountdown}s
                  </span>
                )}
              </button>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                Vous serez redirigé automatiquement vers la page de paiement
              </p>
            </div>
          )}

          {/* Ref */}
          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              marginTop: 14,
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
          >
            Réf : {purchaseId.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes rtm-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rtm-pop {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes rtm-dot-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.6); opacity: 0.5; }
        }

        /* Tablet */
        @media (max-width: 640px) {
          .rtm-card {
            border-radius: 20px !important;
          }
          .rtm-inner {
            padding: 1.5rem 1.25rem 1.5rem !important;
          }
        }

        /* Mobile */
        @media (max-width: 400px) {
          .rtm-card {
            border-radius: 16px !important;
          }
          .rtm-inner {
            padding: 1.25rem 1rem 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
