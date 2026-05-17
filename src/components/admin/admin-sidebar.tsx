"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
};

const sidebarItems: SidebarItem[] = [
  { id: "dashboard",  label: "Dashboard",  icon: "⚡" },
  { id: "stats",      label: "Stats",       icon: "📊" },
  { id: "categorie",  label: "Catégorie",   icon: "🎮" },
  { id: "produit",    label: "Produit",     icon: "🎁" },
  { id: "code",       label: "Code",        icon: "🔑" },
  { id: "client",     label: "Client",      icon: "👥" },
  { id: "publicite",  label: "Publicité",   icon: "📢" },
  { id: "paiement",   label: "Paiement",    icon: "💳" },
  { id: "profil",     label: "Mon profil",  icon: "👤" },
];

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export function AdminSidebar({
  activeTab = "dashboard",
  onTabChange,
  isOpen,
  onClose,
  onToggle,
}: AdminSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { profile } = useAuth();
  const adminName = [profile?.prenoms, profile?.nom].filter(Boolean).join(" ") || profile?.email?.split("@")[0] || "Administrateur";
  const initials   = [profile?.prenoms?.[0], profile?.nom?.[0]].filter(Boolean).join("").toUpperCase() || "A";

  // Controlled if isOpen prop is provided, else use internal state
  const mobileOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((prev) => !prev);
  };

  const handleClick = (itemId: string) => {
    if (onTabChange) onTabChange(itemId);
    if (window.innerWidth < 768) handleClose();
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(145deg, var(--bg3), color-mix(in srgb, var(--cyan) 20%, var(--bg3)))",
              boxShadow: "0 0 20px var(--cyan-glow)",
              border: "1px solid var(--border-cyan)",
            }}
          >
            <span className="text-lg">🎮</span>
          </div>
          <div>
            <p
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text)",
                letterSpacing: "-0.5px",
              }}
            >
              AdexCard
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              activeTab === item.id ||
              (item.id === "dashboard" && activeTab === "overview");

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="admin-sidebar-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: isActive ? "var(--cyan-dim)" : "transparent",
                  border: `1px solid ${isActive ? "var(--border-cyan)" : "transparent"}`,
                  color: isActive ? "var(--cyan)" : "var(--text-muted)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isActive && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 50%, var(--cyan-dim) 0%, transparent 60%)",
                    }}
                  />
                )}
                <span
                  className="relative z-10 text-xl"
                  style={{
                    filter: isActive ? "drop-shadow(0 0 8px var(--cyan-glow))" : "none",
                    animation: isActive ? "adminIconPulse 2s ease-in-out infinite" : "none",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  className="relative z-10 font-medium"
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="relative z-10 ml-auto h-2 w-2 rounded-full"
                    style={{
                      background: "var(--cyan)",
                      boxShadow: "0 0 12px var(--cyan-glow)",
                      animation: "dotPulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section - Admin info */}
      <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--cyan), var(--violet))",
              boxShadow: "0 0 15px var(--cyan-glow)",
            }}
          >
            <span className="text-sm font-bold text-black">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
              {adminName}
            </p>
            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
              Panel Admin
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar — full height, no display conflict */}
      <aside
        id="admin-sidebar"
        className="fixed bottom-0 left-0 top-0 hidden w-64 flex-col overflow-hidden border-r md:flex"
        style={{
          background: "linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)",
          borderColor: "var(--border-cyan)",
          backdropFilter: "blur(20px)",
          zIndex: 30,
        }}
      >
        {/* Subtle scanline effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
          }}
        />
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col overflow-hidden border-r transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)",
          borderColor: "var(--border-cyan)",
        }}
      >
        {/* Close button inside mobile sidebar */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all"
          style={{
            color: "var(--text-muted)",
            background: "var(--cyan-dim)",
            border: "1px solid var(--border-cyan)",
          }}
          aria-label="Fermer le menu"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile Toggle Button (fallback if header has no hamburger) */}
      {onToggle === undefined && onClose === undefined && (
        <button
          className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-xl md:hidden"
          style={{
            background: "linear-gradient(145deg, var(--bg3), color-mix(in srgb, var(--cyan) 15%, var(--bg3)))",
            boxShadow: "0 0 25px var(--cyan-glow)",
            border: "1px solid var(--border-cyan)",
          }}
          onClick={handleToggle}
          aria-label="Menu"
        >
          <svg
            className="h-5 w-5"
            style={{ color: "var(--cyan)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <style>{`
        @keyframes adminIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .admin-sidebar-item:hover {
          background: var(--cyan-dim) !important;
          border-color: var(--border-cyan) !important;
          transform: translateX(4px);
          color: var(--text) !important;
        }
      `}</style>
    </>
  );
}
