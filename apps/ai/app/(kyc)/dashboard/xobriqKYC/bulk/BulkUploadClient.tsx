"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/file-export";
import { verifyBulkRowAction, BULK_DOC_TYPE_LABELS, type BulkDocType } from "./actions";

const BASE = "/dashboard/xobriqKYC";

const DOC_TYPE_BY_LABEL = Object.fromEntries(
  Object.entries(BULK_DOC_TYPE_LABELS).map(([value, label]) => [label, value as BulkDocType]),
);
const DOC_TYPE_LABELS = Object.values(BULK_DOC_TYPE_LABELS);

type Row = {
  id: string;
  docTypeLabel: string;
  docType: BulkDocType | null;
  docNumber: string;
  lastName: string;
  firstName: string;
  status: "pending" | "processing" | "waiting" | "retrying" | "approved" | "rejected" | "error";
  error?: string;
  ref?: string;
};

const SAMPLE_CSV = `doc_type,doc_number,last_name,first_name
National ID,29876541,Otieno,Brian
National ID,32118976,Wanjiru,Grace
Alien ID,100482915,Kimani,Peter
National ID,27654321,Mwangi,Sarah
Alien ID,100223344,Achieng,Faith
National ID,34556123,Kiptoo,Daniel
Driving License,88221345,Njoroge,Mary
National ID,31445009,Odhiambo,Kevin`;

// Enforced, not just advertised — handleFile() rejects a file before ever
// loading it into the table if either limit is exceeded.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — generous for 10,000 short rows
const MAX_ROWS = 10_000;

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const [, ...rest] = lines;
  return rest.map((line, idx) => {
    const [docTypeLabel, docNumber, lastName, firstName] = line
      .split(",")
      .map((s) => s?.trim() ?? "");
    const docType = DOC_TYPE_BY_LABEL[docTypeLabel] ?? null;
    const error = !docType
      ? `Unsupported document type "${docTypeLabel}"`
      : !docNumber || !lastName
        ? "Missing required field"
        : undefined;
    return {
      id: `row-${idx + 1}`,
      docTypeLabel: docTypeLabel || "—",
      docType,
      docNumber,
      lastName,
      firstName: firstName ?? "",
      status: "pending",
      error,
    } satisfies Row;
  });
}

// Retries a rate-limited row rather than failing it outright — the org-wide
// cap (10 verifications/60s, lib/kyc/rate-limit.ts) is shared with the
// single New Verification page, so a busy org can legitimately fill the
// window between rows. Bounded so a permanently-stuck row can't hang the
// batch forever.
const RATE_LIMIT_RETRY_DELAY_MS = 6_000;
const RATE_LIMIT_MAX_ATTEMPTS = 15;

// A row whose verifyBulkRowAction result comes back { retryable: true } means
// Creditinfo itself was unreachable/overloaded/timed out for that one call —
// not a bad input. Retried with exponential backoff (capped) a few times
// in-batch before giving up on it for this run. verifyAndRecord() reuses the
// row's own idempotency key on a retry rather than billing/attempting a
// fresh one, so this is safe to do as many times as needed.
const PROVIDER_ERROR_BASE_DELAY_MS = 8_000;
const PROVIDER_ERROR_MAX_DELAY_MS = 30_000;
const PROVIDER_ERROR_MAX_ATTEMPTS = 5;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function BulkUploadClient({
  walletBalance,
  identityPrice,
  trialActive,
  trialUntil,
}: {
  walletBalance: number;
  identityPrice: number | null;
  trialActive: boolean;
  trialUntil: string | null;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [stoppedReason, setStoppedReason] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => !r.error).length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const errored = rows.filter((r) => r.status === "error").length;
    const cost = identityPrice ? valid * identityPrice : 0;
    return { total, valid, invalid: total - valid, approved, rejected, errored, cost };
  }, [rows, identityPrice]);

  const kes = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

  function handleFile(file: File) {
    setFileError(null);

    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setFileError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB, which exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`,
      );
      return;
    }

    setFileName(file.name);
    setDone(false);
    setProgress(0);
    setStoppedReason(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      // readAsText(file, "UTF-8") below decodes explicitly as UTF-8 rather
      // than relying on the browser's default/sniffed encoding — a byte
      // sequence that isn't valid UTF-8 decodes to U+FFFD replacement
      // characters, which is how a wrong-encoding file is caught here.
      if (text.includes("�")) {
        setFileName(null);
        setFileError("This file doesn't look like valid UTF-8 text — please re-save/export it as UTF-8 and try again.");
        return;
      }
      const parsedRows = parseCsv(text);
      if (parsedRows.length > MAX_ROWS) {
        setFileName(null);
        setFileError(
          `This CSV has ${parsedRows.length.toLocaleString()} rows, which exceeds the ${MAX_ROWS.toLocaleString()}-row limit. Split it into smaller files and upload separately.`,
        );
        return;
      }
      setRows(parsedRows);
    };
    reader.onerror = () => {
      setFileName(null);
      setFileError("Could not read this file. Please try again.");
    };
    reader.readAsText(file, "UTF-8");
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xobriq-kyc-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows([]);
    setFileName(null);
    setFileError(null);
    setProgress(0);
    setDone(false);
    setStoppedReason(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function exportResults() {
    downloadCsv(
      `xobriq-kyc-bulk-results-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Reference", "Document type", "Document number", "Last name", "First name", "Status", "Error"],
      rows.map((r) => [
        r.ref || "",
        r.docTypeLabel,
        r.docNumber,
        r.lastName,
        r.firstName,
        r.status,
        r.error || "",
      ]),
    );
  }

  // Runs one row through to a terminal state (approved/rejected/error),
  // transparently retrying rate-limit and Creditinfo-outage responses along
  // the way. Shared by runBatch (fresh rows) and retryFailedRows (re-running
  // rows already marked "error") so both get identical retry behavior.
  async function processRow(target: Row): Promise<{ stop: boolean }> {
    setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, status: "processing", error: undefined } : r)));

    let rateLimitAttempts = 0;
    let providerAttempts = 0;

    while (true) {
      const result = await verifyBulkRowAction({
        docType: target.docType!,
        docNumber: target.docNumber,
        lastName: target.lastName,
      });

      if (!result.ok && "rateLimited" in result && result.rateLimited) {
        rateLimitAttempts += 1;
        if (rateLimitAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === target.id ? { ...r, status: "error", error: "Rate limited — try this row again later." } : r,
            ),
          );
          return { stop: false };
        }
        setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, status: "waiting" } : r)));
        await sleep(RATE_LIMIT_RETRY_DELAY_MS);
        continue;
      }

      if (!result.ok && "insufficientBalance" in result && result.insufficientBalance) {
        setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, status: "error", error: result.error } : r)));
        setStoppedReason(result.error);
        return { stop: true };
      }

      if (!result.ok) {
        setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, status: "error", error: result.error } : r)));
        return { stop: false };
      }

      if (result.status === "failed" && result.retryable) {
        providerAttempts += 1;
        if (providerAttempts >= PROVIDER_ERROR_MAX_ATTEMPTS) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === target.id
                ? {
                    ...r,
                    ref: result.ref,
                    status: "error",
                    error: (result.errorMessage || "Verification failed") + " — Creditinfo looks unavailable right now. Use \"Retry failed rows\" again later.",
                  }
                : r,
            ),
          );
          return { stop: false };
        }
        setRows((prev) => prev.map((r) => (r.id === target.id ? { ...r, status: "retrying" } : r)));
        const delay = Math.min(PROVIDER_ERROR_BASE_DELAY_MS * 2 ** (providerAttempts - 1), PROVIDER_ERROR_MAX_DELAY_MS);
        await sleep(delay);
        continue;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? {
                ...r,
                ref: result.ref,
                status: result.status === "failed" ? "error" : result.matched ? "approved" : "rejected",
                error: result.status === "failed" ? result.errorMessage || "Verification failed" : undefined,
              }
            : r,
        ),
      );
      return { stop: false };
    }
  }

  async function runBatch() {
    setRunning(true);
    setDone(false);
    setProgress(0);
    setStoppedReason(null);
    const valid = rows.filter((r) => !r.error && r.docType);

    for (let i = 0; i < valid.length; i++) {
      const { stop } = await processRow(valid[i]);
      setProgress(Math.round(((i + 1) / valid.length) * 100));
      if (stop) break;
    }

    setRunning(false);
    setDone(true);
  }

  // Re-runs only the rows still sitting in "error" — the realistic answer to
  // "retry after an outage" given this app has no background job runner:
  // the client manually re-triggers it (immediately, or after coming back
  // later), and each row's own idempotency key means Creditinfo never gets
  // billed/attempted twice for whatever already actually completed.
  async function retryFailedRows() {
    const failed = rows.filter((r) => r.status === "error" && r.docType);
    if (failed.length === 0) return;

    setRunning(true);
    setProgress(0);
    setStoppedReason(null);

    for (let i = 0; i < failed.length; i++) {
      const { stop } = await processRow(failed[i]);
      setProgress(Math.round(((i + 1) / failed.length) * 100));
      if (stop) break;
    }

    setRunning(false);
    setDone(true);
  }

  return (
    <PageShell
      title="Bulk CSV Upload"
      subtitle="Run real IPRS identity verifications for many people in one batch"
      actions={
        <Button asChild variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex">
          <Link href={`${BASE}/verify`}>
            <ArrowLeft className="h-4 w-4" /> Single verification
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {stoppedReason ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Batch stopped — {stoppedReason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rows already processed above were completed for real and billed. Remaining rows
                    were not attempted.{" "}
                    <Link href="/billing/top-up" className="underline underline-offset-2">
                      Top up your wallet
                    </Link>{" "}
                    and run the batch again to pick up where it left off.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Upload a CSV file</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Columns: doc_type, doc_number, last_name, first_name
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
                <Download className="h-4 w-4" /> Template
              </Button>
            </CardHeader>
            <CardContent>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center transition",
                  dragOver && "border-primary bg-primary/5",
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag &amp; drop your CSV, or click to browse</p>
                  <p className="text-xs text-muted-foreground">Max 10,000 rows · UTF-8 encoded</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      inputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" /> Choose file
                  </Button>
                </div>
              </label>

              {fileError ? (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              ) : null}

              {fileName ? (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 bg-card px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span className="font-medium">{fileName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {stats.total} rows
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {rows.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Preview</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {stats.valid} valid · {stats.invalid} invalid
                  </p>
                </div>
                {running ? (
                  <div className="flex items-center gap-3">
                    <Progress value={progress} className="w-40" />
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Last name</TableHead>
                        <TableHead>First name</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>{r.docTypeLabel}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.docNumber || <span className="text-destructive">—</span>}
                          </TableCell>
                          <TableCell>
                            {r.lastName || <span className="text-destructive">—</span>}
                          </TableCell>
                          <TableCell>{r.firstName}</TableCell>
                          <TableCell className="text-right">
                            <StatusBadge row={r} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Batch summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Stat label="Total rows" value={stats.total.toString()} />
              <Stat label="Valid" value={stats.valid.toString()} tone="success" />
              <Stat label="Invalid" value={stats.invalid.toString()} tone="destructive" />
              <div className="my-2 border-t border-border/70" />
              <Stat label="Wallet balance" value={kes(walletBalance)} muted />
              <Stat
                label="Cost per check"
                value={identityPrice ? kes(identityPrice) : "Not yet billed"}
                muted
              />
              <Stat label="Estimated total" value={kes(stats.cost)} strong />
              {trialActive ? (
                <p className="text-xs text-info">
                  Free trial active{trialUntil ? ` until ${new Date(trialUntil).toLocaleDateString()}` : ""} —
                  this batch won&apos;t be blocked by wallet funds until then.
                </p>
              ) : stats.cost > walletBalance ? (
                <p className="text-xs text-destructive">
                  Your balance covers roughly {identityPrice ? Math.floor(walletBalance / identityPrice) : 0} of{" "}
                  {stats.valid} rows — the batch will stop and tell you when funds run out.
                </p>
              ) : null}
              {done ? (
                <>
                  <div className="my-2 border-t border-border/70" />
                  <Stat label="Approved" value={stats.approved.toString()} tone="success" />
                  <Stat label="Rejected" value={stats.rejected.toString()} tone="destructive" />
                  <Stat label="Errored" value={stats.errored.toString()} tone="destructive" />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <Button onClick={runBatch} disabled={running || stats.valid === 0} className="w-full gap-2">
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Run batch ({stats.valid})
                  </>
                )}
              </Button>
              {done && stats.errored > 0 ? (
                <Button onClick={retryFailedRows} disabled={running} variant="secondary" className="w-full gap-2">
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Retrying…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" /> Retry failed rows ({stats.errored})
                    </>
                  )}
                </Button>
              ) : null}
              {done ? (
                <>
                  <Button variant="outline" onClick={exportResults} className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download results
                  </Button>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link href={`${BASE}/verifications`}>
                      <Rocket className="h-4 w-4" /> View in Verifications
                    </Link>
                  </Button>
                </>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Each valid row runs a real IPRS check and debits one verification credit from your
                wallet — same as New Verification, just queued row by row.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CSV format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="font-mono text-foreground">doc_type</span> — one of:{" "}
                {DOC_TYPE_LABELS.join(", ")}
              </p>
              <p>
                <span className="font-mono text-foreground">doc_number</span> — the ID/account/plate
                number for that document type
              </p>
              <p>
                <span className="font-mono text-foreground">last_name</span> — required for IPRS
                match
              </p>
              <p>
                <span className="font-mono text-foreground">first_name</span> — optional
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function StatusBadge({ row }: { row: Row }) {
  if (row.error && row.status === "pending") {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
        <XCircle className="h-3 w-3" /> {row.error}
      </Badge>
    );
  }
  if (row.status === "pending") return <Badge variant="secondary">Ready</Badge>;
  if (row.status === "processing")
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </Badge>
    );
  if (row.status === "waiting")
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" /> Waiting (rate limit)
      </Badge>
    );
  if (row.status === "retrying")
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-600">
        <RefreshCw className="h-3 w-3 animate-spin" /> Retrying (Creditinfo unavailable)
      </Badge>
    );
  if (row.status === "approved")
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  if (row.status === "error")
    return (
      <Badge variant="destructive" className="gap-1" title={row.error}>
        <XCircle className="h-3 w-3" /> Error
      </Badge>
    );
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" /> Rejected
    </Badge>
  );
}

function Stat({
  label,
  value,
  tone,
  strong,
  muted,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-muted-foreground", muted && "text-xs")}>{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          strong && "text-base font-semibold",
          tone === "success" && "text-emerald-600",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}
