"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Shared building blocks for the Quick Start and API Reference tabs —
// extracted from the old single-page IntegrationGuide.tsx so both tabs
// render the same look without duplicating the CodeBlock/Field/Section
// markup twice.

export function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-lg border border-border bg-bg">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-bg-subtle px-2 py-1 text-[11px] font-medium text-fg-muted hover:text-fg"
        aria-label={`Copy ${lang}`}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-3 pr-16 font-mono text-[11px] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Field({
  name,
  type,
  required,
  notes,
}: {
  name: string;
  type: string;
  required?: boolean;
  notes: string;
}) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-xs text-fg">{name}</td>
      <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-xs text-fg-subtle">{type}</td>
      <td className="whitespace-nowrap py-2 pr-4 align-top text-xs">
        {required ? (
          <span className="rounded-full bg-enterprise-primary/10 px-2 py-0.5 font-semibold text-enterprise-primary">
            required
          </span>
        ) : (
          <span className="text-fg-subtle">optional</span>
        )}
      </td>
      <td className="py-2 align-top text-xs text-fg-muted">{notes}</td>
    </tr>
  );
}

export function FieldTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-bg-subtle text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            <th className="py-2 pl-3 pr-4">Field</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">&nbsp;</th>
            <th className="py-2 pr-3">Notes</th>
          </tr>
        </thead>
        <tbody className="px-3">{children}</tbody>
      </table>
    </div>
  );
}

export function Section({
  step,
  title,
  children,
}: {
  step?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle p-5">
      <div className="flex items-center gap-2">
        {step ? (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-enterprise-primary text-[11px] font-bold text-enterprise-on-primary">
            {step}
          </span>
        ) : null}
        <h4 className="text-sm font-semibold text-fg">{title}</h4>
      </div>
      <div className="mt-3 space-y-3 text-sm text-fg-muted">{children}</div>
    </div>
  );
}

export type VerificationKind = "identity" | "phone" | "business";

export const KIND_META: Record<VerificationKind, { label: string; short: string; endpoint: string }> = {
  identity: { label: "National ID (Identity)", short: "National ID", endpoint: "verify-identity" },
  phone: { label: "Telephone (Phone)", short: "Telephone", endpoint: "verify-phone" },
  business: { label: "Business (KYB)", short: "KYB", endpoint: "verify-business" },
};

export function KindTabs({ kind, onChange }: { kind: VerificationKind; onChange: (k: VerificationKind) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-subtle p-1">
      {(Object.keys(KIND_META) as VerificationKind[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
            (kind === k ? "bg-enterprise-primary text-enterprise-on-primary" : "text-fg-muted hover:text-fg")
          }
        >
          {KIND_META[k].short}
        </button>
      ))}
    </div>
  );
}

export function EndpointHeading({ kind, baseUrl }: { kind: VerificationKind; baseUrl: string }) {
  const meta = KIND_META[kind];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs font-bold text-emerald-400">POST</span>
      <code className="font-mono text-xs text-fg">
        {baseUrl}/api/v1/kyc/{meta.endpoint}
      </code>
    </div>
  );
}
