import Link from "next/link";

const cartItems = [
  {
    id: 1,
    title: "Adex Card Premium",
    description: "Carte virtuelle premium avec avantages exclusifs.",
    price: 19.9,
    quantity: 1,
  },
];

export default function CartPage() {
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const fees = 0;
  const total = subtotal + fees;

  return (
        <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "5rem 1rem 3rem", position: "relative", overflow: "hidden" }}>
          <div style={{ background: "var(--bg)", minHeight: "100vh" }} className="mx-auto w-full max-w-5xl px-4 py-24 sm:py-28">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div className="relative">
                <p className="section-label">Mon Panier</p>
                <h1 
                  className="glitch-heading" 
                  data-text="Récapitulatif"
                  style={{ 
                    fontSize: "clamp(2rem, 5vw, 3rem)", 
                    fontWeight: 800, 
                    color: "var(--text)", 
                    letterSpacing: "-1px", 
                    fontFamily: "var(--font-display)" 
                  }}
                >
                  Récapitulatif
                </h1>
              </div>
              <Link
                href="/shop"
                className="btn-outline px-6 py-2 text-sm font-bold uppercase tracking-wide"
              >
                Continuer mes achats
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
              <section 
                className="glass relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl"
                style={{ boxShadow: "var(--shadow-lg)" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-inherit uppercase tracking-wider" style={{ color: "var(--text)" }}>
                    Articles <span className="text-gradient-cyan ml-2">({cartItems.length})</span>
                  </h2>
                  <div className="h-px flex-1 mx-4 bg-gradient-to-r from-[var(--border)] to-transparent" />
                </div>

                <ul className="space-y-4">
                  {cartItems.map((item) => (
                    <li 
                      key={item.id} 
                      className="group rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-4 transition-all hover:border-[var(--border-cyan)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--cyan-dim)] to-[var(--violet-dim)] border border-[var(--border)] flex items-center justify-center text-2xl">
                            💳
                          </div>
                          <div>
                            <p className="font-bold text-inherit group-hover:text-cyan-400 transition-colors" style={{ color: "var(--text)" }}>{item.title}</p>
                            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-tighter" style={{ color: "var(--text-faint)" }}>Quantité: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold" style={{ color: "var(--text)" }}>{item.price.toFixed(2)}€</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <aside
                className="glass h-fit rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden"
                style={{ boxShadow: "var(--shadow-xl)", borderLeft: "4px solid var(--cyan)" }}
              >
                <div style={{ 
                  position: "absolute", top: -20, right: -20, width: 120, height: 120, 
                  background: "var(--cyan)", filter: "blur(60px)", opacity: 0.1, pointerEvents: "none" 
                }} />

                <h2 className="text-lg font-bold uppercase tracking-wider mb-6 relative z-10" style={{ color: "var(--text)" }}>Résumé</h2>

                <div className="space-y-3 text-sm relative z-10">
                  <div className="flex items-center justify-between py-2">
                    <span style={{ color: "var(--text-muted)" }}>Sous-total</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span style={{ color: "var(--text-muted)" }}>Frais de service</span>
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{fees.toFixed(2)}€</span>
                  </div>
                  <div className="mt-4 border-t border-[var(--border)] pt-4 flex items-center justify-between">
                    <span className="font-bold text-base" style={{ color: "var(--text)" }}>Total</span>
                    <span className="text-2xl font-black text-gradient-cyan">{total.toFixed(2)}€</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="mt-8 btn-primary w-full flex items-center justify-center py-4 text-sm font-bold uppercase tracking-widest transition-all"
                >
                  Passer au paiement
                </Link>
              </aside>
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
        </main>
  );
}
