import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Play,
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

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk CSV Upload · XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Upload a CSV of Kenyan IDs or passports to run bulk KYC verifications against IPRS in one batch.",
      },
      { property: "og:title", content: "Bulk CSV Upload · XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Run KYC checks on hundreds of records in one batch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BulkUploadPage,
});

type Row = {
  id: string;
  docType: "National ID" | "Passport" | "Alien ID";
  docNumber: string;
  lastName: string;
  firstName: string;
  status: "pending" | "processing" | "approved" | "rejected";
  error?: string;
};

const SAMPLE_CSV = `doc_type,doc_number,last_name,first_name
National ID,29876541,Otieno,Brian
National ID,32118976,Wanjiru,Grace
Passport,BK1234567,Kimani,Peter
National ID,27654321,Mwangi,Sarah
Alien ID,AL8891234,Achieng,Faith
National ID,34556123,Kiptoo,Daniel
Passport,BK7788221,Njoroge,Mary
National ID,31445009,Odhiambo,Kevin`;

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const [, ...rest] = lines;
  return rest.map((line, idx) => {
    const [docType, docNumber, lastName, firstName] = line
      .split(",")
      .map((s) => s?.trim() ?? "");
    const type =
      docType === "Passport"
        ? "Passport"
        : docType === "Alien ID"
        ? "Alien ID"
        : "National ID";
    const valid = !!docNumber && !!lastName;
    return {
      id: `row-${idx + 1}`,
      docType: type,
      docNumber,
      lastName,
      firstName: firstName ?? "",
      status: "pending",
      error: valid ? undefined : "Missing required field",
    } satisfies Row;
  });
}

function BulkUploadPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => !r.error).length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const cost = valid * 35;
    return { total, valid, invalid: total - valid, approved, rejected, cost };
  }, [rows]);

  function handleFile(file: File) {
    setFileName(file.name);
    setDone(false);
    setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
  }

  function loadSample() {
    setFileName("sample-kyc.csv");
    setRows(parseCsv(SAMPLE_CSV));
    setDone(false);
    setProgress(0);
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
    setProgress(0);
    setDone(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function runBatch() {
    setRunning(true);
    setDone(false);
    setProgress(0);
    const valid = rows.filter((r) => !r.error);
    for (let i = 0; i < valid.length; i++) {
      const target = valid[i];
      setRows((prev) =>
        prev.map((r) => (r.id === target.id ? { ...r, status: "processing" } : r))
      );
      await new Promise((res) => setTimeout(res, 260));
      // demo outcome: mostly approved, some rejected
      const approved = Math.random() > 0.18;
      setRows((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? { ...r, status: approved ? "approved" : "rejected" }
            : r
        )
      );
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }
    setRunning(false);
    setDone(true);
  }

  return (
    <PageShell
      activePath="/bulk"
      title="Bulk CSV Upload"
      subtitle="Verify hundreds of Kenyan IDs and passports in one batch"
      actions={
        <Button asChild variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex">
          <Link to="/verify">
            <ArrowLeft className="h-4 w-4" /> Single verification
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                  dragOver && "border-primary bg-primary/5"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Drag &amp; drop your CSV, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max 10,000 rows · UTF-8 encoded
                  </p>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      loadSample();
                    }}
                  >
                    Load sample
                  </Button>
                </div>
              </label>

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
                          <TableCell>{r.docType}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.docNumber || <span className="text-destructive">—</span>}
                          </TableCell>
                          <TableCell>{r.lastName || <span className="text-destructive">—</span>}</TableCell>
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
              <Stat label="Cost per check" value="KES 35.00" muted />
              <Stat
                label="Estimated total"
                value={`KES ${stats.cost.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`}
                strong
              />
              {done ? (
                <>
                  <div className="my-2 border-t border-border/70" />
                  <Stat label="Approved" value={stats.approved.toString()} tone="success" />
                  <Stat label="Rejected" value={stats.rejected.toString()} tone="destructive" />
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <Button
                onClick={runBatch}
                disabled={running || stats.valid === 0}
                className="w-full gap-2"
              >
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
              {done ? (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/verifications">
                    <Rocket className="h-4 w-4" /> View in Verifications
                  </Link>
                </Button>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Each valid row consumes one verification credit from your wallet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CSV format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                <span className="font-mono text-foreground">doc_type</span> — National ID,
                Passport, or Alien ID
              </p>
              <p>
                <span className="font-mono text-foreground">doc_number</span> — 8-digit ID or
                passport number
              </p>
              <p>
                <span className="font-mono text-foreground">last_name</span> — required for
                IPRS match
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
  if (row.error) {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
        <XCircle className="h-3 w-3" /> {row.error}
      </Badge>
    );
  }
  if (row.status === "pending")
    return <Badge variant="secondary">Ready</Badge>;
  if (row.status === "processing")
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </Badge>
    );
  if (row.status === "approved")
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> Approved
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
          tone === "destructive" && "text-destructive"
        )}
      >
        {value}
      </span>
    </div>
  );
}
