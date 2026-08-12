"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { DEVELOPER_PRODUCTS, DEVELOPER_TAB_LABELS, type DeveloperProductConfig } from "../product-config";

export function WorkspaceHeader({ config }: { config: DeveloperProductConfig }) {
  const pathname = usePathname();

  return (
    <div>
      <Link href="/developer" className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Developer Platform
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{config.name}</h1>
            {config.comingSoon ? (
              <span className="rounded-full bg-fg-subtle/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Coming Soon
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-fg-muted">{config.tagline}</p>
        </div>

        <ProductSwitcher current={config.slug} />
      </div>

      <nav className="mt-6 flex gap-1 border-b border-border">
        {config.tabs.map((tab) => {
          const href = `/developer/${config.slug}/${tab}`;
          const active = pathname === href;
          return (
            <Link
              key={tab}
              href={href}
              className={
                "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors " +
                (active
                  ? "border-enterprise-primary text-enterprise-primary"
                  : "border-transparent text-fg-muted hover:text-fg")
              }
            >
              {DEVELOPER_TAB_LABELS[tab]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function ProductSwitcher({ current }: { current: keyof typeof DEVELOPER_PRODUCTS }) {
  const products = Object.values(DEVELOPER_PRODUCTS);
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-medium hover:bg-bg-elevated"
      >
        Product: {DEVELOPER_PRODUCTS[current].name}
        <ChevronDown className="h-3.5 w-3.5 text-fg-subtle" />
      </button>
      <div className="invisible absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-bg-elevated py-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/developer/${p.slug}`}
            className={
              "block px-3 py-2 text-sm hover:bg-bg-subtle " +
              (p.slug === current ? "font-semibold text-enterprise-primary" : "text-fg")
            }
          >
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
