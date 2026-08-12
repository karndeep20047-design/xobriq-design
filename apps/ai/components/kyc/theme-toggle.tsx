"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/shared/ThemeProvider";

// Shares the whole app's single ThemeProvider/toggle instead of bringing its
// own (apps/kyc used to have its own theme.ts + separate localStorage key —
// dropped on migration since both toggled the same <html class="dark">
// element and would otherwise fight over it once merged into one document).
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
