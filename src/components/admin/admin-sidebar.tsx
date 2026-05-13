"use client";

import { useState } from "react";

type SidebarItem = {
  id: string;
  label: string;
  icon: string;
};

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "⚡" },
  { id: "categorie", label: "Catégorie", icon: "🎮" },
  { id: "produit", label: "Produit", icon: "🎁" },
  { id: "code", label: "Code", icon: "🔑" },
  { id: "client", label: "Client", icon: "👥" },
  { id: "publicite", label: "Publicité", icon: "📢" },
  { id: "paiement", label: "Paiement", icon: "💳" },
];

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ activeTab = "dashboard", onTabChange, isOpen, onClose }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (itemId: string) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(145deg, #000d2e, #002870)",
              boxShadow: "0 0 20px rgba(0,112,204,0.4), inset 0 0 10px rgba(0,112,204,0.1)",
              border: "1px solid rgba(0,112,204,0.3)",
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
                letterSpacing: "-0.5px"
              }}
            >
              BabiCard
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id || 
              (item.id === "dashboard" && activeTab === "overview");
            
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="admin-sidebar-item group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  cursor: "none",
                  background: isActive 
                    ? "linear-gradient(135deg, rgba(0,255,224,0.08), rgba(123,47,255,0.08))" 
                    : "transparent",
                  border: `1px solid ${isActive ? "rgba(0,255,224,0.25)" : "transparent"}`,
                  color: isActive ? "var(--cyan)" : "var(--text-muted)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Glow effect for active item */}
                {isActive && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(circle at 30% 50%, rgba(0,255,224,0.1) 0%, transparent 60%)",
                    }}
                  />
                )}
                <span className="text-xl relative z-10" style={{ 
                  filter: isActive ? "drop-shadow(0 0 8px rgba(0,255,224,0.5))" : "none",
                  animation: isActive ? "adminIconPulse 2s ease-in-out infinite" : "none",
                }}>{item.icon}</span>
                <span 
                  className="font-medium relative z-10"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span 
                    className="ml-auto h-2 w-2 rounded-full relative z-10"
                    style={{ 
                      background: "var(--cyan)", 
                      boxShadow: "0 0 12px var(--cyan-glow)",
                      animation: "dotPulse 1.5s ease-in-out infinite"
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section - Admin info */}
      <div 
        className="border-t p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, var(--cyan), var(--violet))",
              boxShadow: "0 0 15px var(--cyan-glow)",
            }}
          >
            <span className="text-sm font-bold text-black">A</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
              Administrateur
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
      {/* Desktop Sidebar */}
      <aside
        id="admin-sidebar"
        className="fixed left-0 top-16 bottom-0 w-64 flex-col overflow-hidden border-r hidden md:flex"
        style={{
          background: "linear-gradient(180deg, rgba(10,10,18,0.95) 0%, rgba(18,18,30,0.92) 100%)",
          borderColor: "rgba(0,255,224,0.08)",
          backdropFilter: "blur(20px)",
          display: "flex",
          zIndex: 30,
        }}
      >
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          zIndex: 0,
        }} />
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 flex-col overflow-hidden border-r transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(10,10,18,0.98) 0%, rgba(18,18,30,0.95) 100%)",
          borderColor: "rgba(0,255,224,0.08)",
          display: "flex",
          zIndex: 50,
          marginTop: "64px",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-xl md:hidden"
        style={{
          background: "linear-gradient(145deg, #000d2e, #002870)",
          boxShadow: "0 0 25px rgba(0,112,204,0.5), inset 0 0 15px rgba(0,112,204,0.15)",
          border: "1px solid rgba(0,112,204,0.4)",
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        <svg className="h-5 w-5" style={{ color: "var(--cyan)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <style>{`
        @keyframes adminIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .admin-sidebar-item:hover {
          background: linear-gradient(135deg, rgba(0,255,224,0.04), rgba(123,47,255,0.04)) !important;
          border-color: rgba(0,255,224,0.15) !important;
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
}
