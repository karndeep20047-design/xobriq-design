"use client";

import { useState, useTransition } from "react";
import { Check, X, Clock, HelpCircle, Ban } from "lucide-react";
import {
  approveProductAccessAction,
  denyProductAccessAction,
  approveProductionAccessAction,
  rejectProductionAccessAction,
  requestMoreProductionInfoAction,
  suspendProductionAccessAction,
} from "./actions";

type ProductionStatus = "not_requested" | "pending" | "more_information_required" | "approved" | "rejected" | "suspended";

type Request = {
  id: string;
  organization_id: string;
  organization_name: string;
  product_slug: string;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  reviewed_at: string | null;
  notes: string | null;
  production_status: ProductionStatus;
  production_requested_at: string | null;
  production_reviewed_at: string | null;
  production_client_message: string | null;
  production_review_notes: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  denied: "bg-red-500/10 text-red-400",
};

const PRODUCTION_STYLES: Record<ProductionStatus, string> = {
  not_requested: "bg-fg-subtle/10 text-fg-subtle",
  pending: "bg-amber-500/10 text-amber-400",
  more_information_required: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  suspended: "bg-red-500/10 text-red-400",
};

const FILTERS = ["all", "pending", "approved", "denied"] as const;
const PRODUCTION_FILTERS = ["actionable", "all"] as const;
const PRODUCTION_ACTIONABLE = new Set<ProductionStatus>(["pending", "more_information_required", "approved"]);

export function ProductAccessClient({ requests }: { requests: Request[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const [productionFilter, setProductionFilter] = useState<(typeof PRODUCTION_FILTERS)[number]>("actionable");
  const productionRequests = requests.filter((r) => r.production_status !== "not_requested");
  const visibleProduction =
    productionFilter === "all" ? productionRequests : productionRequests.filter((r) => PRODUCTION_ACTIONABLE.has(r.production_status));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-enterprise-accent">Product Enablement</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Product Access Requests</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Clients request access to a product from their dashboard — approve or deny it here.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition " +
              (filter === f
                ? "bg-enterprise-primary text-enterprise-on-primary"
                : "border border-border bg-bg-subtle text-fg-muted hover:text-fg")
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-fg-muted">No requests here.</div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((r) => <RequestRow key={r.id} request={r} />)}
          </div>
        )}
      </div>

      <div className="mb-4 mt-10">
        <h2 className="text-xl font-bold tracking-tight">Production Access Requests</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Separate from the general/Sandbox access above — a Production API key can&apos;t be generated or used
          until an organization is approved here, per product.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {PRODUCTION_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setProductionFilter(f)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition " +
              (productionFilter === f
                ? "bg-enterprise-primary text-enterprise-on-primary"
                : "border border-border bg-bg-subtle text-fg-muted hover:text-fg")
            }
          >
            {f === "actionable" ? "Needs attention" : "All"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
        {visibleProduction.length === 0 ? (
          <div className="p-10 text-center text-sm text-fg-muted">No production access requests here.</div>
        ) : (
          <div className="divide-y divide-border">
            {visibleProduction.map((r) => <ProductionRequestRow key={r.id} request={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestRow({ request }: { request: Request }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(request.status);

  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{request.organization_name}</p>
          <span className="rounded bg-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">
            {request.product_slug}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
          <Clock className="h-3 w-3" />
          Requested {new Date(request.requested_at).toLocaleString("en-KE")}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " + STATUS_STYLES[localStatus]}>
          {localStatus}
        </span>

        {localStatus === "pending" ? (
          <>
            <button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const r = await approveProductAccessAction(request.id);
                  if (r.ok) setLocalStatus("approved");
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const r = await denyProductAccessAction(request.id);
                  if (r.ok) setLocalStatus("denied");
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Deny
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const PRODUCTION_LABEL: Record<ProductionStatus, string> = {
  not_requested: "Not requested",
  pending: "Pending review",
  more_information_required: "More info requested",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

function ProductionRequestRow({ request }: { request: Request }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(request.production_status);
  const [message, setMessage] = useState(request.production_client_message);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onSuccess: () => void) {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) onSuccess();
      else setError(r.error || "Action failed.");
    });
  }

  function handleApprove() {
    run(() => approveProductionAccessAction(request.id), () => setStatus("approved"));
  }

  function handleReject() {
    const reason = window.prompt("Rejection reason shown to the client (leave blank for none):") || undefined;
    run(
      () => rejectProductionAccessAction(request.id, reason),
      () => {
        setStatus("rejected");
        setMessage(reason || null);
      }
    );
  }

  function handleMoreInfo() {
    const msg = window.prompt("Message shown to the client explaining what's needed:");
    if (!msg) return;
    run(
      () => requestMoreProductionInfoAction(request.id, msg),
      () => {
        setStatus("more_information_required");
        setMessage(msg);
      }
    );
  }

  function handleSuspend() {
    const msg = window.prompt("Support message shown to the client (leave blank for the default):") || undefined;
    run(
      () => suspendProductionAccessAction(request.id, msg),
      () => {
        setStatus("suspended");
        setMessage(msg || null);
      }
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{request.organization_name}</p>
            <span className="rounded bg-bg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-subtle">
              {request.product_slug}
            </span>
          </div>
          {request.production_requested_at ? (
            <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
              <Clock className="h-3 w-3" />
              Requested {new Date(request.production_requested_at).toLocaleString("en-KE")}
            </div>
          ) : null}
        </div>
        <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " + PRODUCTION_STYLES[status]}>
          {PRODUCTION_LABEL[status]}
        </span>
      </div>

      {message ? <p className="rounded-md border border-border bg-bg p-2 text-xs text-fg-muted">Client message: {message}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {status === "pending" || status === "more_information_required" ? (
          <>
            <button
              disabled={isPending}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              disabled={isPending}
              onClick={handleMoreInfo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Request more info
            </button>
            <button
              disabled={isPending}
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        ) : null}
        {status === "approved" ? (
          <button
            disabled={isPending}
            onClick={handleSuspend}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" /> Suspend
          </button>
        ) : null}
      </div>
    </div>
  );
}
