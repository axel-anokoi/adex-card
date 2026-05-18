"use client";

import { useState } from "react";

type Theme = "dark" | "light";

function getThemeFromDomOrStorage(): Theme {
  if (typeof window === "undefined") return "dark";

  const root = document.documentElement;
  if (root.classList.contains("light")) return "light";
  if (root.classList.contains("dark")) return "dark";

  const saved = localStorage.getItem("theme");
  return saved === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getThemeFromDomOrStorage());

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--text) 6%, transparent)",
        color: "var(--text-muted)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "color-mix(in srgb, var(--text) 10%, transparent)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "color-mix(in srgb, var(--text) 6%, transparent)";
        e.currentTarget.style.color = "var(--text-muted)";
      }}
    >
      <span className="text-sm" aria-hidden>
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
