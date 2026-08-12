"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

type Tab = { href: string; label: string; active?: boolean };

const tabs: Tab[] = [
  { href: "/docs", label: "Documentation", active: true },
  { href: "/docs/playground", label: "Playground" },
  { href: "/docs/integrations", label: "Integrations" },
  { href: "/docs/cli", label: "CLI" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/models", label: "Models" },
  { href: "/docs/release-notes", label: "Release notes" },
];

export function DocsTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/xobriq-logo.png"
            alt="Xobriq"
            width={180}
            height={45}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {tabs.map((tab) => {
            const tabClass = tab.active
              ? "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-fg"
              : "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:bg-bg-subtle hover:text-fg";
            return (
              <Link key={tab.href} href={tab.href} className={tabClass}>{tab.label}</Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm xl:flex">
            <Search className="h-3.5 w-3.5 text-fg-subtle" />
            <input placeholder="Search Documentation" className="w-48 bg-transparent text-sm focus:outline-none" aria-label="Search docs" />
            <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-fg-subtle">⌘K</kbd>
          </div>

          <button
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-bg-subtle xl:hidden"
          >
            <Search className="h-4 w-4 text-fg-muted" />
          </button>

          <Link href="/dashboard" className="hidden items-center rounded-md bg-enterprise-primary px-3 py-1.5 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover sm:inline-flex">Console</Link>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-bg-subtle lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-border bg-bg-subtle lg:hidden">
          <nav className="grid gap-1 px-5 py-4 sm:px-6">
            {tabs.map((tab) => {
              const tabClass = tab.active
                ? "rounded-md bg-enterprise-primary/10 px-3 py-2 text-sm font-semibold text-enterprise-primary"
                : "rounded-md px-3 py-2 text-sm font-medium text-fg-muted hover:bg-bg-elevated hover:text-fg";
              return (
                <Link key={tab.href} href={tab.href} className={tabClass} onClick={() => setMenuOpen(false)}>{tab.label}</Link>
              );
            })}
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-md bg-enterprise-primary px-3 py-2 text-sm font-semibold text-enterprise-on-primary sm:hidden">Open Console</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}