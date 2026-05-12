"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/products/product-card";

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
    <div className="w-full px-4 py-24 sm:py-28">
<div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="animate-liftoff text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>Boutique</h1>
          <p className="animate-liftoff-delay-1 mt-2 text-white/50">Cartes cadeau gaming disponibles</p>
        </div>

        {/* Category Filter - Neon styled */}
        <div className="animate-liftoff-delay-2 mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.slug || "all"}
              onClick={() => setSelectedCategory(category.slug)}
              className={`btn-press rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category.slug || (category.slug === null && selectedCategory === null)
                  ? "bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black font-semibold shadow-lg shadow-[#00E5FF]/20"
                  : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              {/* Orbit Spinner */}
              <div className="spinner-orbit">
                <div className="spinner-orbit-ring" />
                <div className="spinner-orbit-ring" />
                <div className="spinner-orbit-ring" />
              </div>
              <p className="text-white/40 text-sm animate-pulse">Chargement...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#1A1D2B]/30">
            <p className="text-white/40">
              Aucun produit trouvé dans cette catégorie.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </div>
  );
}
