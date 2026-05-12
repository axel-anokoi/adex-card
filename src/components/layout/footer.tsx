import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    shop: [
      { href: "/shop", label: "Toutes les cartes" },
      { href: "/shop?category=playstation", label: "PlayStation" },
      { href: "/shop?category=xbox", label: "Xbox" },
      { href: "/shop?category=nintendo", label: "Nintendo" },
    ],
    support: [
      { href: "#", label: "FAQ" },
      { href: "#", label: "Contact" },
      { href: "#", label: "Mentions légales" },
    ],
  };

  return (
    <footer className="border-t border-white/10 bg-[#07070D]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-white transition-all hover:text-[#00E5FF]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#7B2FFF] text-sm text-black">
                🎮
              </span>
              BabiCard <span className="text-[#FF8C00]">CI</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              La plateforme gaming ivoirienne pour acheter tes cartes cadeaux PSN, Xbox, Nintendo, iTunes.
              Livraison instantanée, paiement local sécurisé.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full border border-[#00FF88]/30 bg-[#00FF88]/10 px-3 py-1 text-xs text-[#00FF88]">
                ⚡ Livraison {"<"} 2 min
              </span>
              <span className="rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs text-[#00E5FF]">
                🔒 Paiement sécurisé
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">Produits</h3>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/45 transition-colors hover:text-[#00E5FF]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">Informations</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/45 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/80">Contact</h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li>📍 Abidjan, Côte d’Ivoire</li>
              <li>📧 support@babicard.ci</li>
              <li>📱 WhatsApp: +225 07 05 89 80 80</li>
              <li className="pt-1 text-xs text-white/35">Disponible 7j/7 — 8h à 22h</li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-2.5 py-1 text-xs text-[#00E5FF]">f</span>
              <span className="rounded-full border border-[#7B2FFF]/30 bg-[#7B2FFF]/10 px-2.5 py-1 text-xs text-[#C29BFF]">ig</span>
              <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-white/80">tiktok</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center">
          <p>© {currentYear} BabiCard.ci — Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-[#00E5FF]">💳 Djamo</span>
            <span className="rounded-full border border-[#FF8C00]/30 bg-[#FF8C00]/10 px-3 py-1 text-[#FFD19A]">📱 Moov Money</span>
            <span className="rounded-full border border-[#009A44]/30 bg-[#009A44]/10 px-3 py-1 text-[#8BE5B5]">🇨🇮 Paiement local</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
