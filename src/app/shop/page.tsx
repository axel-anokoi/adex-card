"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/products/product-card";
import Link from "next/link";

interface Product {
  id: string;
  category: { slug: string; name: string };
  amount: number;
  sell_price: number;
  stock_available: number;
  is_active: boolean;
}

const categories = [
  { slug: null, name: "Toutes" },
  { slug: "playstation", name: "PlayStation" },
  { slug: "xbox", name: "Xbox" },
  { slug: "nintendo", name: "Nintendo" },
  { slug: "apple", name: "Apple" },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = selectedCategory
          ? `/api/products?category=${selectedCategory}`
          : `/api/products`;

        const response = await fetch(url);
        const { data } = await response.json();
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }} className="w-full px-4 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center sm:text-left">
          <p className="section-label">Catalogue</p>
          <h1 
            className="glitch-heading" 
            data-text="Boutique Gaming"
            style={{ 
              fontSize: "clamp(2rem, 5vw, 3rem)", 
              fontWeight: 800, 
              color: "var(--text)", 
              marginBottom: 12, 
              letterSpacing: "-1px", 
              fontFamily: "var(--font-display)" 
            }}
          >
            Boutique <span className="text-gradient-cyan">Gaming</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Découvrez nos cartes cadeaux officielles. Livraison instantanée, paiement sécurisé et support 24/7.
          </p>
        </div>

        {/* Category Filter - Neon styled */}
        <div className="mb-12 flex flex-wrap gap-3 justify-center sm:justify-start">
          {categories.map((category) => (
            <button
              key={category.slug || "all"}
              onClick={() => setSelectedCategory(category.slug)}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: selectedCategory === category.slug || (category.slug === null && selectedCategory === null)
                  ? "2px solid var(--cyan)"
                  : "1px solid var(--border)",
                background: selectedCategory === category.slug || (category.slug === null && selectedCategory === null)
                  ? "var(--cyan)"
                  : "var(--bg-card)",
                color: selectedCategory === category.slug || (category.slug === null && selectedCategory === null)
                  ? "black"
                  : "var(--text-muted)",
                boxShadow: selectedCategory === category.slug || (category.slug === null && selectedCategory === null)
                  ? "0 0 15px var(--cyan-glow)"
                  : "none",
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner-orbit">
                <div className="spinner-orbit-ring" />
                <div className="spinner-orbit-ring" />
                <div className="spinner-orbit-ring" />
              </div>
              <p className="text-white/40 text-sm animate-pulse">Chargement du catalogue...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1A1D2B]/30 backdrop-blur-sm">
            <div className="text-center">
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <p className="text-white/40 text-lg">
                Aucun produit trouvé dans cette catégorie.
              </p>
              <Link href="/shop" className="btn-outline mt-4 inline-block">
                Réinitialiser les filtres
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.category.slug}
                categoryName={product.category.name}
                amount={product.amount}
                sellPrice={product.sell_price}
                stockAvailable={product.stock_available}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .glitch-heading {
          position: relative;
          display: inline-block;
          animation: glitch-skew 2.2s infinite steps(1, end);
        }

        .glitch-heading::before,
        .glitch-heading::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          pointer-events: none;
          opacity: 0;
        }

        .glitch-heading::before {
          color: #00ffe0;
          text-shadow: -3px 0 #00ffe0;
          animation: glitch-layer-1 1.8s infinite steps(2, end);
        }

        .glitch-heading::after {
          color: #ff2fd1;
          text-shadow: 3px 0 #ff2fd1;
          animation: glitch-layer-2 1.8s infinite steps(2, end);
        }

        @keyframes glitch-skew {
          0%, 80%, 100% { transform: none; }
          81% { transform: skewX(3deg); }
          82% { transform: skewX(-4deg); }
          83% { transform: skewX(2deg); }
          84% { transform: skewX(-2deg); }
        }

        @keyframes glitch-layer-1 {
          0%, 76%, 100% { opacity: 0; transform: translate(0); clip-path: inset(0 0 0 0); }
          77% { opacity: .95; transform: translate(-4px, -2px); clip-path: inset(6% 0 74% 0); }
          78% { opacity: .9; transform: translate(4px, 1px); clip-path: inset(42% 0 30% 0); }
          79% { opacity: .95; transform: translate(-3px, 1px); clip-path: inset(70% 0 10% 0); }
        }

        @keyframes glitch-layer-2 {
          0%, 76%, 100% { opacity: 0; transform: translate(0); clip-path: inset(0 0 0 0); }
          77% { opacity: .85; transform: translate(3px, 2px); clip-path: inset(14% 0 62% 0); }
          78% { opacity: .8; transform: translate(-4px, -2px); clip-path: inset(56% 0 22% 0); }
          79% { opacity: .85; transform: translate(2px, 0); clip-path: inset(76% 0 8% 0); }
        }
      `}</style>
    </div>
  );
}
