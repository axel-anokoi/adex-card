import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          backdropFilter: "blur(16px)",
        }}
      >
      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xl font-bold transition-colors hover:text-[var(--cyan)]"
              style={{ color: "var(--text)", fontFamily: "var(--font-display)", cursor: "none" }}
            >
              <span
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black glitch-box"
                style={{ background: "linear-gradient(135deg,var(--cyan),var(--violet))", color: "var(--bg)" }}
              >
                🎮
                <div className="glitch-layer absolute inset-0 rounded-lg" />
              </span>
              <span className="relative glitch-text">
                AdexCard<span style={{ color: "var(--cyan)" }}>.ci</span>
                <span className="glitch-layer-text absolute inset-0" />
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              La plateforme gaming ivoirienne pour acheter tes cartes USA, Xbox, Nintendo, iTunes.
              Livraison instantanee, paiement local securise.
            </p>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
<span className="badge badge-green">⚡ Livraison {"<"} 2 min</span>
              <span className="badge badge-cyan">🔒 Paiement securise</span>
            </div>
          </div>

          {/* Produits */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
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
                    style={{ cursor: "none", color: "var(--text-muted)", fontSize: 13 }}
                    className="transition-colors hover:text-[var(--cyan)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Informations
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "#", label: "FAQ" },
                { href: "#", label: "Contact" },
                { href: "#", label: "Mentions legales" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    style={{ cursor: "none", color: "var(--text-muted)", fontSize: 13 }}
                    className="transition-colors hover:text-[var(--text)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Contact
            </h3>
            <ul className="space-y-2" style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8 }}>
              <li>📍 Abidjan, Cote d&apos;Ivoire</li>
              <li>📧 support@AdexCard.ci</li>
              <li>📱 +225 07 05 89 80 80</li>
              <li style={{ fontSize: 11, color: "var(--text-faint)" }}>Disponible 7j/7 — 8h a 22h</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-start justify-between gap-4 pt-7 sm:flex-row sm:items-center"
          style={{ borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-faint)" }}
        >
          <p>© {year} AdexCard.ci — Tous droits reserves.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge" style={{ background: "var(--payment-cyan-dim)", border: "1px solid var(--payment-cyan)", color: "var(--cyan)" }}>
              💳 Djamo
            </span>
            <span className="badge" style={{ background: "var(--payment-amber-dim)", border: "1px solid var(--payment-amber)", color: "var(--amber)" }}>
              📱 Moov Money
            </span>
            <span className="badge" style={{ background: "rgba(0,154,68,0.08)", border: "1px solid rgba(0,154,68,0.2)", color: "var(--green)" }}>
              🇨🇮 Paiement local
            </span>
          </div>
        </div>
      </div>
    </footer>
    <style>{`
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      @keyframes glitch-clip {
        0% { clip-path: inset(50% 0 30% 0); }
        20% { clip-path: inset(10% 0 80% 0); }
        40% { clip-path: inset(40% 0 40% 0); }
        60% { clip-path: inset(80% 0 10% 0); }
        80% { clip-path: inset(30% 0 60% 0); }
        100% { clip-path: inset(50% 0 30% 0); }
      }
      .group:hover .glitch-box .glitch-layer {
        animation: glitch 0.2s linear infinite;
        background: var(--cyan);
        opacity: 0.5;
        mix-blend-mode: screen;
      }
      .group:hover .glitch-text {
        animation: glitch 0.3s linear infinite;
      }
      .group:hover .glitch-text .glitch-layer-text {
        animation: glitch-clip 0.2s linear infinite;
        background: var(--cyan);
        color: var(--text);
        mix-blend-mode: difference;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: none;
      }
    `}</style>
    </>
  );
}
