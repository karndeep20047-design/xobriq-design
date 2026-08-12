import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
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
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Fingerprint,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Plug,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

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

export const Route = createFileRoute("/")({
  component: Dashboard,
});

import { AppSidebar } from "@/components/kyc/sidebar";
import { ThemeToggle } from "@/components/kyc/theme-toggle";
import { meOptions, walletOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";

function kes(amount: number) {
  return (
    "KES " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

const stats = [
  {
    label: "Total Verifications",
    value: "3,482",
    delta: "+22% vs last 7 days",
    deltaTone: "up" as const,
    icon: ShieldCheck,
    tone: "info" as const,
  },
  {
    label: "Approved",
    value: "2,914",
    delta: "83.7% success rate",
    deltaTone: "up" as const,
    icon: CheckCircle2,
    tone: "success" as const,
  },
  {
    label: "Pending Review",
    value: "421",
    delta: "12.1% of total",
    deltaTone: "neutral" as const,
    icon: Clock,
    tone: "warning" as const,
  },
  {
    label: "Rejected",
    value: "147",
    delta: "4.2% of total",
    deltaTone: "down" as const,
    icon: XCircle,
    tone: "destructive" as const,
  },
  {
    label: "Fraud Alerts",
    value: "9",
    delta: "-35% vs last 7 days",
    deltaTone: "up" as const,
    icon: AlertTriangle,
    tone: "info" as const,
  },
];

const trendData = [
  { day: "Mon", approved: 320, pending: 80, rejected: 18 },
  { day: "Tue", approved: 410, pending: 92, rejected: 22 },
  { day: "Wed", approved: 388, pending: 110, rejected: 16 },
  { day: "Thu", approved: 502, pending: 74, rejected: 28 },
  { day: "Fri", approved: 468, pending: 96, rejected: 20 },
  { day: "Sat", approved: 355, pending: 60, rejected: 12 },
  { day: "Sun", approved: 471, pending: 82, rejected: 31 },
];

const docTypeData = [
  { name: "National ID", value: 2140, color: "var(--color-chart-1)" },
  { name: "Passport", value: 892, color: "var(--color-chart-4)" },
  { name: "Alien ID", value: 310, color: "var(--color-chart-2)" },
  { name: "Huduma Namba", value: 140, color: "var(--color-chart-5)" },
];

type Status = "Approved" | "Pending" | "Processing" | "Rejected" | "Flagged";

const verifications: {
  ref: string;
  name: string;
  doc: "National ID" | "Passport" | "Alien ID";
  number: string;
  county: string;
  status: Status;
  date: string;
}[] = [
  {
    ref: "HKY-24019281",
    name: "Wanjiku Kamau",
    doc: "National ID",
    number: "•• •• 4821",
    county: "Nairobi",
    status: "Approved",
    date: "Today, 10:24",
  },
  {
    ref: "HKY-24019282",
    name: "Brian Otieno",
    doc: "Passport",
    number: "AK•••7123",
    county: "Kisumu",
    status: "Pending",
    date: "Today, 09:15",
  },
  {
    ref: "HKY-24019283",
    name: "Ali Hassan Mwangi",
    doc: "National ID",
    number: "•• •• 9042",
    county: "Mombasa",
    status: "Processing",
    date: "Today, 08:45",
  },
  {
    ref: "HKY-24019284",
    name: "Faith Chebet",
    doc: "National ID",
    number: "•• •• 2210",
    county: "Uasin Gishu",
    status: "Approved",
    date: "Yesterday, 16:35",
  },
  {
    ref: "HKY-24019285",
    name: "Peter Njoroge",
    doc: "Passport",
    number: "BK•••2298",
    county: "Nakuru",
    status: "Rejected",
    date: "Yesterday, 15:12",
  },
  {
    ref: "HKY-24019286",
    name: "Amina Yusuf",
    doc: "Alien ID",
    number: "•• •• 0177",
    county: "Garissa",
    status: "Flagged",
    date: "Yesterday, 14:02",
  },
  {
    ref: "HKY-24019287",
    name: "Grace Wambui",
    doc: "National ID",
    number: "•• •• 6634",
    county: "Nyeri",
    status: "Approved",
    date: "Yesterday, 11:48",
  },
];

const statusStyles: Record<Status, string> = {
  Approved: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/15 text-warning-foreground border-warning/30",
  Processing: "bg-info/10 text-info border-info/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  Flagged: "bg-destructive/15 text-destructive border-destructive/30",
};

const toneStyles: Record<"info" | "success" | "warning" | "destructive", string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

function StatCard({ stat }: { stat: (typeof stats)[number] }) {
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

function Dashboard() {
  const [range, setRange] = useState("7d");
  const [query, setQuery] = useState("");
  const mounted = useMounted();
  const { data: me } = useQuery(meOptions(mounted));
  const { data: wallet } = useQuery(walletOptions(mounted));
  const firstName = me?.displayName?.split(" ")[0] || "there";
  const identityPrice = wallet?.pricing.identity ?? null;
  const remainingChecks =
    wallet && identityPrice ? Math.floor(wallet.balance / identityPrice) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return verifications;
    return verifications.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.ref.toLowerCase().includes(q) ||
        v.county.toLowerCase().includes(q) ||
        v.doc.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/70 lg:block">
        <AppSidebar activePath="/" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <AppSidebar activePath="/" />
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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Karibu, {firstName} <span className="align-middle">👋</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here's what's happening with your Kenyan ID and passport verifications today.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={range} onValueChange={setRange}>
                <TabsList>
                  <TabsTrigger value="24h">24h</TabsTrigger>
                  <TabsTrigger value="7d">7 days</TabsTrigger>
                  <TabsTrigger value="30d">30 days</TabsTrigger>
                  <TabsTrigger value="90d">90 days</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button asChild className="gap-2">
                <Link to="/verify">
                  <Plus className="h-4 w-4" />
                  New Verification
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </section>

          {/* Main grid */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Verification Overview</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Daily approved, pending and rejected verifications
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <LegendDot color="var(--color-success)" label="Approved" />
                  <LegendDot color="var(--color-warning)" label="Pending" />
                  <LegendDot color="var(--color-destructive)" label="Rejected" />
                </div>
              </CardHeader>
              <CardContent className="h-[280px] pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRejected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
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
                      stroke="var(--color-success)"
                      strokeWidth={2.5}
                      fill="url(#gApproved)"
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      stroke="var(--color-warning)"
                      strokeWidth={2.5}
                      fill="url(#gPending)"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejected"
                      stroke="var(--color-destructive)"
                      strokeWidth={2.5}
                      fill="url(#gRejected)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
                <div className="flex items-center justify-center">
                  <div className="relative h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={docTypeData}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {docTypeData.map((d) => (
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
                      <div className="text-xl font-bold">3,482</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Total
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {docTypeData.map((d) => {
                    const pct = Math.round((d.value / 3482) * 100);
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
                          {d.value.toLocaleString()} <span className="text-xs">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent + side */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Recent Verifications</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Latest ID and passport checks across your workspace
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
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
                        <TableHead className="hidden md:table-cell">County</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((v) => (
                        <TableRow key={v.ref} className="cursor-pointer">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {v.ref}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-[11px] font-medium">
                                  {v.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{v.name}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {v.number}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              {v.doc === "Passport" ? (
                                <Globe2 className="h-3.5 w-3.5 text-info" />
                              ) : v.doc === "Alien ID" ? (
                                <Fingerprint className="h-3.5 w-3.5 text-warning-foreground" />
                              ) : (
                                <CreditCard className="h-3.5 w-3.5 text-primary" />
                              )}
                              {v.doc}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{v.county}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("font-medium", statusStyles[v.status])}
                            >
                              {v.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {v.date}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-sm text-muted-foreground py-10"
                          >
                            No verifications match "{query}".
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
                      <div className="mt-1 text-2xl font-bold">
                        {wallet ? kes(wallet.balance) : "—"}
                      </div>
                    </div>
                    <Wallet className="h-6 w-6 opacity-90" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 gap-1.5" asChild>
                      <Link to="/billing/top-up">
                        <Plus className="h-3.5 w-3.5" /> Top up
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 bg-white/15 text-primary-foreground hover:bg-white/25"
                      asChild
                    >
                      <Link to="/billing/history">History</Link>
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost per verification</span>
                    <span className="font-medium">{identityPrice ? kes(identityPrice) : "—"}</span>
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
                    { icon: CreditCard, label: "Verify National ID", to: "/verify" as const },
                    { icon: Globe2, label: "Verify Passport", to: "/verify" as const },
                    { icon: Building2, label: "Verify Business (BRS)", to: "/verify" as const },
                    { icon: Upload, label: "Bulk CSV Upload", to: "/bulk" as const },
                    { icon: Plug, label: "API Verification", to: "/api" as const },
                  ].map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link
                        key={a.label}
                        to={a.to}
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
            © 2026 XOBRIQ KYC · Powered by IPRS &amp; DCI data sources · Demo figures
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
