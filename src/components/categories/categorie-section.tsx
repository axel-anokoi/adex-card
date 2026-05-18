"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { ProductModal } from "@/components/products/ProductModal"; // ← adjust import path

// ─────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  eur: number;
  amount: number;
  cat: string;
  tag: string;
  image: string;
  stock_available: number;
  is_active: boolean;
}

interface ApiResponse {
  data: Product[];
  grouped: Record<string, Product[]>;
  categories: string[];
}

// ─────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────

const toFCFA = (eur: number) => eur.toLocaleString("fr-FR");

const CATEGORY_META: Record<string, {
  label: string; icon: string; desc: string;
  accent: string; accentRgb: string; accentRgbDim: string;
  gradient: string; gradientHero: string;
  gradientLight: string; gradientHeroLight: string;
  particle: string;
}> = {
  playstation: {
    label: "PlayStation", icon: "🎮", desc: "PSN · PS Plus · PS Stars",
    accent: "#3b82f6", accentRgb: "59,130,246", accentRgbDim: "rgba(59,130,246,0.1)",
    gradient: "linear-gradient(135deg, #000d2e 0%, #002870 50%, #0040a0 100%)",
    gradientHero: "radial-gradient(ellipse at 60% 40%, rgba(0,112,204,0.5) 0%, transparent 65%)",
    gradientLight: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)",
    gradientHeroLight: "radial-gradient(ellipse at 60% 40%, rgba(8,145,178,0.2) 0%, transparent 65%)",
    particle: "◆",
  },
  xbox: {
    label: "Xbox", icon: "🎯", desc: "Xbox Live · Game Pass",
    accent: "#22c55e", accentRgb: "34,197,94", accentRgbDim: "rgba(34,197,94,0.1)",
    gradient: "linear-gradient(135deg, #001400 0%, #0a3a0a 50%, #0d5c0d 100%)",
    gradientHero: "radial-gradient(ellipse at 60% 40%, rgba(82,176,67,0.5) 0%, transparent 65%)",
    gradientLight: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
    gradientHeroLight: "radial-gradient(ellipse at 60% 40%, rgba(5,150,105,0.2) 0%, transparent 65%)",
    particle: "●",
  },
  nintendo: {
    label: "Nintendo", icon: "🍄", desc: "eShop · Nintendo Switch Online",
    accent: "#ef4444", accentRgb: "239,68,68", accentRgbDim: "rgba(239,68,68,0.1)",
    gradient: "linear-gradient(135deg, #200003 0%, #540008 50%, #800010 100%)",
    gradientHero: "radial-gradient(ellipse at 60% 40%, rgba(228,0,15,0.5) 0%, transparent 65%)",
    gradientLight: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)",
    gradientHeroLight: "radial-gradient(ellipse at 60% 40%, rgba(219,39,119,0.2) 0%, transparent 65%)",
    particle: "▲",
  },
  apple: {
    label: "Apple", icon: "🍎", desc: "iTunes · App Store",
    accent: "#a3a3a3", accentRgb: "163,163,163", accentRgbDim: "rgba(163,163,163,0.1)",
    gradient: "linear-gradient(135deg, #111111 0%, #1e1e1e 50%, #2a2a2a 100%)",
    gradientHero: "radial-gradient(ellipse at 60% 40%, rgba(180,180,180,0.35) 0%, transparent 65%)",
    gradientLight: "linear-gradient(135deg, #f8fafc 0%, #f3f4f6 50%, #e5e7eb 100%)",
    gradientHeroLight: "radial-gradient(ellipse at 60% 40%, rgba(100,116,139,0.15) 0%, transparent 65%)",
    particle: "■",
  },
};

const defaultMeta = (slug: string) => ({
  label: slug.charAt(0).toUpperCase() + slug.slice(1),
  icon: "💳", desc: "",
  accent: "#00ffe0", accentRgb: "0,255,224", accentRgbDim: "rgba(0,255,224,0.1)",
  gradient: "linear-gradient(135deg,#0d0d1a,#111)",
  gradientHero: "radial-gradient(ellipse at 60% 40%, rgba(0,255,224,0.3) 0%, transparent 65%)",
  gradientLight: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
  gradientHeroLight: "radial-gradient(ellipse at 60% 40%, rgba(8,145,178,0.15) 0%, transparent 65%)",
  particle: "◇",
});

const getMeta = (slug: string) => CATEGORY_META[slug] ?? defaultMeta(slug);

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

function isUrl(str: string) {
  return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("/");
}

// ─────────────────────────────────────────
//  SKELETON
// ─────────────────────────────────────────

function SkeletonCard({ large = false }: { large?: boolean }) {
  return (
    <div className={`skel-wrap${large ? " skel-wrap--lg" : ""}`}>
      {large ? (
        <>
          <div className="skel skel-img-lg" />
          <div className="skel-body">
            <div className="skel skel-tag" />
            <div className="skel skel-title" />
            <div className="skel skel-price-lg" />
            <div className="skel skel-btn" />
          </div>
        </>
      ) : (
        <>
          <div className="skel skel-img" />
          <div className="skel skel-tag" />
          <div className="skel skel-title" />
          <div className="skel skel-price" />
          <div className="skel skel-btn" />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  HERO PRODUCT CARD
// ─────────────────────────────────────────

function HeroProductCard({
  product, index, onOpenModal,
}: { product: Product; index: number; onOpenModal: (p: Product) => void }) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meta = getMeta(product.cat);
  const isLight = useTheme();
  const { addToCart } = useCart();

  const gradient = isLight ? meta.gradientLight : meta.gradient;
  const gradientHero = isLight ? meta.gradientHeroLight : meta.gradientHero;
  const mediaBg = isLight
    ? `radial-gradient(circle at 40% 40%, rgba(${meta.accentRgb},0.15), rgba(255,255,255,0.8))`
    : `radial-gradient(circle at 40% 40%, rgba(${meta.accentRgb},0.25), rgba(0,0,0,0.5))`;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.stock_available) return;
    const result = await addToCart(product);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div
      className="hero-prod-card"
      style={{ background: gradient, animationDelay: `${index * 0.07}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenModal(product)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenModal(product)}
    >
      <div className="hero-prod-glow" style={{ background: gradientHero, opacity: hovered ? 1 : 0.6 }} />
      {!isLight && <div className="hero-prod-scanlines" />}
      <div className="hero-prod-particle" style={{ color: meta.accent, opacity: hovered ? 0.12 : 0.06 }}>
        {meta.particle}
      </div>

      <div className="hero-prod-inner">
        <div
          className="hero-prod-media"
          style={{
            background: mediaBg,
            boxShadow: hovered ? `0 0 40px rgba(${meta.accentRgb},${isLight ? 0.15 : 0.3})` : "none",
          }}
        >
          {isUrl(product.image) ? (
            <img
              src={product.image}
              alt={product.name}
              className="hero-prod-logo"
              style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.setAttribute("style", "display:flex");
              }}
            />
          ) : null}
          <span
            className="hero-prod-emoji"
            style={{
              display: isUrl(product.image) ? "none" : "flex",
              transform: hovered ? "scale(1.12) rotate(5deg)" : "scale(1) rotate(0deg)",
            }}
          >
            {isUrl(product.image) ? meta.icon : product.image}
          </span>
        </div>

        <div className="hero-prod-details">
          <div
            className="hero-prod-tag"
            style={{
              color: meta.accent,
              borderColor: `rgba(${meta.accentRgb},${isLight ? 0.25 : 0.35})`,
              background: meta.accentRgbDim,
            }}
          >
            {product.tag}
          </div>

          <h3 className="hero-prod-name">{product.name}</h3>

          <div
            className="hero-prod-divider"
            style={{ background: `linear-gradient(90deg, rgba(${meta.accentRgb},0.6), transparent)` }}
          />

          <div className="hero-prod-prices">
            <div className="hero-prod-eur">
              {product.eur}<span className="hero-prod-eur-sym"> FCFA</span>
            </div>
            <div className="hero-prod-fcfa-block">
              <span className="hero-prod-fcfa-value">{toFCFA(product.eur)}</span>
              <span className="hero-prod-fcfa-label">FCFA</span>
            </div>
          </div>

          {!product.stock_available && (
            <div className="hero-prod-stock-out">● Rupture de stock</div>
          )}

          <div className="hero-prod-btn-row">
            <button
              className={`hero-prod-btn${added ? " hero-prod-btn--ok" : ""}${!product.stock_available ? " hero-prod-btn--off" : ""}`}
              style={added ? {} : product.stock_available ? {
                borderColor: `rgba(${meta.accentRgb},${isLight ? 0.35 : 0.5})`,
                background: meta.accentRgbDim,
                color: meta.accent,
                boxShadow: hovered ? `0 0 20px rgba(${meta.accentRgb},${isLight ? 0.15 : 0.25})` : "none",
              } : {}}
              onClick={handleAdd}
              disabled={!product.stock_available}
            >
              {added ? "✓ Ajouté !" : product.stock_available ? "+ Panier" : "Indisponible"}
            </button>
            <button
              className="hero-prod-detail-btn"
              style={{ borderColor: `rgba(${meta.accentRgb},0.25)`, color: meta.accent }}
              onClick={(e) => { e.stopPropagation(); onOpenModal(product); }}
            >
              Détails →
            </button>
          </div>
        </div>
      </div>

      <div
        className="hero-prod-bottom"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.accentRgb},0.7), transparent)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────
//  COMPACT CARD
// ─────────────────────────────────────────

function CompactCard({
  product, index, onOpenModal,
}: { product: Product; index: number; onOpenModal: (p: Product) => void }) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const meta = getMeta(product.cat);
  const isLight = useTheme();
  const { addToCart } = useCart();

  const gradient = isLight ? meta.gradientLight : meta.gradient;
  const gradientHero = isLight ? meta.gradientHeroLight : meta.gradientHero;
  const mediaBg = isLight
    ? `radial-gradient(circle at 35% 35%, rgba(${meta.accentRgb},0.12), rgba(255,255,255,0.9))`
    : `radial-gradient(circle at 35% 35%, rgba(${meta.accentRgb},0.2), rgba(0,0,0,0.4))`;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.stock_available) return;
    const result = await addToCart(product);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  return (
    <div
      className="compact-card"
      style={{
        background: gradient,
        animationDelay: `${index * 0.05}s`,
        boxShadow: hovered ? `0 8px 32px rgba(${meta.accentRgb},${isLight ? 0.1 : 0.2})` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenModal(product)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenModal(product)}
    >
      <div className="compact-glow" style={{ background: gradientHero, opacity: hovered ? 0.7 : 0.3 }} />

      <div className="compact-media" style={{ background: mediaBg }}>
        {isUrl(product.image) ? (
          <img
            src={product.image} alt={product.name} className="compact-logo"
            style={{ transform: hovered ? "scale(1.1)" : "scale(1)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.setAttribute("style", "display:flex");
            }}
          />
        ) : null}
        <span
          className="compact-emoji"
          style={{
            display: isUrl(product.image) ? "none" : "flex",
            transform: hovered ? "scale(1.12) rotate(4deg)" : "scale(1)",
          }}
        >
          {isUrl(product.image) ? meta.icon : product.image}
        </span>
      </div>

      <div
        className="compact-tag"
        style={{ color: meta.accent, borderColor: `rgba(${meta.accentRgb},0.3)`, background: `rgba(${meta.accentRgb},0.1)` }}
      >
        {product.tag}
      </div>

      <p className="compact-name">{product.name}</p>

      <div className="compact-price-row">
        <span className="compact-eur" style={{ color: meta.accent }}>{product.eur} FCFA</span>
        <span className="compact-fcfa">{toFCFA(product.eur)} FCFA</span>
      </div>

      <button
        className={`compact-btn${added ? " compact-btn--ok" : ""}${!product.stock_available ? " compact-btn--off" : ""}`}
        style={added ? {} : product.stock_available ? {
          borderColor: `rgba(${meta.accentRgb},0.45)`,
          background: `rgba(${meta.accentRgb},0.08)`,
          color: meta.accent,
        } : {}}
        onClick={handleAdd}
        disabled={!product.stock_available}
      >
        {added ? "✓ Ajouté !" : product.stock_available ? "+ Panier" : "Indisponible"}
      </button>

      <div
        className="compact-line"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.accentRgb},0.6), transparent)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────
//  CATEGORY PILL
// ─────────────────────────────────────────

function CategoryPill({ slug, label, icon, logoUrl, count, active, onClick }: {
  slug: string; label: string; icon: string; logoUrl?: string;
  count: number; active: boolean; onClick: () => void;
}) {
  const meta = getMeta(slug);
  return (
    <button
      onClick={onClick}
      className={`cat-pill${active ? " cat-pill--active" : ""}`}
      style={active ? {
        borderColor: meta.accent,
        background: `rgba(${meta.accentRgb},0.15)`,
        color: meta.accent,
        boxShadow: `0 0 18px rgba(${meta.accentRgb},0.25), inset 0 1px 0 rgba(255,255,255,0.08)`,
      } : {}}
    >
      {logoUrl && isUrl(logoUrl) ? (
        <img src={logoUrl} alt={label} className="cat-pill-logo" />
      ) : (
        <span className="cat-pill-icon">{icon}</span>
      )}
      <span className="cat-pill-label">{label}</span>
      <span className="cat-pill-count">{count}</span>
    </button>
  );
}

// ─────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────

export default function CategoriesSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Product[]>>({});
  const [categoryLogos, setCategoryLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"hero" | "grid">("hero");

  // Modal state
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      try {
        setLoading(true); setError(null);
        const res = await fetch("/api/products", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse = await res.json();
        setProducts(json.data);
        setGrouped(json.grouped);
        const logos: Record<string, string> = {};
        for (const [cat, items] of Object.entries(json.grouped)) {
          const first = items.find((p) => isUrl(p.image));
          if (first) logos[cat] = first.image;
        }
        setCategoryLogos(logos);
      } catch (err: any) {
        if (err.name !== "AbortError") setError("Impossible de charger les produits.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
    return () => controller.abort();
  }, []);

  const toggle = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => setSelected(new Set()), []);
  const visibleProducts = selected.size === 0 ? products : products.filter((p) => selected.has(p.cat));
  const categories = Object.keys(grouped);

  const handleModalAdd = useCallback(async (p: any) => {
    await addToCart(p);
    setModalProduct(null);
  }, [addToCart]);

  return (
    <section className="cats-section">

      {/* ── Header ── */}
      <div className="cats-header">
        <div>
          <p className="section-label">Catalogue</p>
          <h2 className="cats-title">Tous les produits</h2>
        </div>
        <div className="cats-header-right">
          <div className="view-toggle">
            <button
              className={`view-btn${viewMode === "hero" ? " view-btn--active" : ""}`}
              onClick={() => setViewMode("hero")} title="Vue grande"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="0" y="0" width="7" height="7" rx="1.5" fill="currentColor"/>
                <rect x="9" y="0" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="9" y="4" width="7" height="3" rx="1.5" fill="currentColor" opacity="0.5"/>
                <rect x="0" y="9" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
                <rect x="0" y="13" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
              </svg>
            </button>
            <button
              className={`view-btn${viewMode === "grid" ? " view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")} title="Vue grille"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="0" y="0" width="7" height="7" rx="1.5" fill="currentColor"/>
                <rect x="9" y="0" width="7" height="7" rx="1.5" fill="currentColor"/>
                <rect x="0" y="9" width="7" height="7" rx="1.5" fill="currentColor"/>
                <rect x="9" y="9" width="7" height="7" rx="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <Link href="/shop" className="see-all-link">Voir tout →</Link>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="cat-pills-row">
        <button
          onClick={clearFilters}
          className={`cat-pill cat-pill--all${selected.size === 0 ? " cat-pill--all-active" : ""}`}
        >
          <span className="cat-pill-icon">✦</span>
          <span className="cat-pill-label">Tous</span>
          <span className="cat-pill-count">{products.length}</span>
        </button>
        {categories.map((slug) => {
          const meta = getMeta(slug);
          return (
            <CategoryPill
              key={slug} slug={slug} label={meta.label} icon={meta.icon}
              logoUrl={categoryLogos[slug]}
              count={grouped[slug]?.length ?? 0}
              active={selected.has(slug)} onClick={() => toggle(slug)}
            />
          );
        })}
      </div>

      {/* ── Results bar ── */}
      <div className="results-bar">
        <span className="results-count">
          {loading ? "Chargement…" : `${visibleProducts.length} produit${visibleProducts.length > 1 ? "s" : ""}`}
        </span>
        {selected.size > 0 && (
          <button onClick={clearFilters} className="clear-btn">Tout effacer ✕</button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => window.location.reload()} className="retry-btn">Réessayer</button>
        </div>
      )}

      {/* ── Hero mode ── */}
      {viewMode === "hero" && (
        <div className="hero-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} large />)
            : visibleProducts.map((p, i) => (
              <HeroProductCard key={p.id} product={p} index={i} onOpenModal={setModalProduct} />
            ))}
        </div>
      )}

      {/* ── Grid mode ── */}
      {viewMode === "grid" && (
        <div className="compact-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : visibleProducts.map((p, i) => (
              <CompactCard key={p.id} product={p} index={i} onOpenModal={setModalProduct} />
            ))}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && visibleProducts.length === 0 && (
        <div className="empty-state">
          <p style={{ fontSize: 40, marginBottom: 10 }}>🎮</p>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Aucun produit pour cette sélection.</p>
        </div>
      )}

      {/* ── Modal ── */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToCart={handleModalAdd}
        />
      )}

      {/* ══ STYLES ══ */}
      <style>{`
        .cats-section {
          max-width: 1180px; margin: 0 auto;
          padding: 3rem 1.25rem 5rem;
        }

        /* Header */
        .cats-header {
          display: flex; justify-content: space-between;
          align-items: flex-end; margin-bottom: 1.5rem;
          flex-wrap: wrap; gap: 12px;
        }
        .cats-title {
          font-size: clamp(22px, 4vw, 32px); font-weight: 800;
          color: var(--text); letter-spacing: -0.5px;
          margin: 4px 0 0; font-family: var(--font-display, inherit);
        }
        .cats-header-right { display: flex; align-items: center; gap: 12px; }
        .see-all-link {
          color: var(--cyan); font-size: 14px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
        }

        /* View toggle */
        .view-toggle {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border); border-radius: 8px; padding: 3px;
        }
        .view-btn {
          padding: 5px 7px; border-radius: 5px; border: none;
          background: transparent; color: var(--text-muted);
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center;
        }
        .view-btn--active { background: rgba(255,255,255,0.1); color: var(--cyan); }

        /* Pills */
        .cat-pills-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .cat-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 999px;
          border: 1px solid var(--border); background: rgba(255,255,255,0.04);
          color: var(--text-muted); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .cat-pill--all.cat-pill--all-active {
          border-color: rgba(123,47,255,0.55) !important;
          background: rgba(123,47,255,0.15) !important;
          color: #c4a0ff !important;
          box-shadow: 0 0 18px rgba(123,47,255,0.2) !important;
        }
        .cat-pill-logo { width: 20px; height: 20px; object-fit: contain; border-radius: 4px; flex-shrink: 0; }
        .cat-pill-icon { font-size: 15px; }
        .cat-pill-label { font-size: 13px; }
        .cat-pill-count {
          font-size: 11px; opacity: 0.55;
          background: rgba(255,255,255,0.08);
          border-radius: 999px; padding: 1px 7px; font-weight: 500;
        }

        /* Results bar */
        .results-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .results-count { font-size: 13px; color: var(--text-muted); }
        .clear-btn { font-size: 13px; color: var(--cyan); background: none; border: none; cursor: pointer; padding: 0; }

        /* Error */
        .error-banner {
          border-radius: 12px; border: 1px solid rgba(228,0,15,0.3);
          background: rgba(228,0,15,0.07); color: rgba(255,130,130,0.9);
          padding: 14px 18px; font-size: 13px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 12px;
        }
        .retry-btn {
          background: none; border: 1px solid rgba(255,130,130,0.35);
          border-radius: 7px; color: rgba(255,130,130,0.9);
          padding: 4px 12px; font-size: 12px; cursor: pointer;
        }
        .empty-state { text-align: center; padding: 64px 0; }

        /* ── Hero grid ── */
        .hero-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .hero-grid { grid-template-columns: repeat(2, 1fr); } }

        .hero-prod-card {
          border-radius: 20px; border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden; position: relative; cursor: pointer;
          animation: heroFadeIn 0.3s ease both;
          transition: transform 0.25s, border-color 0.25s; min-height: 200px;
        }
        .hero-prod-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.13); }
        .hero-prod-glow { position: absolute; inset: 0; pointer-events: none; transition: opacity 0.3s; z-index: 0; }
        .hero-prod-scanlines {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px);
          opacity: 0.4;
        }
        .hero-prod-particle {
          position: absolute; right: -10px; bottom: -10px;
          font-size: 120px; line-height: 1; pointer-events: none;
          z-index: 1; transition: opacity 0.3s; font-weight: 900;
        }
        .hero-prod-inner { position: relative; z-index: 2; display: flex; height: 100%; }
        .hero-prod-media {
          width: 180px; min-width: 180px;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 20px; transition: box-shadow 0.3s;
        }
        @media (max-width: 480px) { .hero-prod-media { width: 120px; min-width: 120px; padding: 16px 12px; } }
        .hero-prod-logo { width: 85%; max-height: 90px; object-fit: contain; filter: drop-shadow(0 4px 16px rgba(255,255,255,0.12)); transition: transform 0.3s; }
        .hero-prod-emoji { font-size: 54px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; }
        .hero-prod-details {
          flex: 1; padding: 22px 22px 22px 18px;
          display: flex; flex-direction: column; justify-content: center;
          border-left: 1px solid rgba(255,255,255,0.06);
        }
        .hero-prod-tag {
          display: inline-block; font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 999px; border: 1px solid;
          margin-bottom: 10px; width: fit-content;
        }
        .hero-prod-name {
          font-size: clamp(15px, 2vw, 18px); font-weight: 800;
          color: var(--text); line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.3px;
        }
        .hero-prod-divider { height: 1px; border-radius: 999px; margin-bottom: 14px; opacity: 0.5; }
        .hero-prod-prices { display: flex; align-items: baseline; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
        .hero-prod-eur { font-size: 40px; font-weight: 900; color: var(--text); line-height: 1; letter-spacing: -2px; }
        .hero-prod-eur-sym { font-size: 22px; font-weight: 700; letter-spacing: 0; opacity: 0.7; }
        .hero-prod-fcfa-block { display: flex; flex-direction: column; gap: 0; }
        .hero-prod-fcfa-value { font-size: 14px; font-weight: 700; color: var(--text-muted); line-height: 1.1; }
        .hero-prod-fcfa-label { font-size: 10px; font-weight: 600; color: var(--text-muted); opacity: 0.6; letter-spacing: 0.08em; }
        .hero-prod-stock-out { font-size: 11px; color: rgba(255,100,100,0.8); font-weight: 600; margin-bottom: 10px; }

        .hero-prod-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .hero-prod-btn {
          padding: 10px 18px; border-radius: 10px; border: 1px solid;
          font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
          cursor: pointer; transition: all 0.2s;
        }
        .hero-prod-btn--ok { border-color: #00ff88 !important; color: #00ff88 !important; background: rgba(0,255,136,0.1) !important; }
        .hero-prod-btn--off { opacity: 0.4; cursor: not-allowed; border-color: var(--border) !important; color: var(--text-muted) !important; background: transparent !important; }
        .hero-prod-detail-btn {
          padding: 10px 16px; border-radius: 10px; border: 1px solid;
          font-size: 12px; font-weight: 600; background: transparent; cursor: pointer;
          transition: all 0.2s; opacity: 0.75;
        }
        .hero-prod-detail-btn:hover { opacity: 1; }
        .hero-prod-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; z-index: 3; }

        /* ── Compact grid ── */
        .compact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 640px) { .compact-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
        @media (min-width: 1024px) { .compact-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }

        .compact-card {
          border-radius: 18px; border: 1px solid rgba(255,255,255,0.07);
          padding: 16px; position: relative; overflow: hidden; cursor: pointer;
          animation: heroFadeIn 0.25s ease both;
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
        }
        .compact-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.12); }
        .compact-glow { position: absolute; inset: 0; pointer-events: none; transition: opacity 0.3s; }
        .compact-media {
          width: 100%; aspect-ratio: 1.5; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px; overflow: hidden; position: relative; z-index: 1;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .compact-logo { width: 58%; max-height: 65%; object-fit: contain; filter: drop-shadow(0 2px 10px rgba(255,255,255,0.12)); transition: transform 0.3s; }
        .compact-emoji { font-size: 34px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; }
        .compact-tag {
          display: inline-block; font-size: 9px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 999px; border: 1px solid;
          margin-bottom: 8px; position: relative; z-index: 1;
        }
        .compact-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px; line-height: 1.3; position: relative; z-index: 1; }
        .compact-price-row { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; position: relative; z-index: 1; }
        .compact-eur { font-size: 22px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        .compact-fcfa { font-size: 10px; color: var(--text-muted); font-weight: 500; }
        .compact-btn { width: 100%; padding: 9px 0; border-radius: 10px; border: 1px solid; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; cursor: pointer; transition: all 0.2s; position: relative; z-index: 1; }
        .compact-btn--ok { border-color: #00ff88 !important; color: #00ff88 !important; background: rgba(0,255,136,0.1) !important; }
        .compact-btn--off { opacity: 0.4; cursor: not-allowed; border-color: var(--border) !important; color: var(--text-muted) !important; background: transparent !important; }
        .compact-line { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; opacity: 0.55; }

        /* ── Skeletons ── */
        .skel-wrap {
          border-radius: 18px; border: 1px solid var(--border);
          background: rgba(255,255,255,0.02); padding: 16px;
          animation: skelPulse 1.6s ease-in-out infinite;
          display: flex; flex-direction: column; gap: 8px;
        }
        .skel-wrap--lg { flex-direction: row; padding: 0; min-height: 200px; border-radius: 20px; }
        .skel-img-lg { width: 180px; min-width: 180px; min-height: 200px; background: rgba(255,255,255,0.05); border-radius: 20px 0 0 20px; }
        .skel-body { flex: 1; padding: 22px; display: flex; flex-direction: column; gap: 8px; }
        .skel { background: rgba(255,255,255,0.05); border-radius: 8px; }
        .skel-img     { aspect-ratio: 1.5; width: 100%; border-radius: 12px; }
        .skel-tag     { height: 16px; width: 45%; border-radius: 999px; }
        .skel-title   { height: 18px; width: 80%; }
        .skel-price   { height: 28px; width: 55%; }
        .skel-price-lg { height: 44px; width: 55%; }
        .skel-btn     { height: 38px; width: 100%; border-radius: 10px; margin-top: 4px; }

        @keyframes skelPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes heroFadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}