"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsTopbar } from "@/components/docs/DocsTopbar";

type Nav = { href: string; label: string };

type DocShellProps = {
  section: string;
  title: string;
  intro?: string;
  prev?: Nav;
  next?: Nav;
  children: React.ReactNode;
};

export function DocShell(props: DocShellProps) {
  const { section, title, intro, prev, next, children } = props;
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <DocsTopbar />
      <div className="flex flex-1">
        <DocsSidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
            <p className="text-sm font-medium text-enterprise-primary">{section}</p>
            <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-fg-muted hover:bg-bg-elevated">
                <Copy className="h-4 w-4" /> Copy page
              </button>
            </div>
            {intro ? <p className="mt-4 text-base leading-7 text-fg-muted">{intro}</p> : null}

            <div className="doc-content mt-10 space-y-6">{children}</div>

            <div className="mt-16 flex items-center justify-between border-t border-border pt-8 text-sm">
              {prev ? (<Link href={prev.href} className="font-medium text-fg-muted hover:text-fg">← {prev.label}</Link>) : <span></span>}
              {next ? (<Link href={next.href} className="font-medium text-enterprise-primary hover:underline">{next.label} →</Link>) : <span></span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-2xl font-bold tracking-tight">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-7 text-fg-muted">{children}</p>;
}

export function Code({ children, lang }: { children: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-bg-elevated p-5 font-mono text-xs leading-7 text-fg sm:text-sm">
      {lang ? <div className="mb-2 text-[10px] uppercase tracking-wider text-fg-subtle">{lang}</div> : null}
      {children}
    </pre>
  );
}

export function Callout({ title, children, kind = "info" }: { title: string; children: React.ReactNode; kind?: "info" | "warn" | "success" }) {
  const cls = kind === "warn"
    ? "border-l-4 border-l-enterprise-accent bg-enterprise-accent/5"
    : kind === "success"
    ? "border-l-4 border-l-enterprise-primary bg-enterprise-primary/5"
    : "border-l-4 border-l-enterprise-primary bg-bg-subtle";
  return (
    <div className={"rounded-r-lg p-4 " + cls}>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 text-sm leading-6 text-fg-muted">{children}</div>
    </div>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="ml-6 list-disc space-y-2 text-fg-muted">
      {items.map((i) => <li key={i}>{i}</li>)}
    </ul>
  );
}