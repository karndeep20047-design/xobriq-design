import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Download,
  Filter,
  Loader2,
  Menu,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import { AppSidebar } from "@/components/kyc/sidebar";
import { ThemeToggle } from "@/components/kyc/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { statusStyles, type VerificationStatus } from "@/lib/kyc-verifications";
import { verificationsListOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";
import type {
  BusinessResult,
  IdentityResult,
  PhoneResult,
  VerificationListItem,
} from "@/lib/xobriq-api";

export const Route = createFileRoute("/verifications/")({
  head: () => ({
    meta: [
      { title: "Verifications — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Search, filter and review real Creditinfo KYC verifications processed through XOBRIQ KYC.",
      },
    ],
  }),
  component: VerificationsList,
});

type DocLabel = "National ID" | "Alien ID" | "Phone Number" | "Business (KYB)";

type DisplayRow = {
  ref: string;
  firstName: string;
  lastName: string;
  numberMasked: string;
  doc: DocLabel;
  status: VerificationStatus;
  score: number;
  requestedBy: string;
  createdAt: string;
};

const statusOptions: (VerificationStatus | "All")[] = [
  "All",
  "Approved",
  "Pending",
  "Processing",
  "Rejected",
  "Flagged",
];

const docOptions: (DocLabel | "All")[] = [
  "All",
  "National ID",
  "Alien ID",
  "Phone Number",
  "Business (KYB)",
];

function docLabelFor(v: VerificationListItem): DocLabel {
  if (v.verification_type === "identity") {
    return v.identifier_type === "krapinalien_id" ? "Alien ID" : "National ID";
  }
  if (v.verification_type === "phone") return "Phone Number";
  return "Business (KYB)";
}

function nameFor(v: VerificationListItem): { firstName: string; lastName: string } {
  if (v.verification_type === "identity") {
    const result = v.result as IdentityResult | null;
    const full = (result?.fullName || v.last_name || v.identifier_number).trim();
    const [first, ...rest] = full.split(" ");
    return { firstName: first || "—", lastName: rest.join(" ") };
  }
  if (v.verification_type === "phone") {
    const result = v.result as PhoneResult | null;
    return { firstName: "Phone", lastName: result?.mobileNumber || v.identifier_number };
  }
  const result = v.result as BusinessResult | null;
  const name = (result?.businessName || v.identifier_number).trim();
  const [first, ...rest] = name.split(" ");
  return { firstName: first || "—", lastName: rest.join(" ") };
}

function maskedNumber(v: VerificationListItem): string {
  const n = v.identifier_number;
  return n.length <= 4 ? n : `•• •• ${n.slice(-4)}`;
}

// Maps our own pending/completed/failed + matched onto the existing 5-state
// badge vocabulary from the original mock UI — there's no real "manual
// review pending" state from Creditinfo, so still-polling maps to
// "Processing" and a hard failure (timeout, network error) to "Flagged"
// rather than "Rejected" (which means "Creditinfo returned no match").
function statusFor(v: VerificationListItem): VerificationStatus {
  if (v.status === "pending") return "Processing";
  if (v.status === "failed") return "Flagged";
  return v.matched ? "Approved" : "Rejected";
}

// Creditinfo returns a plain match/no-match boolean, not a continuous
// confidence score — this reuses the existing score-bar UI as a binary
// 100/0 rather than fabricating a number in between.
function scoreFor(v: VerificationListItem): number {
  return v.status === "completed" && v.matched ? 100 : 0;
}

function toDisplayRow(v: VerificationListItem): DisplayRow {
  const { firstName, lastName } = nameFor(v);
  return {
    ref: v.ref,
    firstName,
    lastName,
    numberMasked: maskedNumber(v),
    doc: docLabelFor(v),
    status: statusFor(v),
    score: scoreFor(v),
    requestedBy: v.requested_by_email || "—",
    createdAt: v.created_at,
  };
}

function VerificationsList() {
  const mounted = useMounted();
  const {
    data: verifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(verificationsListOptions(mounted));
  const rows = useMemo(() => (verifications || []).map(toDisplayRow), [verifications]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");
  const [doc, setDoc] = useState<(typeof docOptions)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((v) => {
      if (status !== "All" && v.status !== status) return false;
      if (doc !== "All" && v.doc !== doc) return false;
      if (!q) return true;
      return (
        `${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
        v.ref.toLowerCase().includes(q) ||
        v.numberMasked.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, doc]);

  const counts = useMemo(() => {
    const c: Record<VerificationStatus, number> = {
      Approved: 0,
      Pending: 0,
      Processing: 0,
      Rejected: 0,
      Flagged: 0,
    };
    rows.forEach((v) => (c[v.status] += 1));
    return c;
  }, [rows]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/70 lg:block">
        <AppSidebar activePath="/verifications" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <AppSidebar activePath="/verifications" />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">Verifications</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                All real Creditinfo KYC checks processed through XOBRIQ KYC
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <Button asChild className="gap-2 rounded-full">
                <Link to="/verify">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Verification</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {!mounted || isLoading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading verifications…
            </div>
          ) : isError ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : "Failed to load verifications."}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(
                  [
                    { label: "Approved", key: "Approved", tone: "text-success" },
                    { label: "Pending", key: "Pending", tone: "text-warning-foreground" },
                    { label: "Processing", key: "Processing", tone: "text-info" },
                    { label: "Rejected", key: "Rejected", tone: "text-destructive" },
                    { label: "Flagged", key: "Flagged", tone: "text-destructive" },
                  ] as const
                ).map((s) => (
                  <Card key={s.key} className="border-border/60 shadow-[var(--shadow-card)]">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </div>
                      <div className={cn("mt-1 text-2xl font-bold tracking-tight", s.tone)}>
                        {counts[s.key]}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Filters */}
              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search name, reference, number…"
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={doc} onValueChange={(v) => setDoc(v as typeof doc)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {docOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" /> More
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" /> Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick status chips */}
              <div className="flex flex-wrap items-center gap-2">
                {statusOptions
                  .filter((s) => s !== "All")
                  .map((s) => {
                    const active = status === s;
                    const tone =
                      s === "Approved"
                        ? "text-success"
                        : s === "Pending" || s === "Processing"
                          ? "text-warning-foreground"
                          : "text-destructive";
                    return (
                      <Button
                        key={s}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 gap-1.5 rounded-full px-3 text-xs font-medium",
                          !active && tone,
                        )}
                        onClick={() => setStatus(active ? "All" : s)}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            s === "Approved"
                              ? "bg-success"
                              : s === "Pending" || s === "Processing"
                                ? "bg-warning"
                                : "bg-destructive",
                          )}
                        />
                        {s}
                        <span className="ml-1 tabular-nums">{counts[s]}</span>
                      </Button>
                    );
                  })}
                {status !== "All" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => setStatus("All")}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Table */}
              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Requested by</TableHead>
                          <TableHead>Match</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((v) => (
                          <TableRow key={v.ref} className="hover:bg-muted/40">
                            <TableCell className="font-mono text-xs">{v.ref}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                                    {v.firstName[0]}
                                    {v.lastName[0] || ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">
                                    {v.firstName} {v.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {v.numberMasked}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{v.doc}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {v.requestedBy}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      v.score >= 85 ? "bg-success" : "bg-destructive",
                                    )}
                                    style={{ width: `${v.score}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium tabular-nums">
                                  {v.score >= 85 ? "Yes" : "No"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("font-medium", statusStyles[v.status])}
                              >
                                {v.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild size="sm" variant="ghost" className="gap-1">
                                <Link to="/verifications/$id" params={{ id: v.ref }}>
                                  View
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="py-16 text-center text-sm text-muted-foreground"
                            >
                              <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
                              No verifications match your filters.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
