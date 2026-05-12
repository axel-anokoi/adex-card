"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", color: "text-blue-400" },
  { slug: "xbox", name: "Xbox", icon: "🎯", color: "text-green-400" },
  { slug: "nintendo", name: "Nintendo", icon: "🍄", color: "text-red-400" },
  { slug: "apple", name: "Apple", icon: "🍎", color: "text-gray-300" },
];

const navLinks = [
  { href: "/shop", label: "Boutique" },
  { href: "/dashboard", label: "Mon compte" },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [cartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#0A0A0F]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#7B2FFF] shadow-lg shadow-[#00E5FF]/20 transition-all group-hover:shadow-[#00E5FF]/40">
            <span className="text-sm font-black text-black">B</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-[#00E5FF]"
            style={{ fontFamily: "var(--font-display)" }}>
            BabiCard<span className="text-[#00E5FF]">.ci</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">

          {/* Catégories dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-white/60 transition-all hover:bg-white/5 hover:text-white ${
                isCategoriesOpen ? "bg-white/5 text-white" : ""
              }`}
            >
              Catégories
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCategoriesOpen && (
              <div className="dropdown-menu absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#12121A]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="p-1.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setIsCategoriesOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className={cat.color}>{cat.name}</span>
                    </Link>
                  ))}
                  <div className="my-1 border-t border-white/5" />
                  <Link
                    href="/shop"
                    onClick={() => setIsCategoriesOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#00E5FF]/80 transition-all hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]"
                  >
                    <span className="text-base">🛍️</span>
                    <span>Toutes les cartes</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-white/60 transition-all hover:bg-white/5 hover:text-white ${
                pathname === link.href ? "bg-white/5 text-white" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Cart icon */}
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="badge-pulse absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5FF] text-[10px] font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Auth buttons */}
          <Link
            href="/login"
            className="btn-press rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="btn-press rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] px-4 py-2 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-[#00E5FF]/30 hover:scale-105"
          >
            S&apos;inscrire
          </Link>
        </div>

        {/* Mobile: cart + burger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00E5FF] text-[10px] font-bold text-black">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="flex flex-col gap-1.5 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="absolute left-0 right-0 top-16 flex flex-col border-b border-white/5 bg-[#0A0A0F]/98 backdrop-blur-xl px-4 py-4 md:hidden">
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest text-white/30">Catégories</p>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/60 transition-all hover:bg-white/5 hover:text-white"
            >
              <span>{cat.icon}</span>
              <span className={cat.color}>{cat.name}</span>
            </Link>
          ))}
          <div className="my-3 border-t border-white/5" />
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest text-white/30">Navigation</p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`rounded-lg px-4 py-3 text-white/60 transition-all hover:bg-white/5 hover:text-white ${
                pathname === link.href ? "bg-white/5 text-white" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] px-4 py-3 text-center text-sm font-bold text-black transition-all"
            >
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
