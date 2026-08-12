"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScanSearch, Download, AlertTriangle, RotateCcw } from "lucide-react";
import { ConsoleCard } from "@/components/console/ConsolePageHeader";
import { StatCard, ActionBadge } from "./GuardDashboardClient";

const POLL_MS = 1500;

export type ScanStatus = {
  phase: "idle" | "counting" | "scanning" | "done" | "error";
  total_records: number;
  records_scanned: number;
  error: string | null;
};

export type ScanReport = {
  total_records: number;
  counts: { BLOCK: number; REVIEW: number; ALLOW: number };
  by_type: { type: string; count: number; BLOCK: number; REVIEW: number; ALLOW: number }[];
  ground_truth: { precision: number; recall: number; f1: number; tp: number; fp: number; fn: number } | null;
  sample_flagged: {
    step: number;
    type: string;
    amount: number;
    action: "BLOCK" | "REVIEW" | "ALLOW";
    rule_action: "BLOCK" | "REVIEW" | "ALLOW";
    model_score: number | null;
  }[];
  versions: Record<string, any>;
};

export function ScanPanel() {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [starting, setStarting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchReport = useCallback(async () => {
    const res = await fetch("/api/console/guard/scan/report", { cache: "no-store" });
    if (res.ok) setReport(await res.json());
  }, []);

  const poll = useCallback(async () => {
    const res = await fetch("/api/console/guard/scan/status", { cache: "no-store" });
    if (!res.ok) return;
    const data: ScanStatus = await res.json();
    setStatus(data);
    if (data.phase === "done") {
      stopPolling();
      await fetchReport();
    } else if (data.phase === "error") {
      stopPolling();
    }
  }, [fetchReport, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  async function handleStart() {
    setStarting(true);
    setReport(null);
    const res = await fetch("/api/console/guard/scan/start", { method: "POST" });
    setStarting(false);
    if (res.status !== 200 && res.status !== 409) return;
    await poll();
    stopPolling();
    pollRef.current = setInterval(poll, POLL_MS);
  }

  async function handleDownloadPdf() {
    if (!report) return;
    const { downloadScanReportPdf } = await import("@/lib/guard/scan-report-pdf");
    downloadScanReportPdf(report);
  }

  async function handleReset() {
    if (!window.confirm("Clear the current scan report? This cannot be undone.")) return;
    setResetting(true);
    const res = await fetch("/api/console/guard/scan/reset", { method: "POST" });
    setResetting(false);
    if (res.status !== 200 && res.status !== 409) return;
    stopPolling();
    setStatus(null);
    setReport(null);
  }

  const scanning = status?.phase === "counting" || status?.phase === "scanning";
  const hasResettableState = status !== null || report !== null;
  const pct =
    status && status.total_records > 0
      ? Math.min(100, Math.round((status.records_scanned / status.total_records) * 100))
      : 0;

  return (
    <ConsoleCard>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Batch Fraud Scan</h2>
          <p className="mt-0.5 text-xs text-fg-muted">Scan the PaySim demo dataset and generate a downloadable report</p>
        </div>
        <div className="flex items-center gap-2">
          {hasResettableState ? (
            <button
              onClick={handleReset}
              disabled={resetting || scanning}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting…" : "Reset"}
            </button>
          ) : null}
          {report ? (
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          ) : null}
          <button
            onClick={handleStart}
            disabled={starting || scanning}
            className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-medium text-enterprise-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            <ScanSearch className="h-4 w-4" />
            {scanning ? "Scanning…" : "Start scanning"}
          </button>
        </div>
      </div>

      <div className="p-6">
        {!status ? (
          <p className="text-sm text-fg-muted">
            Runs the fraud engine over the full PaySim dataset and reports the results here.
          </p>
        ) : status.phase === "error" ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{status.error}</p>
          </div>
        ) : status.phase === "counting" ? (
          <p className="text-sm text-fg-muted">Counting records…</p>
        ) : scanning ? (
          <div>
            <p className="text-sm text-fg-muted">
              {status.total_records.toLocaleString()} records found — analyzing…{" "}
              {status.records_scanned.toLocaleString()} / {status.total_records.toLocaleString()} ({pct}%)
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-enterprise-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : report ? (
          <ScanReportView report={report} />
        ) : (
          <p className="text-sm text-fg-muted">Scan complete — loading report…</p>
        )}
      </div>
    </ConsoleCard>
  );
}

function ScanReportView({ report }: { report: ScanReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Records scanned" value={report.total_records} Icon={ScanSearch} tone="muted" />
        <StatCard label="Blocked" value={report.counts.BLOCK} Icon={ScanSearch} tone="danger" />
        <StatCard label="Review" value={report.counts.REVIEW} Icon={ScanSearch} tone="warning" />
        <StatCard label="Allowed" value={report.counts.ALLOW} Icon={ScanSearch} tone="success" />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Breakdown by type</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-subtle">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Count</th>
                <th className="px-4 py-2">Blocked</th>
                <th className="px-4 py-2">Review</th>
                <th className="px-4 py-2">Allowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.by_type.map((row) => (
                <tr key={row.type}>
                  <td className="px-4 py-2">{row.type}</td>
                  <td className="px-4 py-2 tabular-nums">{row.count.toLocaleString()}</td>
                  <td className="px-4 py-2 tabular-nums">{row.BLOCK.toLocaleString()}</td>
                  <td className="px-4 py-2 tabular-nums">{row.REVIEW.toLocaleString()}</td>
                  <td className="px-4 py-2 tabular-nums">{row.ALLOW.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {report.ground_truth ? (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Model performance vs. ground truth
          </h3>
          <p className="mb-3 text-xs text-fg-muted">
            This dataset ships labeled fraud outcomes (`isFraud`) — a real customer scan would not have this comparison.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Precision" value={Math.round(report.ground_truth.precision * 10000) / 100} Icon={ScanSearch} tone="muted" />
            <StatCard label="Recall" value={Math.round(report.ground_truth.recall * 10000) / 100} Icon={ScanSearch} tone="muted" />
            <StatCard label="F1" value={Math.round(report.ground_truth.f1 * 10000) / 100} Icon={ScanSearch} tone="muted" />
          </div>
        </div>
      ) : null}

      {report.sample_flagged.length > 0 ? (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Top flagged transactions</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th className="px-4 py-2">Step</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Rule</th>
                  <th className="px-4 py-2">Model score</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.sample_flagged.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{row.step}</td>
                    <td className="px-4 py-2">{row.type}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2">{row.rule_action}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.model_score === null ? "—" : row.model_score.toFixed(4)}
                    </td>
                    <td className="px-4 py-2">
                      <ActionBadge action={row.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
