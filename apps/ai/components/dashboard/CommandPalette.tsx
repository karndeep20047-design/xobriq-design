"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Key, CreditCard, Settings, Search } from "lucide-react";

type PaletteItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
};

const ITEMS: PaletteItem[] = [
  { label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { label: "Developer - API & Integration", href: "/developer", Icon: Key, keywords: "api keys create key token workspace sandbox production developer portal" },
  { label: "Billing", href: "/billing", Icon: CreditCard, keywords: "invoice payment plan" },
  { label: "Settings", href: "/settings", Icon: Settings, keywords: "profile account" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = ITEMS.filter((item) => {
    const haystack = (item.label + " " + (item.keywords || "")).toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(item: PaletteItem) {
    router.push(item.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) go(filtered[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 pt-[15vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="glass-panel w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-enterprise-border px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-enterprise-fg-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page..."
            className="w-full bg-transparent text-sm text-enterprise-fg outline-none placeholder:text-enterprise-fg-subtle"
          />
          <kbd className="rounded border border-enterprise-border px-1.5 py-0.5 font-mono text-[10px] text-enterprise-fg-subtle">Esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-enterprise-fg-subtle">No matches</p>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.Icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => go(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors " +
                    (i === activeIndex
                      ? "bg-enterprise-primary/10 text-enterprise-primary"
                      : "text-enterprise-fg hover:bg-enterprise-bg-low")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
