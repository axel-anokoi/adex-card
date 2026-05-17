"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  notificationCount?: number;
  onMobileMenuToggle?: () => void;
}

const tabLabels: Record<string, { label: string; subtitle: string }> = {
  overview:   { label: "Dashboard",        subtitle: "Aperçu des performances" },
  stats:      { label: "Statistiques",     subtitle: "Analyses et graphiques" },
  purchases:  { label: "Commandes",        subtitle: "Historique des achats" },
  refunds:    { label: "Remboursements",   subtitle: "Gestion des remboursements" },
  discounts:  { label: "Codes Promo",      subtitle: "Gestion des promotions" },
  users:      { label: "Utilisateurs",     subtitle: "Gestion des clients" },
  audit:      { label: "Audit",            subtitle: "Historique des actions" },
  categorie:  { label: "Catégories",       subtitle: "Gestion des catégories" },
  produit:    { label: "Produits",         subtitle: "Gestion des produits" },
  code:       { label: "Codes",            subtitle: "Gestion des codes" },
  profil:     { label: "Mon Profil",       subtitle: "Paramètres du compte" },
};

export function AdminHeader({
  title,
  subtitle,
  notificationCount = 0,
  onMobileMenuToggle,
}: AdminHeaderProps) {
  const [searchOpen, setSearchOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [signingOut, setSigningOut]   = useState(false);
  const router = useRouter();
  const { user, profile } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayInfo = tabLabels[title] || { label: title, subtitle: subtitle || "" };
  const adminEmail = profile?.email || user?.email || "admin@AdexCard.ci";

  const iconBtn = (active: boolean) => ({
    background: active
      ? "color-mix(in srgb, var(--cyan) 12%, transparent)"
      : "color-mix(in srgb, var(--text) 5%, transparent)",
    border: `1px solid ${active ? "var(--border-cyan)" : "var(--border)"}`,
    color: active ? "var(--cyan)" : "var(--text-muted)",
  });

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Logout failed");
      }

      await createClient().auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      await createClient().auth.signOut();
    } finally {
      setProfileOpen(false);
      router.replace("/");
      router.refresh();
      setSigningOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b px-3 md:px-6"
      style={{
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Left: Hamburger (mobile) + Title */}
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        {/* Mobile hamburger */}
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all md:hidden"
            style={iconBtn(false)}
            aria-label="Ouvrir le menu"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="min-w-0">
          <h1
            className="truncate text-base font-bold md:text-xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            {displayInfo.label}
          </h1>
          <p className="hidden truncate text-xs md:block" style={{ color: "var(--text-muted)" }}>
            {displayInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-3">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            style={iconBtn(searchOpen)}
            aria-label="Rechercher"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {searchOpen && (
            <div
              className="dropdown-anim absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl p-2 md:w-72"
              style={{
                background: "color-mix(in srgb, var(--bg2) 97%, transparent)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <input
                type="text"
                placeholder="Rechercher..."
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: "color-mix(in srgb, var(--bg) 70%, transparent)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={iconBtn(false)}>
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            style={iconBtn(notifOpen)}
            aria-label="Notifications"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: "var(--pink)", color: "white", boxShadow: "0 0 8px var(--pink-glow)" }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="dropdown-anim absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl md:w-80"
              style={{
                background: "color-mix(in srgb, var(--bg2) 97%, transparent)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
                <p className="font-medium" style={{ color: "var(--text)" }}>Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                <p className="p-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  Aucune notification
                </p>
              </div>
              <div className="border-t p-2" style={{ borderColor: "var(--border)" }}>
                <Link
                  href="/admin"
                  className="block rounded-lg p-2 text-center text-sm transition-all"
                  style={{ color: "var(--cyan)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cyan-dim)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Voir tout
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 rounded-lg p-1.5 transition-all"
            style={{
              background: profileOpen ? "var(--cyan-dim)" : "transparent",
              border: `1px solid ${profileOpen ? "var(--border-cyan)" : "transparent"}`,
            }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg md:h-8 md:w-8"
              style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))" }}
            >
              <span className="text-xs font-bold text-black">A</span>
            </div>
            <svg
              className={`hidden h-3 w-3 transition-transform duration-200 md:block ${profileOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "var(--text-muted)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div
              className="dropdown-anim absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl md:w-56"
              style={{
                background: "color-mix(in srgb, var(--bg2) 97%, transparent)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <div className="border-b p-3" style={{ borderColor: "var(--border)" }}>
                <p className="font-medium" style={{ color: "var(--text)" }}>Administrateur</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{adminEmail}</p>
              </div>
              <div className="p-1.5">
                {[
                  { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Mon Profil" },
                  { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Paramètres" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--text) 6%, transparent)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
                <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                  style={{ color: "var(--pink)", cursor: signingOut ? "wait" : "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--pink) 10%, transparent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
