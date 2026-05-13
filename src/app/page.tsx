"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// FCFA conversion
const EUR_TO_FCFA = 655;
const toFCFA = (eur: number) => (eur * EUR_TO_FCFA).toLocaleString("fr-FR");

// ─────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────

const platforms = [
  {
    slug: "playstation",
    badge: "🎮 PlayStation",
    icon: "🎮",
    title: "PlayStation Network Cards",
    subtitle: "PSN • Région US",
    amounts: [10, 20, 50],
    cardBg: "linear-gradient(145deg, #000d2e, #002870)",
    cardBorder: "rgba(0,112,204,0.3)",
    glowColor: "rgba(0,112,204,0.5)",
    badgeBg: "rgba(0,112,204,0.2)",
    badgeColor: "rgba(100,180,255,0.9)",
    badgeBorder: "rgba(0,112,204,0.4)",
  },
  {
    slug: "xbox",
    badge: "🎯 Xbox",
    icon: "🎯",
    title: "Xbox Gift Cards",
    subtitle: "Xbox Live • Game Pass",
    amounts: [10, 25, 50],
    cardBg: "linear-gradient(145deg, #001400, #0a3a0a)",
    cardBorder: "rgba(82,176,67,0.3)",
    glowColor: "rgba(82,176,67,0.5)",
    badgeBg: "rgba(82,176,67,0.15)",
    badgeColor: "rgba(130,220,100,0.9)",
    badgeBorder: "rgba(82,176,67,0.4)",
  },
  {
    slug: "nintendo",
    badge: "🍄 Nintendo",
    icon: "🍄",
    title: "Nintendo eShop Cards",
    subtitle: "Switch • NSO",
    amounts: [10, 20, 35],
    cardBg: "linear-gradient(145deg, #200003, #540008)",
    cardBorder: "rgba(228,0,15,0.3)",
    glowColor: "rgba(228,0,15,0.5)",
    badgeBg: "rgba(228,0,15,0.15)",
    badgeColor: "rgba(255,100,100,0.9)",
    badgeBorder: "rgba(228,0,15,0.4)",
  },
  {
    slug: "apple",
    badge: "🍎 Apple",
    icon: "🍎",
    title: "iTunes App Store Cards",
    subtitle: "App Store • iTunes",
    amounts: [5, 10, 25],
    cardBg: "linear-gradient(145deg, #111111, #333333)",
    cardBorder: "rgba(180,180,180,0.25)",
    glowColor: "rgba(180,180,180,0.4)",
    badgeBg: "rgba(180,180,180,0.12)",
    badgeColor: "rgba(210,210,210,0.9)",
    badgeBorder: "rgba(180,180,180,0.35)",
  },
];

const features = [
  { icon: "⚡", title: "Livraison < 2 min",   desc: "Code livré instantanément par email après paiement", accent: "#00ffe0", dim: "rgba(0,255,224,0.1)" },
  { icon: "🔐", title: "Paiement sécurisé",   desc: "Djamo, Moov Money & Wave acceptés",                  accent: "#7b2fff", dim: "rgba(123,47,255,0.1)" },
  { icon: "✅", title: "100% Officiel",        desc: "Codes authentiques garantis, jamais utilisés",       accent: "#00ff88", dim: "rgba(0,255,136,0.1)" },
  { icon: "💬", title: "Support 24/7",         desc: "Assistance rapide sur WhatsApp",                     accent: "#ffb800", dim: "rgba(255,184,0,0.1)" },
];

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", desc: "PSN, PS Plus, PS Stars",   cssClass: "gradient-psn  border-psn  glow-psn",  count: "12 cartes" },
  { slug: "xbox",        name: "Xbox",        icon: "🎯", desc: "Xbox Live, Game Pass",     cssClass: "gradient-xbox border-xbox glow-xbox",  count: "8 cartes" },
  { slug: "nintendo",    name: "Nintendo",    icon: "🍄", desc: "eShop, NSO",               cssClass: "gradient-nintendo border-nintendo glow-nintendo", count: "6 cartes" },
  { slug: "apple",       name: "Apple",       icon: "🍎", desc: "iTunes, App Store",        cssClass: "gradient-apple border-apple glow-apple", count: "5 cartes" },
];

const steps = [
  { num: "01", icon: "🛒", title: "Choisissez votre carte",  desc: "Parcourez le catalogue et sélectionnez la carte et le montant souhaités." },
  { num: "02", icon: "💳", title: "Payez en sécurité",       desc: "Réglez avec Djamo, Moov Money ou Wave. 100% sécurisé et instantané." },
  { num: "03", icon: "📧", title: "Recevez votre code",      desc: "Votre code est livré par email en moins de 2 minutes. Prêt à l'emploi !" },
];

const testimonials = [
  { name: "Kouamé A.", city: "Abidjan", initials: "K", color: "#2563eb", rating: 5, text: "Incroyable ! J'ai reçu mon code PSN en moins d'une minute. Le paiement Djamo est super pratique. Je recommande à 100% !", product: "PSN 20€" },
  { name: "Fatou D.",  city: "Bouaké",  initials: "F", color: "#7c3aed", rating: 5, text: "Service rapide et fiable. J'ai acheté une carte iTunes pour mon fils, le code a fonctionné immédiatement. Merci BabiCard !", product: "iTunes 10€" },
  { name: "Yves K.",   city: "Abidjan", initials: "Y", color: "#16a34a", rating: 5, text: "Le meilleur site pour acheter des cartes gaming en Côte d'Ivoire. Prix corrects et livraison ultra rapide. Mon go-to !", product: "Xbox 25€" },
];

const stats = [
  { value: "1 200+", label: "Clients satisfaits" },
  { value: "< 2 min", label: "Délai de livraison" },
  { value: "100%", label: "Codes authentiques" },
  { value: "24/7", label: "Support disponible" },
];

// ─────────────────────────────────────────
//  HERO 3D CARD
// ─────────────────────────────────────────

function HeroCard({ platform }: { platform: typeof platforms[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [amtIdx, setAmtIdx] = useState(0);

  function onMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    card.style.transform = `perspective(1200px) rotateY(${dx * 18}deg) rotateX(${-dy * 18}deg) scale(1.04)`;
    if (shine) {
      const sx = ((dx + 1) / 2 * 100).toFixed(1);
      const sy = ((dy + 1) / 2 * 100).toFixed(1);
      shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.18), transparent 60%)`;
    }
  }

  function onMouseLeave() {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (card) card.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)";
    if (shine) shine.style.background = "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)";
  }

  const amt = platform.amounts[amtIdx];

  return (
    <div ref={wrapRef} className="flex items-center justify-center" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <div style={{ position: "relative", width: 300 }}>
        {/* Rainbow border glow */}
        <div className="card-rainbow-border" />

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            width: 300,
            height: 400,
            borderRadius: 24,
            background: platform.cardBg,
            border: `1px solid ${platform.cardBorder}`,
            position: "relative",
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transition: "transform 0.08s linear",
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${platform.glowColor}`,
          }}
        >
          {/* Scanlines */}
          <div className="scanline-overlay" />
          {/* Shine */}
          <div ref={shineRef} style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", borderRadius: 24,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)",
            transition: "background 0.05s",
          }} />

          {/* Content */}
          <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: platform.badgeBg, border: `1px solid ${platform.badgeBorder}`,
              color: platform.badgeColor,
              padding: "6px 14px", borderRadius: 999,
              fontSize: 12, fontWeight: 600, width: "fit-content", marginBottom: 8,
            }}>
              {platform.badge}
            </div>

            {/* Icon */}
            <div style={{ fontSize: 56, margin: "auto 0", animation: "iconFloat 3s ease-in-out infinite", textShadow: "0 0 30px rgba(0,255,224,0.4)" }}>
              {platform.icon}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{platform.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>{platform.subtitle} · Livraison instantanée</div>

              {/* Amount picker */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {platform.amounts.map((a, i) => (
                  <button
                    key={a}
                    onClick={() => setAmtIdx(i)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "none",
                      border: amtIdx === i ? "1px solid rgba(0,255,224,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      background: amtIdx === i ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
                      color: amtIdx === i ? "#00ffe0" : "rgba(255,255,255,0.7)",
                      transition: "all 0.2s",
                    }}
                  >
                    {a}€
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 26, fontWeight: 800 }}>
                <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {amt}€
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 8, WebkitTextFillColor: "rgba(255,255,255,0.4)" }}>
                  → {toFCFA(amt)} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.4 }} />
        </div>
      </div>

      <style>{`
        @keyframes iconFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-10px) rotate(2deg); }
          66%      { transform: translateY(-5px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────
//  HERO CAROUSEL
// ─────────────────────────────────────────

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((next: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setIdx(next); setAnimating(false); }, 280);
  }, [animating]);

  const goNext = useCallback(() => goTo((idx + 1) % platforms.length), [idx, goTo]);
  const goPrev = useCallback(() => goTo((idx - 1 + platforms.length) % platforms.length), [idx, goTo]);

  useEffect(() => {
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [goNext]);

  const p = platforms[idx];

  return (
    <section
      style={{ minHeight: "calc(100vh - 64px)", background: "transparent", position: "relative", overflow: "hidden" }}
      className="flex items-center justify-center px-4 py-16"
    >
      <div style={{ maxWidth: 1100, width: "100%" }} className="grid gap-12 lg:grid-cols-2 items-center">

        {/* Left text */}
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateX(16px)" : "translateX(0)",
            transition: "opacity 0.28s, transform 0.28s",
          }}
        >
          {/* Live badge */}
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ffe0", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            En stock · Livraison instantanée
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#fff",
              marginBottom: 20,
              letterSpacing: "-1px",
              fontFamily: "var(--font-display)",
            }}
          >
            Cartes gaming<br />
            <span className="text-gradient-cyan">Côte d&apos;Ivoire</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.75, marginBottom: 32, maxWidth: 440 }}>
            {p.title} — payez avec Djamo ou Moov Money. Code livré en moins de 2 minutes.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={`/shop?category=${p.slug}`} className="btn-primary animate-cta">
              Acheter maintenant
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/shop" className="btn-outline">Voir le catalogue</Link>
          </div>

          {/* Platform dots */}
          <div style={{ display: "flex", gap: 12, marginTop: 36, alignItems: "center" }}>
            {/* Nav arrows */}
            <button onClick={goPrev} style={{ cursor: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }}>←</button>
            {platforms.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  cursor: "none",
                  width: i === idx ? 32 : 8, height: 8, borderRadius: 999,
                  background: i === idx ? "#00ffe0" : "rgba(255,255,255,0.2)",
                  boxShadow: i === idx ? "0 0 12px rgba(0,255,224,0.6)" : "none",
                  border: "none", transition: "all 0.3s",
                }}
              />
            ))}
            <button onClick={goNext} style={{ cursor: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }}>→</button>
          </div>
        </div>

        {/* Right 3D card */}
        <div style={{ opacity: animating ? 0 : 1, transform: animating ? "scale(0.94)" : "scale(1)", transition: "opacity 0.28s, transform 0.28s" }}>
          <HeroCard platform={p} />
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────
//  SECTIONS
// ─────────────────────────────────────────

function FeaturesSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-sm:grid-cols-2">
        {features.map((f) => (
          <article key={f.title} className="feat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: f.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{f.desc}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>
      <p className="section-label">Catégories</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <h2 className="section-title">Par plateforme</h2>
        <Link href="/shop" style={{ color: "#00ffe0", fontSize: 14, fontWeight: 500, textDecoration: "none", cursor: "none" }}>
          Voir tout →
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-sm:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            style={{ textDecoration: "none", cursor: "none", borderRadius: 18, padding: 22, display: "block", transition: "all 0.3s" }}
            className={cat.cssClass}
          >
            <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>{cat.icon}</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{cat.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{cat.desc}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{cat.count}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p className="section-label">Processus</p>
      <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Comment ça marche</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="max-sm:grid-cols-1">
        {steps.map((s) => (
          <article key={s.num} className="step-card">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#00ffe0", marginBottom: 14 }}>{s.num}</p>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaymentSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(18,18,30,0.8)", padding: "2rem 2.5rem", backdropFilter: "blur(12px)" }}>
        <p className="section-label">Paiements locaux</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "6px 0 8px" }}>Paiement 100% local, sécurisé et instantané</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", maxWidth: 540, lineHeight: 1.7, marginBottom: 20 }}>
          Réglez facilement avec Djamo et Moov Money. Vos transactions sont protégées et validées en temps réel.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          <div style={{ borderRadius: 14, border: "1px solid rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.07)", padding: "18px 20px" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>💳 Djamo</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Paiement rapide, simple et fiable.</p>
          </div>
          <div style={{ borderRadius: 14, border: "1px solid rgba(255,140,0,0.25)", background: "rgba(255,140,0,0.07)", padding: "18px 20px" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>📱 Moov Money</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Moyen local populaire, instantané.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p className="section-label">Avis clients</p>
      <h2 className="section-title" style={{ marginBottom: 6 }}>Ils nous font confiance</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+1 200 clients satisfaits à Abidjan, Bouaké et partout en CI</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="max-sm:grid-cols-1">
        {testimonials.map((t) => (
          <article key={t.name} className="testi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {t.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{t.city}</div>
              </div>
            </div>
            <div style={{ color: "#ffb800", fontSize: 13, marginBottom: 10 }}>{"★".repeat(t.rating)}</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 10 }}>{t.text}</p>
            <p style={{ fontSize: 12, color: "#00ffe0" }}>{t.product}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-sm:grid-cols-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="animate-count-up glass-cyan"
            style={{ borderRadius: 14, padding: "22px 20px", textAlign: "center" }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────

export default function HomePage() {
  return (
    <main style={{ background: "transparent", position: "relative" }}>
      <HeroCarousel />
      <FeaturesSection />
      <CategoriesSection />
      <StepsSection />
      <PaymentSection />
      <TestimonialsSection />
      <StatsSection />
    </main>
  );
}