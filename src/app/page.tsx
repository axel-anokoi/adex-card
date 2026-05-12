"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

// FCFA conversion rate (1 EUR ≈ 655 FCFA)
const EUR_TO_FCFA = 655;
const toFCFA = (eur: number) => (eur * EUR_TO_FCFA).toLocaleString("fr-FR");

type HeroProduct = {
  category: string;
  categorySlug: string;
  categoryColor: string;
  categoryTextColor: string;
  icon: string;
  iconBg: string;
  name: string;
  description: string;
  amounts: number[];
  borderClass: string;
};

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  bg: string;
  border: string;
};

type Category = {
  name: string;
  slug: string;
  icon: string;
  description: string;
  gradient: string;
  glow: string;
  border: string;
  count: string;
};

type Step = {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type Testimonial = {
  name: string;
  city: string;
  avatar: string;
  avatarColor: string;
  rating: number;
  text: string;
  product: string;
};

const heroProducts: HeroProduct[] = [
  {
    category: "Apple",
    categorySlug: "apple",
    categoryColor: "bg-gray-600/80",
    categoryTextColor: "text-gray-200",
    icon: "🍎",
    iconBg: "gradient-apple",
    name: "iTunes App Store Cards",
    description:
      "Achetez apps, musiques, films, séries sur l'App Store et iTunes. Valable pour les comptes US.",
    amounts: [5, 10, 25],
    borderClass: "border-apple",
  },
  {
    category: "PlayStation",
    categorySlug: "playstation",
    categoryColor: "bg-blue-600/80",
    categoryTextColor: "text-blue-200",
    icon: "🎮",
    iconBg: "gradient-playstation",
    name: "PlayStation Network Cards",
    description:
      "Rechargez votre wallet PSN pour acheter des jeux, DLC et abonnements PS Plus.",
    amounts: [10, 20, 50],
    borderClass: "border-playstation",
  },
  {
    category: "Xbox",
    categorySlug: "xbox",
    categoryColor: "bg-green-700/80",
    categoryTextColor: "text-green-200",
    icon: "🎯",
    iconBg: "gradient-xbox",
    name: "Xbox Gift Cards",
    description:
      "Achetez des jeux, du contenu additionnel et souscrivez au Xbox Game Pass Ultimate.",
    amounts: [10, 25, 50],
    borderClass: "border-xbox",
  },
  {
    category: "Nintendo",
    categorySlug: "nintendo",
    categoryColor: "bg-red-600/80",
    categoryTextColor: "text-red-200",
    icon: "🍄",
    iconBg: "gradient-nintendo",
    name: "Nintendo eShop Cards",
    description:
      "Achetez des jeux Nintendo Switch, DLC et abonnements Nintendo Switch Online.",
    amounts: [10, 20, 35],
    borderClass: "border-nintendo",
  },
];

const features: Feature[] = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
    title: "Livraison < 2 min",
    description: "Code livré instantanément par email après paiement",
    accent: "text-[#00E5FF]",
    bg: "bg-[#00E5FF]/10",
    border: "border-[#00E5FF]/20",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
    title: "Paiement sécurisé",
    description: "Djamo, Moov Money & Wave acceptés",
    accent: "text-[#7B2FFF]",
    bg: "bg-[#7B2FFF]/10",
    border: "border-[#7B2FFF]/20",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "100% Officiel",
    description: "Codes authentiques garantis, jamais utilisés",
    accent: "text-[#00FF88]",
    bg: "bg-[#00FF88]/10",
    border: "border-[#00FF88]/20",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
    title: "Support 24/7",
    description: "Assistance rapide sur WhatsApp",
    accent: "text-[#FFB800]",
    bg: "bg-[#FFB800]/10",
    border: "border-[#FFB800]/20",
  },
];

const categories: Category[] = [
  {
    name: "PlayStation",
    slug: "playstation",
    icon: "🎮",
    description: "PSN, PS Plus, PS Stars",
    gradient: "gradient-playstation",
    glow: "glow-playstation",
    border: "border-playstation",
    count: "12 cartes",
  },
  {
    name: "Xbox",
    slug: "xbox",
    icon: "🎯",
    description: "Xbox Live, Game Pass",
    gradient: "gradient-xbox",
    glow: "glow-xbox",
    border: "border-xbox",
    count: "8 cartes",
  },
  {
    name: "Nintendo",
    slug: "nintendo",
    icon: "🍄",
    description: "eShop, NSO",
    gradient: "gradient-nintendo",
    glow: "glow-nintendo",
    border: "border-nintendo",
    count: "6 cartes",
  },
  {
    name: "Apple",
    slug: "apple",
    icon: "🍎",
    description: "iTunes, App Store",
    gradient: "gradient-apple",
    glow: "glow-apple",
    border: "border-apple",
    count: "5 cartes",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "Choisissez votre carte",
    description:
      "Parcourez notre catalogue et sélectionnez la carte et le montant souhaités.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Payez en toute sécurité",
    description:
      "Réglez avec Djamo, Moov Money, Wave ou carte bancaire. 100% sécurisé.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Recevez votre code",
    description:
      "Votre code est livré par email en moins de 2 minutes. Prêt à l'emploi !",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
];

const testimonials: Testimonial[] = [
  {
    name: "Kouamé A.",
    city: "Abidjan",
    avatar: "K",
    avatarColor: "bg-blue-500",
    rating: 5,
    text:
      "Incroyable ! J'ai reçu mon code PSN en moins d'une minute. Le paiement Djamo est super pratique. Je recommande à 100% !",
    product: "PSN 20€",
  },
  {
    name: "Fatou D.",
    city: "Bouaké",
    avatar: "F",
    avatarColor: "bg-purple-500",
    rating: 5,
    text:
      "Service rapide et fiable. J'ai acheté une carte iTunes pour mon fils, le code a fonctionné immédiatement. Merci BabiCard !",
    product: "iTunes 10€",
  },
  {
    name: "Yves K.",
    city: "Abidjan",
    avatar: "Y",
    avatarColor: "bg-green-500",
    rating: 5,
    text:
      "Le meilleur site pour acheter des cartes gaming en Côte d'Ivoire. Prix corrects et livraison ultra rapide. Mon go-to !",
    product: "Xbox 25€",
  },
];

const stats = [
  { value: "1 200+", label: "Clients satisfaits" },
  { value: "< 2 min", label: "Délai de livraison" },
  { value: "100%", label: "Codes authentiques" },
  { value: "24/7", label: "Support disponible" },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [animating, setAnimating] = useState(false);

  const product = heroProducts[current];

  const goNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % heroProducts.length);
      setAnimating(false);
    }, 300);
  }, [animating]);

  const goPrev = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + heroProducts.length) % heroProducts.length);
      setAnimating(false);
    }, 300);
  }, [animating]);

  useEffect(() => {
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext]);

  const amountOptions = product.amounts;
  const selectedAmountIndex =
    selectedAmount >= 0 && selectedAmount < amountOptions.length ? selectedAmount : 0;
  const amount = amountOptions[selectedAmountIndex] ?? amountOptions[0];

  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-mesh-animated" />
      <div className="absolute inset-0 -z-10 bg-grid opacity-50" />
      <div className="absolute inset-0 -z-10 hero-spotlight" />

      <div className="pointer-events-none absolute -left-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#7B2FFF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#00E5FF]/8 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className={`transition-all duration-300 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"}`}>
            <div className="mb-5 inline-flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${product.categoryColor} ${product.categoryTextColor}`}
              >
                <span>{product.icon}</span>
                <span>{product.category.toUpperCase()}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs font-medium text-[#00E5FF]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00E5FF]" />
                En stock
              </span>
            </div>

            <h1
              className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {product.name}
            </h1>

            <p className="mb-8 text-base leading-relaxed text-white/60 sm:text-lg">
              {product.description}
            </p>

            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                Choisissez un montant
              </p>
              <div className="flex flex-wrap gap-2">
                {amountOptions.map((amt, i) => (
                  <button
                    key={amt}
                    onClick={() => setSelectedAmount(i)}
                    className={`price-option rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all ${
                      selectedAmountIndex === i
                        ? "border-[#00E5FF]/50 bg-[#00E5FF]/15 text-[#00E5FF]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="font-bold">{amt}€</span>
                    <span className="ml-1.5 text-xs opacity-60">→ {toFCFA(amt)} FCFA</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/shop?category=${product.categorySlug}`}
                className="btn-press cta-neon group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] px-7 py-3.5 text-sm font-bold text-black transition-all hover:scale-105"
              >
                Acheter {amount}€
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Voir tout
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className={`relative transition-all duration-300 ${animating ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
              <div
                className={`relative overflow-hidden rounded-2xl border bg-[#1A1A28] p-8 shadow-2xl ${product.borderClass}`}
                style={{ width: 300, minHeight: 200 }}
              >
                <div className={`absolute inset-0 opacity-10 ${product.iconBg}`} />
                <div className={`relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${product.iconBg} shadow-xl`}>
                  <span className="text-4xl">{product.icon}</span>
                </div>
                <p className="relative text-sm text-white/70">
                  Carte {product.category} • livraison instantanée
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={goPrev}
                  aria-label="Produit précédent"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80 transition hover:bg-white/10"
                >
                  ←
                </button>
                <div className="flex gap-2">
                  {heroProducts.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Aller au produit ${idx + 1}`}
                      onClick={() => setCurrent(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        idx === current ? "bg-[#00E5FF]" : "bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={goNext}
                  aria-label="Produit suivant"
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/80 transition hover:bg-white/10"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className={`glass-card rounded-xl border p-5 ${feature.border} hover:translate-y-[-2px]`}
          >
            <div className={`mb-3 inline-flex rounded-lg p-2 ${feature.bg} ${feature.accent}`}>
              {feature.icon}
            </div>
            <h3 className="mb-1 text-sm font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-white/60">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Catégories</p>
          <h2 className="text-2xl font-bold text-white">Par plateforme</h2>
        </div>
        <Link href="/shop" className="text-sm font-medium text-[#00E5FF] hover:text-[#7B2FFF]">
          Voir tout
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className={`glass-card group rounded-xl border p-5 ${cat.border} ${cat.glow} transition hover:scale-[1.01]`}
          >
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl ${cat.gradient}`}>
              {cat.icon}
            </div>
            <h3 className="mb-1 font-semibold text-white">{cat.name}</h3>
            <p className="mb-2 text-sm text-white/60">{cat.description}</p>
            <p className="text-xs text-white/40">{cat.count}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Processus</p>
        <h2 className="text-2xl font-bold text-white">Comment ça marche</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.number} className="glass-card rounded-xl p-6">
            <p className="mb-3 text-xs font-bold tracking-wider text-[#00E5FF]">{step.number}</p>
            <div className="mb-4 text-[#00E5FF]">{step.icon}</div>
            <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
            <p className="text-sm leading-relaxed text-white/60">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Avis clients</p>
        <h2 className="text-2xl font-bold text-white">Ils nous font confiance</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <article key={t.name} className="testimonial-card rounded-xl p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${t.avatarColor}`}>
                {t.avatar}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/50">{t.city}</p>
              </div>
            </div>
            <div className="mb-3 flex gap-1">
              {stars.map((s) => (
                <span key={s} className={s <= t.rating ? "text-[#FFB800]" : "text-white/20"}>
                  ★
                </span>
              ))}
            </div>
            <p className="mb-3 text-sm leading-relaxed text-white/70">{t.text}</p>
            <p className="text-xs text-[#00E5FF]">{t.product}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card stat-item rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-white/55">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden bg-[#0A0A0F]">
      <HeroCarousel />
      <FeatureSection />
      <CategoriesSection />
      <StepsSection />
      <TestimonialsSection />
      <StatsSection />
    </main>
  );
}
