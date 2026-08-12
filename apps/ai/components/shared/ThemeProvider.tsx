// ============================================================================
//  Xobriq.ai — Theme Provider
//  ---------------------------------------------------------------------------
//  - Provides light/dark mode context to the entire app
//  - Persists user choice in localStorage ("xobriq-theme")
//  - Respects OS-level preference on first visit
//  - IMPORTANT: Always renders <ThemeContext.Provider> (even pre-mount)
//    so that useTheme() never throws during SSR/CSR hydration.
// ============================================================================

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// ----------------------------------------------------------------------------
//  Types
// ----------------------------------------------------------------------------
type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

// ----------------------------------------------------------------------------
//  Default context value — prevents "must be used inside Provider" errors
//  during the brief window before the provider mounts on the client.
// ----------------------------------------------------------------------------
const defaultContext: ThemeContextType = {
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

// ============================================================================
//  ThemeProvider
// ============================================================================
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazily detect initial theme from localStorage, DOM class, or OS preference on client
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("xobriq-theme") as Theme | null;
        if (stored === "light" || stored === "dark") return stored;
        if (document.documentElement.classList.contains("dark")) return "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } catch {
        return "light";
      }
    }
    return "light";
  });

  useEffect(() => {
    let initial = theme;

    try {
      const stored = localStorage.getItem("xobriq-theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        initial = stored;
      } else {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        initial = media.matches ? "dark" : "light";

        // Listen for OS system theme changes if user hasn't set a manual override
        const listener = (e: MediaQueryListEvent) => {
          if (!localStorage.getItem("xobriq-theme")) {
            const newTheme = e.matches ? "dark" : "light";
            setThemeState(newTheme);
            document.documentElement.classList.toggle("dark", e.matches);
          }
        };
        media.addEventListener("change", listener);
        document.documentElement.classList.toggle("dark", initial === "dark");
        return () => media.removeEventListener("change", listener);
      }
    } catch {
      // ignore
    }

    document.documentElement.classList.toggle("dark", initial === "dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Public setter — updates DOM class instantly (0ms) without style recalculation freeze
  const setTheme: ThemeContextType["setTheme"] = (t) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("theme-transitioning");
      root.classList.toggle("dark", t === "dark");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          root.classList.remove("theme-transitioning");
        });
      });
    }

    setThemeState(t);

    try {
      localStorage.setItem("xobriq-theme", t);
    } catch {
      // ignore if localStorage is blocked
    }
  };

  // Convenience toggle
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // ✅ ALWAYS render Provider — never return bare children
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
//  Hook — useTheme()
// ============================================================================
export function useTheme() {
  return useContext(ThemeContext);
}