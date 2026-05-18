// ProductModal.tsx — Design premium, responsive mobile/tablette/desktop
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  eur: number;
  tag: string;
  image: string;
  cat: string;
  stock_available?: number;
}

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product & { quantity: number; total: number }) => void;
}

// ─── Category meta (same as CategoriesSection) ───────────
const CATEGORY_META: Record<string, {
  label: string; icon: string; accent: string;
  accentRgb: string; gradient: string; gradientLight: string;
  particle: string;
}> = {
  playstation: {
    label: "PlayStation", icon: "🎮",
    accent: "#3b82f6", accentRgb: "59,130,246",
    gradient: "linear-gradient(135deg, #000d2e 0%, #002870 50%, #0040a0 100%)",
    gradientLight: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)",
    particle: "◆",
  },
  psn: {
    label: "PlayStation", icon: "🎮",
    accent: "#3b82f6", accentRgb: "59,130,246",
    gradient: "linear-gradient(135deg, #000d2e 0%, #002870 50%, #0040a0 100%)",
    gradientLight: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)",
    particle: "◆",
  },
  xbox: {
    label: "Xbox", icon: "🎯",
    accent: "#22c55e", accentRgb: "34,197,94",
    gradient: "linear-gradient(135deg, #001400 0%, #0a3a0a 50%, #0d5c0d 100%)",
    gradientLight: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
    particle: "●",
  },
  nintendo: {
    label: "Nintendo", icon: "🍄",
    accent: "#ef4444", accentRgb: "239,68,68",
    gradient: "linear-gradient(135deg, #200003 0%, #540008 50%, #800010 100%)",
    gradientLight: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)",
    particle: "▲",
  },
  apple: {
    label: "Apple", icon: "🍎",
    accent: "#a3a3a3", accentRgb: "163,163,163",
    gradient: "linear-gradient(135deg, #111111 0%, #1e1e1e 50%, #2a2a2a 100%)",
    gradientLight: "linear-gradient(135deg, #f8fafc 0%, #f3f4f6 50%, #e5e7eb 100%)",
    particle: "■",
  },
};

const defaultMeta = (slug: string) => ({
  label: slug.charAt(0).toUpperCase() + slug.slice(1),
  icon: "💳",
  accent: "#00ffe0", accentRgb: "0,255,224",
  gradient: "linear-gradient(135deg,#0d0d1a,#111)",
  gradientLight: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
  particle: "◇",
});

const getMeta = (slug: string) => CATEGORY_META[slug] ?? defaultMeta(slug);

function isUrl(str: string) {
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/");
}

function useTheme() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const checkTheme = () => setIsLight(document.documentElement.classList.contains("light"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isLight;
}

const toFCFA = (eur: number) => eur.toLocaleString("fr-FR");


// ─── Main Component ──────────────────────────────────────
export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const isLight = useTheme();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState(product?.eur ?? 0);
  const [phase, setPhase] = useState<"idle" | "loading" | "success">("idle");
  const [imgError, setImgError] = useState(false);

  const meta = getMeta(product?.cat ?? "");
  const total = selectedAmount * quantity;
  const gradient = isLight ? meta.gradientLight : meta.gradient;

  // Reset on product change
  useEffect(() => {
    if (product) {
      setSelectedAmount(product.eur);
      setQuantity(1);
      setPhase("idle");
      setImgError(false);
    }
  }, [product?.id]);

  // Escape key + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAdd = useCallback(async () => {
    if (phase !== "idle" || !product) return;
    setPhase("loading");
    await new Promise((r) => setTimeout(r, 600));
    onAddToCart({ ...product, eur: selectedAmount, quantity, total });
    setPhase("success");
    setTimeout(() => { onClose(); router.push("/cart"); }, 800);
  }, [phase, product, selectedAmount, quantity, total, onAddToCart, onClose, router]);

  if (!product) return null;

  return (
    <>
      {/* ── Overlay ── */}
      <div className="pm-overlay" onClick={onClose} aria-modal="true" role="dialog">
        <div
          className={`pm-shell${phase === "success" ? " pm-shell--success" : ""}`}
          style={{ "--accent": meta.accent, "--accent-rgb": meta.accentRgb } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated border glow */}
          <div className="pm-border-glow" />

          {/* Close */}
          <button className="pm-close" onClick={onClose} aria-label="Fermer">✕</button>

          {/* ── Success screen ── */}
          {phase === "success" && (
            <div className="pm-success">
              <div className="pm-success-ring">
                <span className="pm-success-check">✓</span>
                <div className="pm-success-ring2" />
                <div className="pm-success-ring3" />
              </div>
              <h3 className="pm-success-title">Ajouté au panier !</h3>
              <p className="pm-success-sub">{quantity}× {product.name}</p>
              <p className="pm-success-total">{toFCFA(total)} FCFA</p>
            </div>
          )}

          {/* ── Main content ── */}
          <div className={`pm-body${phase === "success" ? " pm-body--blur" : ""}`}>

            {/* LEFT — Media panel */}
            <div className="pm-media-panel" style={{ background: gradient }}>
              {/* Scanlines overlay (dark only) */}
              {!isLight && <div className="pm-scanlines" />}
              {/* Particle deco */}
              <div className="pm-particle" style={{ color: meta.accent }}>{meta.particle}</div>
              {/* Glow */}
              <div
                className="pm-media-glow"
                style={{ background: `radial-gradient(circle at 50% 45%, rgba(${meta.accentRgb},${isLight ? 0.2 : 0.35}), transparent 65%)` }}
              />
              {/* Image or emoji */}
              <div className="pm-media-frame">
                {isUrl(product.image) && !imgError ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="pm-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="pm-emoji">{isUrl(product.image) ? meta.icon : product.image}</span>
                )}
              </div>
              {/* Bottom divider */}
              <div
                className="pm-media-bottom"
                style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.accentRgb},0.7), transparent)` }}
              />
            </div>

            {/* RIGHT — Info panel */}
            <div className="pm-info">
              {/* Tag */}
              <div
                className="pm-tag"
                style={{
                  color: meta.accent,
                  borderColor: `rgba(${meta.accentRgb},0.3)`,
                  background: `rgba(${meta.accentRgb},0.1)`,
                }}
              >
                {product.tag}
              </div>

              {/* Name */}
              <h2 className="pm-name">{product.name}</h2>

              {/* Divider */}
              <div
                className="pm-divider"
                style={{ background: `linear-gradient(90deg, rgba(${meta.accentRgb},0.6), transparent)` }}
              />

              {/* Description */}
              <p className="pm-desc">
                Carte prépayée officielle. Livraison instantanée par email après validation.
                Code utilisable immédiatement sur votre compte.
              </p>

              {/* Badges */}
              <div className="pm-badges">
                {["⚡ Livraison instant.", "🔒 Paiement sécurisé", "🌍 Valable worldwide"].map((b) => (
                  <span key={b} className="pm-badge">{b}</span>
                ))}
              </div>

            
              {/* Quantity */}
              <div className="pm-field">
                <label className="pm-field-label">Quantité</label>
                <div className="pm-qty">
                  <button
                    className="pm-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    style={{ borderColor: `rgba(${meta.accentRgb},0.25)` }}
                  >−</button>
                    <span className="pm-qty-val" style={{ color: meta.accent }}>{quantity}</span>
                    <button
                    className="pm-qty-btn"
                    onClick={() => {
                      const max = product?.stock_available ?? 10;
                      setQuantity((q) => Math.min(max, q + 1));
                    }}
                    disabled={quantity >= (product?.stock_available ?? 10)}
                    style={{ borderColor: `rgba(${meta.accentRgb},0.25)` }}
                  >+</button>
                </div>
              </div>

              {/* Price block */}
              <div
                className="pm-price-block"
                style={{
                  border: `1px solid rgba(${meta.accentRgb},0.2)`,
                  background: `rgba(${meta.accentRgb},0.05)`,
                }}
              >
                <div className="pm-price-row">
                  <span className="pm-price-lbl">Unitaire</span>
                  <div>
                    <span className="pm-price-eur" style={{ color: meta.accent }}>{selectedAmount} FCFA</span>
                    <span className="pm-price-fcfa">{toFCFA(selectedAmount)} FCFA</span>
                  </div>
                </div>
                {quantity > 1 && (
                  <div className="pm-price-row pm-price-row--total">
                    <span className="pm-price-lbl">Total ({quantity}×)</span>
                    <div>
                      <span className="pm-price-eur pm-price-eur--total" style={{ color: meta.accent }}>
                        {total} FCFA
                      </span>
                      <span className="pm-price-fcfa">{toFCFA(total)} FCFA</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="pm-actions">
                <button
                  className={`pm-cta${phase === "loading" ? " pm-cta--loading" : ""}`}
                  style={{
                    background: phase === "idle"
                      ? `linear-gradient(135deg, rgba(${meta.accentRgb},0.9), rgba(${meta.accentRgb},0.6))`
                      : undefined,
                    boxShadow: phase === "idle" ? `0 4px 24px rgba(${meta.accentRgb},0.35)` : undefined,
                    color: isLight ? "#fff" : "#000",
                  }}
                  onClick={handleAdd}
                  disabled={phase !== "idle" || (typeof product?.stock_available === 'number' && quantity > product.stock_available)}
                >
                  {phase === "loading" ? (
                    <span className="pm-spinner" />
                  ) : (
                    <>
                      <span>+ Ajouter au panier</span>
                      <span
                        className="pm-cta-price"
                        style={{ background: "rgba(0,0,0,0.18)" }}
                      >{total} FCFA</span>
                    </>
                  )}
                </button>
                <button className="pm-secondary" onClick={onClose}>
                  Continuer mes achats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* ── Overlay ── */
        .pm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
          animation: pmFadeIn 0.25s ease both;
        }

        /* ── Shell ── */
        .pm-shell {
          position: relative;
          width: 100%; max-width: 860px;
          max-height: 92dvh;
          background: var(--bg-card, #0f0f1a);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden;
          animation: pmSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
          display: flex; flex-direction: column;
        }
        .pm-shell--success {
          transform: scale(1.01);
          box-shadow: 0 0 60px rgba(var(--accent-rgb),0.25);
        }

        /* Animated border glow */
        .pm-border-glow {
          position: absolute; inset: -1px;
          border-radius: 25px;
          background: linear-gradient(135deg,
            rgba(var(--accent-rgb),0.6) 0%,
            transparent 40%,
            transparent 60%,
            rgba(var(--accent-rgb),0.3) 100%);
          z-index: -1;
          opacity: 0.6;
        }

        /* ── Close ── */
        .pm-close {
          position: absolute; top: 16px; right: 16px;
          z-index: 20;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: var(--text-muted, #888);
          font-size: 14px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .pm-close:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.4);
          color: #ef4444;
          transform: rotate(90deg);
        }

        /* ── Success overlay ── */
        .pm-success {
          position: absolute; inset: 0; z-index: 15;
          background: rgba(0,0,0,0.93);
          backdrop-filter: blur(16px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px;
          animation: pmFadeIn 0.3s ease both;
        }
        .pm-success-ring {
          width: 88px; height: 88px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          animation: pmScaleIn 0.45s cubic-bezier(0.68,-0.55,0.27,1.55) both;
        }
        .pm-success-ring::before {
          content: "";
          position: absolute; inset: 0;
          border-radius: 50%;
          background: rgba(var(--accent-rgb),0.15);
          border: 2px solid rgba(var(--accent-rgb),0.6);
        }
        .pm-success-ring2, .pm-success-ring3 {
          position: absolute; inset: -12px;
          border-radius: 50%;
          border: 1px solid rgba(var(--accent-rgb),0.3);
          animation: pmRingPulse 1.5s ease-out 0.3s both;
        }
        .pm-success-ring3 { inset: -24px; animation-delay: 0.5s; border-color: rgba(var(--accent-rgb),0.15); }
        .pm-success-check {
          font-size: 42px; color: var(--accent); font-weight: 700;
          animation: pmCheckBounce 0.4s ease 0.15s both;
        }
        .pm-success-title {
          font-size: 22px; font-weight: 800;
          color: var(--accent); letter-spacing: -0.5px;
          animation: pmSlideUp 0.4s ease 0.2s both;
        }
        .pm-success-sub {
          font-size: 14px; color: var(--text-muted, #888);
          animation: pmSlideUp 0.4s ease 0.3s both;
        }
        .pm-success-total {
          font-size: 18px; font-weight: 700;
          color: var(--text, #fff);
          animation: pmSlideUp 0.4s ease 0.4s both;
        }

        /* ── Body ── */
        .pm-body {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 0;
          transition: filter 0.3s;
          overflow-y: auto;
        }
        .pm-body--blur { filter: blur(6px); pointer-events: none; }

        /* ── Media panel ── */
        .pm-media-panel {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; padding: 32px 20px;
          min-height: 260px;
        }
        .pm-scanlines {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.025) 0px,
            rgba(255,255,255,0.025) 1px,
            transparent 1px, transparent 3px
          );
          opacity: 0.35;
        }
        .pm-particle {
          position: absolute; bottom: -8px; right: -8px;
          font-size: 100px; line-height: 1;
          opacity: 0.07; pointer-events: none;
          z-index: 1; font-weight: 900;
        }
        .pm-media-glow {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
        }
        .pm-media-frame {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          width: 100%; aspect-ratio: 1;
          max-width: 160px;
        }
        .pm-img {
          width: 85%; max-height: 130px;
          object-fit: contain;
          filter: drop-shadow(0 4px 20px rgba(255,255,255,0.15));
          animation: pmFloat 4s ease-in-out infinite;
        }
        .pm-emoji {
          font-size: 62px;
          animation: pmFloat 4s ease-in-out infinite;
        }
        .pm-media-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px; z-index: 3;
        }

        /* ── Info panel ── */
        .pm-info {
          padding: 28px 28px 24px;
          display: flex; flex-direction: column; gap: 14px;
          overflow-y: auto;
        }
        .pm-tag {
          display: inline-block; width: fit-content;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 999px; border: 1px solid;
        }
        .pm-name {
          font-size: clamp(18px, 2.5vw, 26px); font-weight: 800;
          color: var(--text, #fff); line-height: 1.2;
          letter-spacing: -0.5px; margin: 0;
        }
        .pm-divider {
          height: 1px; border-radius: 999px; opacity: 0.4;
        }
        .pm-desc {
          font-size: 13px; line-height: 1.6;
          color: var(--text-muted, #888); margin: 0;
        }
        .pm-badges {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .pm-badge {
          font-size: 11px; font-weight: 600;
          padding: 4px 10px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--text-muted, #888);
          white-space: nowrap;
        }

        /* ── Fields ── */
        .pm-field { display: flex; flex-direction: column; gap: 8px; }
        .pm-field-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-muted, #888);
        }
        .pm-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .pm-preset {
          padding: 8px 18px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: var(--text-muted, #888);
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .pm-preset:hover:not(.pm-preset--active) {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
        }
        .pm-preset--active { transform: scale(1.04); }

        .pm-qty { display: flex; align-items: center; gap: 12px; }
        .pm-qty-btn {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid; background: rgba(255,255,255,0.05);
          color: var(--text, #fff); font-size: 18px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .pm-qty-btn:hover:not(:disabled) {
          background: rgba(var(--accent-rgb),0.15);
        }
        .pm-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pm-qty-val { font-size: 20px; font-weight: 800; min-width: 32px; text-align: center; }

        /* ── Price block ── */
        .pm-price-block {
          border-radius: 14px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .pm-price-row {
          display: flex; justify-content: space-between; align-items: baseline;
        }
        .pm-price-row--total {
          padding-top: 8px;
          border-top: 1px dashed rgba(255,255,255,0.08);
        }
        .pm-price-lbl { font-size: 12px; color: var(--text-muted, #888); font-weight: 600; }
        .pm-price-eur {
          font-size: 28px; font-weight: 900;
          line-height: 1; letter-spacing: -1.5px; display: block;
        }
        .pm-price-eur--total { font-size: 32px; }
        .pm-price-fcfa { font-size: 11px; color: var(--text-muted, #888); }

        /* ── Actions ── */
        .pm-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 2px; }
        .pm-cta {
          width: 100%; padding: 14px 20px;
          border-radius: 12px; border: none;
          font-size: 14px; font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .pm-cta:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .pm-cta:active:not(:disabled) { transform: translateY(0); }
        .pm-cta--loading { cursor: wait; opacity: 0.75; }
        .pm-cta-price {
          padding: 3px 10px; border-radius: 999px;
          font-size: 12px; font-weight: 700;
        }
        .pm-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(0,0,0,0.25);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: pmSpin 0.6s linear infinite;
          display: inline-block;
        }
        .pm-secondary {
          width: 100%; padding: 11px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: var(--text-muted, #888);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .pm-secondary:hover {
          border-color: rgba(var(--accent-rgb),0.35);
          color: var(--accent);
        }

        /* ── Responsive ── */

        /* Tablet (600–900px): stacked layout */
        @media (max-width: 860px) {
          .pm-body { grid-template-columns: 1fr; }
          .pm-media-panel {
            min-height: 180px; padding: 24px;
            border-radius: 0;
          }
          .pm-media-frame { max-width: 120px; }
          .pm-img { max-height: 100px; }
          .pm-emoji { font-size: 50px; }
          .pm-info { padding: 20px 20px 20px; }
        }

        /* Mobile (< 540px): compact */
        @media (max-width: 540px) {
          .pm-shell { border-radius: 20px; max-height: 96dvh; }
          .pm-media-panel { min-height: 140px; padding: 16px; }
          .pm-media-frame { max-width: 90px; }
          .pm-img { max-height: 80px; }
          .pm-emoji { font-size: 42px; }
          .pm-info { padding: 16px; gap: 12px; }
          .pm-name { font-size: 18px; }
          .pm-price-eur { font-size: 24px; }
          .pm-price-eur--total { font-size: 28px; }
          .pm-preset { padding: 7px 14px; font-size: 13px; }
          .pm-cta { padding: 13px 16px; font-size: 13px; }
          .pm-badges { display: none; }
          .pm-desc { display: none; }
        }

        /* ── Animations ── */
        @keyframes pmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pmSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pmScaleIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes pmCheckBounce {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes pmSlideUp {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes pmRingPulse {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes pmFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pmSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}