"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Fingerprint,
  Menu,
  Phone,
  Plug,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";

import { AppSidebar } from "@/components/kyc/sidebar";
import { NavbarProfileMenu } from "@/components/kyc/navbar-profile-menu";
import { ThemeToggle } from "@/components/kyc/theme-toggle";
import { useKycIdentity } from "@/components/kyc/identity-context";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { statusStyles, type VerificationStatus } from "@/lib/kyc/status-styles";
import type { BusinessResult, IdentityResult, PhoneResult, VerificationListItem } from "@/lib/kyc/client-api";
import type { DashboardRange, DashboardStats } from "@/lib/kyc/dashboard-stats";

const BASE = "/dashboard/xobriqKYC";

function kes(amount: number) {
  return (
    "KES " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

// Literal hex rather than the design system's var(--color-*) tokens —
// Recharts renders these as raw SVG paint attributes (stopColor/stroke/
// fill), and those oklch()-based CSS vars don't reliably resolve there the
// way they do through compiled Tailwind utility classes elsewhere on this
// page, which silently fell back to black/gray.
const TREND_COLORS = { approved: "#16a34a", pending: "#d97706", rejected: "#dc2626" };

const RANGE_LABELS: Record<DashboardRange, string> = {
  "24h": "24h",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

const toneStyles: Record<"info" | "success" | "warning" | "destructive", string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

function fmtDelta(pct: number | null, suffix: string): string {
  if (pct === null) return suffix;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% ${suffix}`;
}

function deltaTone(pct: number | null): "up" | "down" | "neutral" {
  if (pct === null || pct === 0) return "neutral";
  return pct > 0 ? "up" : "down";
}

function buildStatCards(stats: DashboardStats, rangeLabel: string) {
  return [
    {
      label: "Total Verifications",
      value: stats.total.toLocaleString(),
      delta: fmtDelta(stats.totalDeltaPct, `vs last ${rangeLabel}`),
      deltaTone: deltaTone(stats.totalDeltaPct),
      icon: ShieldCheck,
      tone: "info" as const,
    },
    {
      label: "Approved",
      value: stats.approved.toLocaleString(),
      delta: stats.approvedRate === null ? "No data yet" : `${stats.approvedRate}% success rate`,
      deltaTone: "up" as const,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Pending Review",
      value: stats.pending.toLocaleString(),
      delta: stats.pendingRate === null ? "No data yet" : `${stats.pendingRate}% of total`,
      deltaTone: "neutral" as const,
      icon: Clock,
      tone: "warning" as const,
    },
    {
      label: "Rejected",
      value: stats.rejected.toLocaleString(),
      delta: stats.rejectedRate === null ? "No data yet" : `${stats.rejectedRate}% of total`,
      deltaTone: "down" as const,
      icon: XCircle,
      tone: "destructive" as const,
    },
    {
      label: "Fraud Alerts",
      value: stats.alerts.toLocaleString(),
      delta: fmtDelta(stats.alertsDeltaPct, `vs last ${rangeLabel}`),
      deltaTone: deltaTone(stats.alertsDeltaPct === null ? null : -stats.alertsDeltaPct),
      icon: AlertTriangle,
      tone: "info" as const,
    },
  ];
}

type DocLabel = "National ID" | "Alien ID" | "KRA PIN" | "Bank Account" | "Driving License" | "Vehicle Plate";

function docLabelFor(v: VerificationListItem): DocLabel | "Phone" | "Business" {
  if (v.verification_type === "phone") return "Phone";
  if (v.verification_type === "business") return "Business";
  switch (v.identifier_type) {
    case "krapinalien_id":
      return "Alien ID";
    case "krapin":
      return "KRA PIN";
    case "bank":
      return "Bank Account";
    case "dl":
      return "Driving License";
    case "plate":
      return "Vehicle Plate";
    default:
      return "National ID";
  }
}

function nameFor(v: VerificationListItem): string {
  if (v.verification_type === "identity") {
    const result = v.result as IdentityResult | null;
    return (result?.fullName || v.last_name || v.identifier_number || "—").trim();
  }
  if (v.verification_type === "phone") {
    const result = v.result as PhoneResult | null;
    return result?.mobileNumber || v.identifier_number || "—";
  }
  const result = v.result as BusinessResult | null;
  return (result?.businessName || v.identifier_number || "—").trim();
}

function statusFor(v: VerificationListItem): VerificationStatus {
  if (v.status === "pending") return "Processing";
  if (v.status === "failed") return "Flagged";
  return v.matched ? "Approved" : "Rejected";
}

function formatRecentDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" }) + `, ${time}`;
}

function StatCard({ stat }: { stat: ReturnType<typeof buildStatCards>[number] }) {
  const Icon = stat.icon;
  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{stat.value}</div>
            <div
              className={cn(
                "mt-2 text-xs font-medium",
                stat.deltaTone === "up" && "text-success",
                stat.deltaTone === "down" && "text-destructive",
                stat.deltaTone === "neutral" && "text-muted-foreground",
              )}
            >
              {stat.delta}
            </div>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              toneStyles[stat.tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({
  firstName,
  walletBalance,
  identityPrice,
  range,
  stats,
  recentVerifications,
}: {
  firstName: string;
  walletBalance: number;
  identityPrice: number | null;
  range: DashboardRange;
  stats: DashboardStats;
  recentVerifications: VerificationListItem[];
}) {
  const { notifications } = useKycIdentity();
  const [query, setQuery] = useState("");
  const remainingChecks = identityPrice ? Math.floor(walletBalance / identityPrice) : null;
  const statCards = useMemo(() => buildStatCards(stats, RANGE_LABELS[range]), [stats, range]);
  const docTypeTotal = stats.docTypes.reduce((sum, d) => sum + d.value, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentVerifications;
    return recentVerifications.filter((v) => {
      const name = nameFor(v).toLowerCase();
      return (
        name.includes(q) ||
        v.ref.toLowerCase().includes(q) ||
        (v.identifier_number || "").toLowerCase().includes(q)
      );
    });
  }, [query, recentVerifications]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/70 lg:block">
        <AppSidebar />
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
                <AppSidebar />
              </SheetContent>
            </Sheet>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, ID number, reference…"
                className="pl-9"
              />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationBell initialNotifications={notifications} />
              <NavbarProfileMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Karibu, {firstName} <span className="align-middle">👋</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here&apos;s what&apos;s happening with your verifications.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={`${BASE}/bulk`}>
                    <Upload className="h-4 w-4" />
                    Bulk Verification
                  </Link>
                </Button>
                <Button asChild className="gap-2">
                  <Link href={`${BASE}/verify`}>
                    <Plus className="h-4 w-4" />
                    New Verification
                  </Link>
                </Button>
              </div>
            </div>

            <Tabs value={range} className="self-start md:self-end">
              <TabsList>
                {(Object.keys(RANGE_LABELS) as DashboardRange[]).map((r) => (
                  <TabsTrigger key={r} value={r} asChild>
                    <Link href={`${BASE}?range=${r}`} scroll={false}>
                      {RANGE_LABELS[r]}
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Verification Overview</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Approved, pending and rejected verifications over the last {RANGE_LABELS[range]}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <LegendDot color={TREND_COLORS.approved} label="Approved" />
                  <LegendDot color={TREND_COLORS.pending} label="Pending" />
                  <LegendDot color={TREND_COLORS.rejected} label="Rejected" />
                </div>
              </CardHeader>
              <CardContent className="h-[280px] pl-0">
                {stats.total === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No verifications in the last {RANGE_LABELS[range]} yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TREND_COLORS.approved} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={TREND_COLORS.approved} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TREND_COLORS.pending} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={TREND_COLORS.pending} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TREND_COLORS.rejected} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={TREND_COLORS.rejected} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="var(--color-border)"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stroke={TREND_COLORS.approved}
                        strokeWidth={2.5}
                        fill="url(#gApproved)"
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stroke={TREND_COLORS.pending}
                        strokeWidth={2.5}
                        fill="url(#gPending)"
                      />
                      <Area
                        type="monotone"
                        dataKey="rejected"
                        stroke={TREND_COLORS.rejected}
                        strokeWidth={2.5}
                        fill="url(#gRejected)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Verification by Document</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Breakdown across document types
                </p>
              </CardHeader>
              <CardContent>
                {docTypeTotal === 0 ? (
                  <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                    No identity verifications yet.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center">
                      <div className="relative h-[180px] w-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.docTypes}
                              dataKey="value"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {stats.docTypes.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "var(--color-popover)",
                                border: "1px solid var(--color-border)",
                                borderRadius: 12,
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-xl font-bold">{docTypeTotal.toLocaleString()}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Total
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {stats.docTypes.map((d) => {
                        const p = Math.round((d.value / docTypeTotal) * 100);
                        return (
                          <div key={d.name} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: d.color }}
                              />
                              {d.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {d.value.toLocaleString()} <span className="text-xs">({p}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Recent Verifications</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Latest checks across your workspace
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary" asChild>
                  <Link href={`${BASE}/verifications`}>
                    View all <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((v) => {
                        const doc = docLabelFor(v);
                        const status = statusFor(v);
                        const name = nameFor(v);
                        return (
                          <TableRow key={v.id} className="cursor-pointer">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {v.ref}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-secondary text-[11px] font-medium">
                                    {name[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{name}</div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {v.identifier_number || "—"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                {doc === "Phone" ? (
                                  <Phone className="h-3.5 w-3.5 text-info" />
                                ) : doc === "Business" ? (
                                  <Building2 className="h-3.5 w-3.5 text-info" />
                                ) : doc === "Alien ID" ? (
                                  <Fingerprint className="h-3.5 w-3.5 text-warning-foreground" />
                                ) : (
                                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                                )}
                                {doc}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {formatRecentDate(v.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-sm text-muted-foreground py-10"
                          >
                            {recentVerifications.length === 0
                              ? "No verifications yet — run your first one."
                              : `No verifications match "${query}".`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)]">
                <div className="bg-[image:var(--gradient-brand)] p-5 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest opacity-80">
                        Wallet balance
                      </div>
                      <div className="mt-1 text-2xl font-bold">{kes(walletBalance)}</div>
                    </div>
                    <Wallet className="h-6 w-6 opacity-90" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1.5 !bg-white !text-primary hover:!bg-white/90"
                      asChild
                    >
                      <Link href="/billing/top-up">
                        <Plus className="h-3.5 w-3.5" /> Top up
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-white/15 text-primary-foreground hover:bg-white/25"
                      asChild
                    >
                      <Link href="/billing/history">History</Link>
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost per verification</span>
                    <span className="font-medium">
                      {identityPrice ? kes(identityPrice) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Est. remaining checks</span>
                    <span className="font-medium">
                      {remainingChecks === null ? "—" : `~${remainingChecks.toLocaleString()}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: CreditCard, label: "Verify National ID", to: `${BASE}/verify` },
                    { icon: Phone, label: "Verify Phone", to: `${BASE}/verify` },
                    { icon: Building2, label: "Verify Business (BRS)", to: `${BASE}/verify` },
                    { icon: Upload, label: "Bulk CSV Upload", to: `${BASE}/bulk` },
                    { icon: Plug, label: "API Keys", to: "/api-keys" },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link
                        key={a.label}
                        href={a.to}
                        className="group flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm font-medium transition hover:border-primary/40 hover:bg-accent"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          {a.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Compliance</CardTitle>
                  <Badge className="bg-success/10 text-success hover:bg-success/10">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Active
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ComplianceRow label="ODPC Data Protection" status="Registered" />
                  <ComplianceRow label="CBK KYC Guidelines" status="Compliant" />
                  <ComplianceRow label="IPRS Integration" status="Live" />
                </CardContent>
              </Card>
            </div>
          </section>

          <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
            © 2026 XOBRIQ KYC · Powered by IPRS &amp; DCI data sources
          </footer>
        </main>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ComplianceRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {status}
      </span>
    </div>
  );
}
