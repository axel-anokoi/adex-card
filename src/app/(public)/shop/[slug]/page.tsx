import Link from "next/link";
import { notFound } from "next/navigation";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }} className="mx-auto w-full max-w-4xl px-4 py-24 sm:py-28">
      <div 
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        style={{ 
          boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 20px var(--cyan-glow)",
          borderLeft: "4px solid var(--cyan)"
        }}
      >
        {/* Background Glow Effect */}
        <div style={{ 
          position: "absolute", top: -50, right: -50, width: 200, height: 200, 
          background: "var(--cyan)", filter: "blur(100px)", opacity: 0.15, pointerEvents: "none" 
        }} />

        <div className="relative z-10">
          <p className="section-label" style={{ marginBottom: 8 }}>{product.category?.name || "Produit"}</p>
          
          <h1 
            className="glitch-heading" 
            data-text={`${product.amount} FCFA`}
            style={{ 
              fontSize: "clamp(2.5rem, 6vw, 4rem)", 
              fontWeight: 800, 
              color: "var(--text)", 
              marginBottom: 16, 
              letterSpacing: "-2px", 
              fontFamily: "var(--font-display)" 
            }}
          >
            {product.amount} FCFA
          </h1>

          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-8">
            Livraison immédiate par email après confirmation du paiement.
            L&apos;accès à vos contenus gaming n&apos;a jamais été aussi rapide.
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-10">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan/50 group">
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 group-hover:text-cyan/70">Montant</p>
              <p className="text-2xl font-bold text-white">{product.amount} FCFA</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan/50 group">
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 group-hover:text-cyan/70">Prix</p>
              <p className="text-2xl font-bold text-white">{product.sell_price.toFixed(2)} FCFA</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan/50 group">
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-2 group-hover:text-cyan/70">Stock</p>
              <p className="text-2xl font-bold text-white">
                {product.stock_available > 0 ? `${product.stock_available} codes` : "Rupture"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
            <Link
              href="/cart"
              className="btn-primary flex-1 text-center py-4 font-bold uppercase tracking-wide"
            >
              Ajouter au panier
            </Link>
            <Link
              href="/checkout"
              className="btn-outline flex-1 text-center py-4 font-bold uppercase tracking-wide"
            >
              Acheter maintenant
            </Link>
          </div>
        </div>
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
