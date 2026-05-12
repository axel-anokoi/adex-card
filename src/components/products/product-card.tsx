import Link from "next/link";

interface ProductCardProps {
  id: string;
  slug: string;
  categoryName: string;
  amount: number;
  sellPrice: number;
  stockAvailable: number;
}

export function ProductCard({
  slug,
  categoryName,
  amount,
  sellPrice,
  stockAvailable,
}: ProductCardProps) {
  const lowStock = stockAvailable > 0 && stockAvailable < 5;
  const outOfStock = stockAvailable <= 0;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#1A1A28] p-5 card-hover">
      {/* Neon glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="relative mb-3 flex items-center justify-between">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70 border border-white/5">
          {categoryName}
        </span>
        {lowStock && (
          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-xs font-semibold text-amber-400">
            Stock faible
          </span>
        )}
      </div>

      {/* Neon price badge */}
      <div className="relative mb-2">
        <h3 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {amount}€
          <span className="ml-1 text-xs font-normal text-[#00E5FF]">EUR</span>
        </h3>
      </div>
      
      <p className="relative text-sm text-white/60">
        Prix: <span className="font-semibold text-[#00E5FF]">{sellPrice.toFixed(2)}€</span>
      </p>
      
      <p className="mt-2 text-sm relative">
        {outOfStock ? (
          <span className="text-red-400">Rupture de stock</span>
        ) : (
          <span className="text-white/50">
            <span className="font-medium text-[#00FF88]">{stockAvailable}</span> codes dispo
          </span>
        )}
      </p>

      <Link
        href={`/shop/${slug}`}
        className={`btn-press mt-4 relative inline-flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold transition-all ${
          outOfStock
            ? "cursor-not-allowed border border-white/10 text-white/30 bg-white/5"
            : "bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black hover:shadow-lg hover:shadow-[#00E5FF]/30"
        }`}
      >
        {outOfStock ? "Indisponible" : "Acheter maintenant"}
        <span className={`ml-2 transition-transform group-hover:translate-x-1 ${outOfStock ? "hidden" : ""}`}>
          →
        </span>
      </Link>
    </article>
  );
}
