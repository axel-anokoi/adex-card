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
    <article className="group card-3d-hover card-neon-border relative overflow-hidden rounded-2xl border border-[#00E5FF]/15 bg-[rgba(26,26,40,0.85)] p-5">
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

      <div className="relative mb-3">
        <div className="absolute -right-1 -top-2 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]">
          Prix
        </div>
        <h3 className="price-badge text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {amount}€
          <span className="ml-1 text-xs font-normal text-[#00E5FF]">EUR</span>
        </h3>
      </div>

      <p className="relative text-sm text-white/60">
        FCFA estimé: <span className="font-semibold text-[#00E5FF]">{(sellPrice * 655).toLocaleString("fr-FR")} FCFA</span>
      </p>
      
      <p className="relative mt-2 text-sm">
        {outOfStock ? (
          <span className="rounded-full border border-red-400/40 bg-red-400/10 px-2 py-1 text-red-300">Rupture de stock</span>
        ) : (
          <span className="text-white/50">
            <span className="rounded-full border border-[#00FF88]/35 bg-[#00FF88]/10 px-2 py-1 font-medium text-[#00FF88]">
              {stockAvailable}
            </span>{" "}
            codes dispo
          </span>
        )}
      </p>

      <Link
        href={`/shop/${slug}`}
        className={`btn-press mt-4 cta-neon relative inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
          outOfStock
            ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/30"
            : "bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] text-black hover:scale-[1.01] hover:shadow-lg hover:shadow-[#00E5FF]/35"
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
