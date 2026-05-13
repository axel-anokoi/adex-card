import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,5,0.7)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-bold text-white transition-colors hover:text-[#00ffe0]"
              style={{ fontFamily: "var(--font-display)", cursor: "none" }}
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-black font-black"
                style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)" }}
              >
                🎮
              </span>
              BabiCard<span style={{ color: "#00ffe0" }}>.ci</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              La plateforme gaming ivoirienne pour acheter tes cartes cadeaux PSN, Xbox, Nintendo, iTunes.
              Livraison instantanée, paiement local sécurisé.
            </p>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="badge badge-green">⚡ Livraison &lt; 2 min</span>
              <span className="badge badge-cyan">🔒 Paiement sécurisé</span>
            </div>
          </div>

          {/* Produits */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
              Produits
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/shop",                      label: "Toutes les cartes" },
                { href: "/shop?category=playstation", label: "PlayStation" },
                { href: "/shop?category=xbox",        label: "Xbox" },
                { href: "/shop?category=nintendo",    label: "Nintendo" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{ cursor: "none", color: "rgba(255,255,255,0.4)", fontSize: 13 }}
                    className="transition-colors hover:text-[#00ffe0]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
              Informations
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "#", label: "FAQ" },
                { href: "#", label: "Contact" },
                { href: "#", label: "Mentions légales" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    style={{ cursor: "none", color: "rgba(255,255,255,0.4)", fontSize: 13 }}
                    className="transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
              Contact
            </h3>
            <ul className="space-y-2" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
              <li>📍 Abidjan, Côte d&apos;Ivoire</li>
              <li>📧 support@babicard.ci</li>
              <li>📱 +225 07 05 89 80 80</li>
              <li style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Disponible 7j/7 — 8h à 22h</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-4 pt-7 sm:flex-row sm:items-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.3)" }}
        >
          <p>© {year} BabiCard.ci — Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00e5ff" }}>
              💳 Djamo
            </span>
            <span className="badge" style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)", color: "#ffa040" }}>
              📱 Moov Money
            </span>
            <span className="badge" style={{ background: "rgba(0,154,68,0.08)", border: "1px solid rgba(0,154,68,0.2)", color: "#00c860" }}>
              🇨🇮 Paiement local
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}