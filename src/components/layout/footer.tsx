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
    <footer className="border-t border-white/5 bg-[#07070D]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-[#00E5FF] transition-all">
              🎮 BabiCard CI
            </Link>
<p className="text-sm text-white/40">
              Tes cartes gaming livrées en 2 minutes. Paiement Djamo & Moov Money en Côte d&apos;Ivoire.
            </p>
          </div>

          {/* Shop Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Boutique</h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-[#00E5FF] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="flex flex-col gap-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-white/30 sm:flex-row">
          <p>© {currentYear} BabiCard CI. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span>💳</span>
              <span className="text-white/50 font-medium">Djamo</span>
            </span>
            <span className="flex items-center gap-1">
              <span>📱</span>
              <span className="text-white/50 font-medium">Moov Money</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
