"use client";

import { useTheme } from "./ThemeProvider";
import { ThemeToggleButton2 } from "@/components/ui/theme-toggle-buttons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <ThemeToggleButton2
      isDark={isDark}
      onToggle={toggleTheme}
      className={`size-10 p-2 ${className}`}
    />
  );
}