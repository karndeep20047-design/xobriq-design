"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Fingerprint, ShieldAlert, Clock, CircleDot } from "lucide-react";
import { requestProductAccessAction } from "@/app/(platform)/actions";
import type { ProductAccessStatus } from "@/lib/product-access";
import type { DeveloperProductConfig } from "./product-config";

const PRODUCT_ICON = { kyc: Fingerprint, guard: ShieldAlert } as const;

const ACCESS_BADGE: Record<ProductAccessStatus, { label: string; className: string }> = {
  approved: { label: "Access approved", className: "bg-emerald-500/10 text-emerald-400" },
  pending: { label: "Request pending", className: "bg-amber-500/10 text-amber-400" },
  denied: { label: "Request denied", className: "bg-red-500/10 text-red-400" },
  none: { label: "Not requested", className: "bg-fg-subtle/10 text-fg-subtle" },
};

export function ProductHubCard({
  config,
  accessStatus,
  sandboxKeyCount,
  productionKeyCount,
}: {
  config: DeveloperProductConfig;
  accessStatus: ProductAccessStatus;
  sandboxKeyCount?: number;
  productionKeyCount?: number;
}) {
  const [localStatus, setLocalStatus] = useState(accessStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const Icon = PRODUCT_ICON[config.slug];
  const badge = ACCESS_BADGE[localStatus];

  function handleRequest() {
    setError(null);
    startTransition(async () => {
      const result = await requestProductAccessAction(config.slug);
      if (result.ok) setLocalStatus("pending");
      else setError(result.error || "Failed to submit request.");
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-bg-subtle p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-enterprise-primary/10 text-enterprise-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{config.name}</h2>
            <p className="text-xs text-fg-muted">{config.tagline}</p>
          </div>
        </div>
        {config.comingSoon ? (
          <span className="shrink-0 rounded-full bg-fg-subtle/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
            Coming Soon
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-fg-muted">{config.description}</p>

      {!config.comingSoon ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-bg p-3">
            <p className="text-lg font-bold tabular-nums">{sandboxKeyCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Sandbox keys</p>
          </div>
          <div className="rounded-lg border border-border bg-bg p-3">
            <p className="text-lg font-bold tabular-nums">{productionKeyCount ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-subtle">Production keys</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
        <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold " + badge.className}>
          <CircleDot className="h-2.5 w-2.5" /> {badge.label}
        </span>
      </div>

      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

      <div className="mt-4">
        {config.comingSoon ? (
          localStatus === "none" || localStatus === "denied" ? (
            <button
              type="button"
              onClick={handleRequest}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium hover:bg-bg-elevated disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Request Access"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-fg-subtle">
              <Clock className="h-3.5 w-3.5" /> We&apos;ll notify you when Guard&apos;s API ships.
            </span>
          )
        ) : (
          <Link
            href={`/developer/${config.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
          >
            Open {config.name} Workspace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
