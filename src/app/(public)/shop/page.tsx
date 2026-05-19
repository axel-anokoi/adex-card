"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductModal } from "@/components/products/ProductModal";
import { useCart } from "@/context/CartContext";

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

// ─────────────────────────────────────────
//  CATEGORY META (same system as CategoriesSection)
// ─────────────────────────────────────────

const CATEGORY_META: Record<string, {
  label: string; icon: string;
  accent: string; accentRgb: string;
  gradient: string; gradientLight: string;
  particle: string;
}> = {
  playstation: {
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

// ─────────────────────────────────────────
//  SKELETON
// ─────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="shop-skel">
      <div className="shop-skel-media" />
      <div className="shop-skel-tag" />
      <div className="shop-skel-name" />
      <div className="shop-skel-price" />
      <div className="shop-skel-btn" />
    </div>
  );
}

// ─────────────────────────────────────────
//  SHOP PRODUCT CARD (matches Categories style)
// ─────────────────────────────────────────

function ShopCard({
  product, index, onOpenModal, addToCart,
}: { product: Product; index: number; onOpenModal: (p: Product) => void; addToCart: (p: Product) => Promise<{ success: boolean; error?: string }> }) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const meta = getMeta(product.cat);
  const isLight = useTheme();

  const gradient = isLight ? meta.gradientLight : meta.gradient;
  const mediaBg = isLight
    ? `radial-gradient(circle at 35% 35%, rgba(${meta.accentRgb},0.12), rgba(255,255,255,0.9))`
    : `radial-gradient(circle at 35% 35%, rgba(${meta.accentRgb},0.2), rgba(0,0,0,0.4))`;

  const inStock = product.stock_available > 0;

  const router = useRouter();

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) return;
    const result = await addToCart(product);
    if (result.success) {
      setAdded(true);
      router.push("/cart");
    }
  };

  return (
    <div
      className="shop-card"
      style={{
        background: gradient,
        animationDelay: `${index * 0.04}s`,
        boxShadow: hovered ? `0 10px 36px rgba(${meta.accentRgb},${isLight ? 0.12 : 0.22})` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenModal(product)}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenModal(product)}
    >
      {/* Ambient glow */}
      <div
        className="shop-card-glow"
        style={{
          background: `radial-gradient(ellipse at 60% 30%, rgba(${meta.accentRgb},${isLight ? 0.15 : 0.3}) 0%, transparent 65%)`,
          opacity: hovered ? 0.8 : 0.35,
        }}
      />
      {/* Scanlines (dark only) */}
      {!isLight && <div className="shop-card-scanlines" />}
      {/* Decorative particle */}
      <div
        className="shop-card-particle"
        style={{ color: meta.accent, opacity: hovered ? 0.1 : 0.05 }}
      >
        {meta.particle}
      </div>

      {/* Media */}
      <div className="shop-card-media" style={{ background: mediaBg }}>
        {isUrl(product.image) && !imgError ? (
          <img
            src={product.image} alt={product.name} className="shop-card-img"
            style={{ transform: hovered ? "scale(1.1)" : "scale(1)" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="shop-card-emoji"
            style={{ transform: hovered ? "scale(1.12) rotate(4deg)" : "scale(1)" }}
          >
            {isUrl(product.image) ? meta.icon : product.image}
          </span>
        )}
      </div>

      {/* Tag */}
      <div
        className="shop-card-tag"
        style={{
          color: meta.accent,
          borderColor: `rgba(${meta.accentRgb},0.3)`,
          background: `rgba(${meta.accentRgb},0.1)`,
        }}
      >
        {product.tag}
      </div>

      <p className="shop-card-name">{product.name}</p>

      {/* Price */}
      <div className="shop-card-prices">
        <span className="shop-card-eur" style={{ color: meta.accent }}>{toFCFA(product.eur)} FCFA</span>
        <span className="shop-card-fcfa">{product.amount}€</span>
      </div>

      {/* Actions */}
      <div className="shop-card-actions">
        <button
          className={`shop-card-btn${added ? " shop-card-btn--ok" : ""}${!inStock ? " shop-card-btn--off" : ""}`}
          style={added ? {} : inStock ? {
            borderColor: `rgba(${meta.accentRgb},0.45)`,
            background: `rgba(${meta.accentRgb},0.08)`,
            color: meta.accent,
          } : {}}
          onClick={handleAdd}
          disabled={!inStock}
        >
          {added ? "✓ Ajouté !" : inStock ? "+ Panier" : "Indisponible"}
        </button>
        <button
          className="shop-card-detail"
          style={{ borderColor: `rgba(${meta.accentRgb},0.25)`, color: meta.accent }}
          onClick={(e) => { e.stopPropagation(); onOpenModal(product); }}
        >
          ⋯
        </button>
      </div>

      {/* Bottom line */}
      <div
        className="shop-card-line"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${meta.accentRgb},0.65), transparent)` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────
//  CATEGORY PILL
// ─────────────────────────────────────────

function CategoryPill({ slug, label, icon, count, active, onClick }: {
  slug: string | null; label: string; icon?: string;
  count: number; active: boolean; onClick: () => void;
}) {
  const meta = slug ? getMeta(slug) : null;
  return (
    <button
      onClick={onClick}
      className={`sp-pill${active ? " sp-pill--active" : ""}`}
      style={active && meta ? {
        borderColor: meta.accent,
        background: `rgba(${meta.accentRgb},0.15)`,
        color: meta.accent,
        boxShadow: `0 0 18px rgba(${meta.accentRgb},0.25)`,
      } : active ? {
        borderColor: "rgba(123,47,255,0.55)",
        background: "rgba(123,47,255,0.15)",
        color: "#c4a0ff",
        boxShadow: "0 0 18px rgba(123,47,255,0.2)",
      } : {}}
    >
      {icon && <span className="sp-pill-icon">{icon}</span>}
      <span className="sp-pill-label">{label}</span>
      <span className="sp-pill-count">{count}</span>
    </button>
  );
}

// ─────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────

export default function ShopPage() {
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ slug: string | null; name: string; icon: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        const { data, categories: apiCategories } = await res.json();
        const all: Product[] = data || [];
        setAllProducts(all);
        setProducts(all);

        if (apiCategories?.length) {
          const cats = apiCategories.map((slug: string) => {
            const meta = getMeta(slug);
            return {
              slug,
              name: meta.label,
              icon: meta.icon,
              count: all.filter((p: Product) => p.cat === slug).length,
            };
          });
          setCategories([{ slug: null, name: "Tous", icon: "✦", count: all.length }, ...cats]);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCategoryChange = useCallback((slug: string | null) => {
    setSelectedCategory(slug);
    setProducts(slug ? allProducts.filter((p) => p.cat === slug) : allProducts);
  }, [allProducts]);

  const handleModalAdd = useCallback((p: { id: string; name: string; eur: number; cat?: string; image?: string; quantity: number; total: number }) => {
    addToCart(p);
    setModalProduct(null);
    router.push("/cart");
  }, [addToCart, router]);

  return (
    <div className="shop-page">
      {/* ── Header ── */}
      <div className="shop-header">
        <div>
          <p className="section-label">Catalogue</p>
          <h1 className="shop-title">
            Boutique <span className="shop-title-accent">Gaming</span>
          </h1>
          <p className="shop-subtitle">
            Cartes cadeaux officielles · Livraison instantanée · Paiement sécurisé
          </p>
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="sp-pills-row">
        {categories.map((cat) => (
          <CategoryPill
            key={cat.slug ?? "all"}
            slug={cat.slug}
            label={cat.name}
            icon={cat.icon}
            count={cat.count}
            active={selectedCategory === cat.slug}
            onClick={() => handleCategoryChange(cat.slug)}
          />
        ))}
      </div>

      {/* ── Results bar ── */}
      <div className="shop-results-bar">
        <span className="shop-results-count">
          {loading ? "Chargement…" : `${products.length} produit${products.length > 1 ? "s" : ""}`}
        </span>
        {selectedCategory && (
          <button className="shop-clear-btn" onClick={() => handleCategoryChange(null)}>
            Tout afficher ✕
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="shop-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="shop-empty">
          <span style={{ fontSize: 48 }}>📦</span>
          <p>Aucun produit trouvé dans cette catégorie.</p>
          <button className="shop-reset-btn" onClick={() => handleCategoryChange(null)}>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="shop-grid">
          {products.map((p, i) => (
            <ShopCard key={p.id} product={p} index={i} onOpenModal={setModalProduct} addToCart={addToCart} />
          ))}
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

      {/* ── STYLES ── */}
      <style>{`
        .shop-page {
          background: var(--bg); min-height: 100vh;
          max-width: 1200px; margin: 0 auto;
          padding: 6rem 1.25rem 5rem;
        }

        /* Header */
        .shop-header { margin-bottom: 2rem; }
        .shop-title {
          font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;
          color: var(--text); letter-spacing: -1.5px;
          margin: 6px 0 10px; font-family: var(--font-display, inherit);
          line-height: 1.1;
        }
        .shop-title-accent {
          background: linear-gradient(135deg, var(--cyan, #00ffe0), var(--violet, #7b2fff));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .shop-subtitle { font-size: 15px; color: var(--text-muted, #888); line-height: 1.5; }

        /* Pills */
        .sp-pills-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .sp-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 999px;
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          background: rgba(255,255,255,0.04);
          color: var(--text-muted, #888); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .sp-pill-icon { font-size: 14px; }
        .sp-pill-label { font-size: 13px; }
        .sp-pill-count {
          font-size: 11px; opacity: 0.55;
          background: rgba(255,255,255,0.08); border-radius: 999px;
          padding: 1px 7px; font-weight: 500;
        }

        /* Results bar */
        .shop-results-bar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .shop-results-count { font-size: 13px; color: var(--text-muted, #888); }
        .shop-clear-btn {
          font-size: 13px; color: var(--cyan, #00ffe0);
          background: none; border: none; cursor: pointer; padding: 0;
        }

        /* Grid */
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr); gap: 12px;
        }
        @media (min-width: 640px)  { .shop-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
        @media (min-width: 900px)  { .shop-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
        @media (min-width: 1100px) { .shop-grid { grid-template-columns: repeat(5, 1fr); gap: 16px; } }

        /* ── Shop card ── */
        .shop-card {
          border-radius: 18px; border: 1px solid rgba(255,255,255,0.07);
          padding: 16px; position: relative; overflow: hidden; cursor: pointer;
          animation: shopFadeIn 0.28s ease both;
          transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
          outline: none;
        }
        .shop-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.13); }
        .shop-card:focus-visible { outline: 2px solid rgba(255,255,255,0.3); outline-offset: 2px; }
        .shop-card-glow { position: absolute; inset: 0; pointer-events: none; transition: opacity 0.3s; }
        .shop-card-scanlines {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 3px);
          opacity: 0.4;
        }
        .shop-card-particle {
          position: absolute; right: -6px; bottom: -6px;
          font-size: 80px; line-height: 1; pointer-events: none;
          z-index: 1; font-weight: 900; transition: opacity 0.3s;
        }
        .shop-card-media {
          width: 100%; aspect-ratio: 1.5; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px; overflow: hidden;
          position: relative; z-index: 2;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .shop-card-img {
          width: 58%; max-height: 65%; object-fit: contain;
          filter: drop-shadow(0 2px 10px rgba(255,255,255,0.12));
          transition: transform 0.3s;
        }
        .shop-card-emoji {
          font-size: 34px; display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s;
        }
        .shop-card-tag {
          display: inline-block; font-size: 9px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 999px; border: 1px solid;
          margin-bottom: 8px; position: relative; z-index: 2;
        }
        .shop-card-name {
          font-size: 13px; font-weight: 700; color: var(--text, #fff);
          margin-bottom: 8px; line-height: 1.3; position: relative; z-index: 2;
        }
        .shop-card-prices {
          display: flex; flex-direction: column; gap: 2px;
          margin-bottom: 12px; position: relative; z-index: 2;
        }
        .shop-card-eur { font-size: 22px; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        .shop-card-fcfa { font-size: 10px; color: var(--text-muted, #888); font-weight: 500; }

        .shop-card-actions { display: flex; gap: 6px; position: relative; z-index: 2; }
        .shop-card-btn {
          flex: 1; padding: 9px 0; border-radius: 10px; border: 1px solid;
          font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
          cursor: pointer; transition: all 0.2s;
        }
        .shop-card-btn--ok { border-color: #00ff88 !important; color: #00ff88 !important; background: rgba(0,255,136,0.1) !important; }
        .shop-card-btn--off { opacity: 0.4; cursor: not-allowed; border-color: var(--border, rgba(255,255,255,0.1)) !important; color: var(--text-muted, #888) !important; background: transparent !important; }
        .shop-card-detail {
          width: 36px; flex-shrink: 0; border-radius: 10px;
          border: 1px solid; background: transparent; font-size: 16px;
          cursor: pointer; transition: all 0.2s; display: flex;
          align-items: center; justify-content: center;
          opacity: 0.7;
        }
        .shop-card-detail:hover { opacity: 1; background: rgba(255,255,255,0.05); }
        .shop-card-line { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; opacity: 0.55; }

        /* Empty */
        .shop-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 64px 0; text-align: center;
          color: var(--text-muted, #888); font-size: 14px;
        }
        .shop-reset-btn {
          padding: 10px 24px; border-radius: 10px;
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          background: transparent; color: var(--cyan, #00ffe0);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s;
        }
        .shop-reset-btn:hover { background: rgba(0,255,224,0.08); }

        /* Skeleton */
        .shop-skel {
          border-radius: 18px; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02); padding: 16px;
          animation: skelPulse 1.6s ease-in-out infinite;
          display: flex; flex-direction: column; gap: 8px;
        }
        .shop-skel-media { aspect-ratio: 1.5; border-radius: 12px; background: rgba(255,255,255,0.05); }
        .shop-skel-tag   { height: 16px; width: 40%; border-radius: 999px; background: rgba(255,255,255,0.05); }
        .shop-skel-name  { height: 18px; width: 75%; border-radius: 8px; background: rgba(255,255,255,0.05); }
        .shop-skel-price { height: 28px; width: 55%; border-radius: 8px; background: rgba(255,255,255,0.05); }
        .shop-skel-btn   { height: 38px; border-radius: 10px; background: rgba(255,255,255,0.05); }

        @keyframes skelPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes shopFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}