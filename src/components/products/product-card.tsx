import Link from "next/link";

interface ProductCardProps {
  id: string;
  slug: string;
  categoryName: string;
  amount: number;
  sellPrice: number;
  stockAvailable: number;
  image?: string;
}

export function ProductCard({
  slug,
  categoryName,
  amount,
  sellPrice,
  stockAvailable,
  image,
}: ProductCardProps) {
  const lowStock = stockAvailable > 0 && stockAvailable < 5;
  const outOfStock = stockAvailable <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#00E5FF]/20 bg-[#1A1A28] p-4 transition-all duration-300 hover:border-[#00E5FF]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]">
      
      {/* Badge de Stock (Flottant) */}
      {lowStock && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-md">
          Stock faible
        </div>
      )}

      {/* Section Image / Icône - Mise en évidence */}
      <div className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative h-20 w-20 transition-transform duration-500 group-hover:scale-110">
          {image && (image.startsWith('http') || image.startsWith('/')) ? (
            <img
              src={image}
              alt={categoryName}
              className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">
              {image || "💳"}
            </div>
          )}
        </div>
      </div>

      {/* Détails du Produit */}
      <div className="flex flex-col space-y-1">
        <h4 className="text-xs font-medium uppercase tracking-widest text-[#00E5FF]/70">
          {categoryName}
        </h4>
        
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            {sellPrice.toLocaleString("fr-FR")}
          </span>
          <span className="text-sm font-bold text-[#00E5FF]">FCFA</span>
        </div>
      </div>

      {/* Bouton d'action */}
      <div className="mt-5">
        <Link
          href={`/shop/${slug}`}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
            outOfStock
              ? "cursor-not-allowed border border-white/5 bg-white/5 text-white/20"
              : "bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-[#0A0A14] shadow-[0_4px_15px_rgba(0,229,255,0.2)] hover:shadow-[#00E5FF]/40 active:scale-95"
          }`}
        >
          {outOfStock ? (
            "Épuisé"
          ) : (
            <>
              Acheter maintenant
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 transition-transform group-hover:translate-x-1" 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </Link>
      </div>

      {/* Overlay décoratif subtil */}
      <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-[#00E5FF]/5 blur-3xl" />
    </article>
  );
}