"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, Ban, ShieldCheck, HelpCircle } from "lucide-react";
import { requestProductionAccessAction } from "./actions";
import type { ProductionAccessDetail, ProductionReadinessItem } from "@/lib/product-access";
import type { DeveloperProductConfig } from "../../product-config";

const STATUS_META: Record<
  ProductionAccessDetail["status"],
  { label: string; tone: string; Icon: typeof ShieldCheck }
> = {
  not_requested: { label: "Not requested", tone: "bg-fg-subtle/10 text-fg-subtle", Icon: Circle },
  pending: { label: "Under review", tone: "bg-amber-500/10 text-amber-400", Icon: Clock },
  more_information_required: { label: "More information required", tone: "bg-amber-500/10 text-amber-400", Icon: HelpCircle },
  approved: { label: "Approved", tone: "bg-emerald-500/10 text-emerald-400", Icon: CheckCircle2 },
  rejected: { label: "Not approved", tone: "bg-red-500/10 text-red-400", Icon: AlertTriangle },
  suspended: { label: "Suspended", tone: "bg-red-500/10 text-red-400", Icon: Ban },
};

const REQUESTABLE = new Set(["not_requested", "rejected", "more_information_required"]);

export function ProductionAccessContent({
  config,
  organizationName,
  detail,
  readiness,
}: {
  config: DeveloperProductConfig;
  organizationName: string;
  detail: ProductionAccessDetail;
  readiness: ProductionReadinessItem[];
}) {
  const [status, setStatus] = useState(detail.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const meta = STATUS_META[status];

  function handleRequest() {
    setError(null);
    startTransition(async () => {
      const result = await requestProductionAccessAction(config.slug);
      if (result.ok) setStatus("pending");
      else setError(result.error || "Failed to submit request.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Production Access</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {organizationName}&apos;s Production access status for {config.name}. Sandbox access is unaffected by
          anything on this page — Sandbox keys keep working regardless of Production status.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-subtle p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold " + meta.tone}>
            <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
          </span>
          {detail.requestedAt && (status === "pending" || status === "more_information_required") ? (
            <span className="text-xs text-fg-subtle">Requested {new Date(detail.requestedAt).toLocaleString("en-KE")}</span>
          ) : null}
          {detail.reviewedAt && (status === "approved" || status === "rejected") ? (
            <span className="text-xs text-fg-subtle">
              {status === "approved" ? "Approved" : "Reviewed"} {new Date(detail.reviewedAt).toLocaleString("en-KE")}
            </span>
          ) : null}
        </div>

        <div className="mt-4 text-sm">
          <StatusBody status={status} clientMessage={detail.clientMessage} />
        </div>

        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

        <div className="mt-4">
          {REQUESTABLE.has(status) ? (
            <button
              type="button"
              onClick={handleRequest}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
            >
              {isPending ? "Submitting…" : status === "not_requested" ? "Request Production Access" : "Resubmit Request"}
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Production readiness checklist</h3>
        <p className="mt-1 text-xs text-fg-muted">
          Items marked &quot;confirmed during review&quot; aren&apos;t tracked automatically yet — Xobriq staff verify
          these directly with your team as part of the review.
        </p>
        <div className="mt-3 space-y-2">
          {readiness.map((item) => (
            <div key={item.key} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-subtle px-3 py-2.5">
              {item.manualReview ? (
                <HelpCircle className="h-4 w-4 shrink-0 text-fg-subtle" />
              ) : item.complete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-fg-subtle" />
              )}
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
                {item.manualReview ? "Confirmed during review" : item.complete ? "Complete" : "Not yet"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBody({ status, clientMessage }: { status: ProductionAccessDetail["status"]; clientMessage: string | null }) {
  switch (status) {
    case "not_requested":
      return <p className="text-fg-muted">Production access has not been requested for this product yet.</p>;
    case "pending":
      return <p className="text-fg-muted">Your request is under review. We&apos;ll notify you once it&apos;s been actioned.</p>;
    case "more_information_required":
      return (
        <div className="space-y-2">
          <p className="text-fg-muted">Additional information is required before this request can proceed.</p>
          {clientMessage ? (
            <p className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-500">{clientMessage}</p>
          ) : null}
        </div>
      );
    case "approved":
      return <p className="text-fg-muted">Production access is approved — you can generate a Production API key from the API Keys tab.</p>;
    case "rejected":
      return (
        <div className="space-y-2">
          <p className="text-fg-muted">Production access was not approved.</p>
          {clientMessage ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/5 p-2.5 text-xs text-red-400">{clientMessage}</p>
          ) : null}
        </div>
      );
    case "suspended":
      return (
        <div className="space-y-2">
          <p className="text-fg-muted">
            Production access is suspended. Existing Production API keys will be rejected and no new Production key
            can be generated until this is resolved.
          </p>
          <p className="rounded-md border border-red-500/20 bg-red-500/5 p-2.5 text-xs text-red-400">
            {clientMessage || "Contact your Xobriq account representative for details."}
          </p>
        </div>
      );
  }
}
