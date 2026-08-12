import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Fraud Alerts — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Live fraud signals, watchlist hits and suspicious verification activity in Kenya.",
      },
      { property: "og:title", content: "Fraud Alerts — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Live fraud signals and watchlist hits across Kenyan KYC checks.",
      },
    ],
  }),
  component: AlertsPage,
});

type Severity = "Critical" | "High" | "Medium" | "Low";
type Alert = {
  id: string;
  ref: string;
  name: string;
  signal: string;
  detail: string;
  severity: Severity;
  channel: "API" | "Dashboard" | "Mobile SDK";
  raisedAt: string;
  status: "Open" | "Investigating" | "Resolved";
};

const alerts: Alert[] = [
  {
    id: "FA-90211",
    ref: "HKY-24019192",
    name: "Brian Otieno",
    signal: "IPRS name mismatch",
    detail: "Submitted last name differs from IPRS record by 3 characters",
    severity: "High",
    channel: "API",
    raisedAt: "Today, 09:41",
    status: "Open",
  },
  {
    id: "FA-90204",
    ref: "HKY-24019177",
    name: "Faith Chebet",
    signal: "Selfie liveness failed",
    detail: "Two liveness attempts failed within 30s from same IP",
    severity: "Critical",
    channel: "Mobile SDK",
    raisedAt: "Today, 08:12",
    status: "Investigating",
  },
  {
    id: "FA-90198",
    ref: "HKY-24019154",
    name: "Kevin Mwangi",
    signal: "Duplicate ID number",
    detail: "National ID 24738**** previously seen under different applicant",
    severity: "Critical",
    channel: "Dashboard",
    raisedAt: "Yesterday, 22:04",
    status: "Open",
  },
  {
    id: "FA-90183",
    ref: "HKY-24019132",
    name: "Amina Yusuf",
    signal: "High-risk county velocity",
    detail: "12 verifications in 4 hours from Garissa on same device",
    severity: "Medium",
    channel: "API",
    raisedAt: "Yesterday, 18:20",
    status: "Investigating",
  },
  {
    id: "FA-90170",
    ref: "HKY-24019101",
    name: "Peter Njoroge",
    signal: "Sanctions watchlist near-match",
    detail: "0.86 fuzzy-match to OFAC SDN list entry",
    severity: "High",
    channel: "API",
    raisedAt: "Yesterday, 14:55",
    status: "Open",
  },
  {
    id: "FA-90142",
    ref: "HKY-24018998",
    name: "Grace Wambui",
    signal: "Document tampering",
    detail: "MRZ checksum failed on passport upload",
    severity: "Critical",
    channel: "Dashboard",
    raisedAt: "2 days ago",
    status: "Resolved",
  },
  {
    id: "FA-90118",
    ref: "HKY-24018944",
    name: "Samuel Kiprop",
    signal: "Unusual device fingerprint",
    detail: "Rooted Android device with spoofed GPS coordinates",
    severity: "Low",
    channel: "Mobile SDK",
    raisedAt: "3 days ago",
    status: "Resolved",
  },
];

const severityStyles: Record<Severity, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-warning/15 text-warning-foreground border-warning/30",
  Medium: "bg-info/10 text-info border-info/20",
  Low: "bg-muted text-muted-foreground border-border",
};

const filters = ["All", "Open", "Investigating", "Resolved"] as const;

function AlertsPage() {
  const [tab, setTab] = useState<(typeof filters)[number]>("All");
  const filtered = alerts.filter((a) => tab === "All" || a.status === tab);

  const stats = [
    {
      label: "Open alerts",
      value: alerts.filter((a) => a.status === "Open").length,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
    {
      label: "Investigating",
      value: alerts.filter((a) => a.status === "Investigating").length,
      icon: ShieldAlert,
      tone: "text-warning-foreground",
    },
    {
      label: "Resolved (7d)",
      value: alerts.filter((a) => a.status === "Resolved").length + 18,
      icon: ShieldCheck,
      tone: "text-success",
    },
    {
      label: "Auto-blocked",
      value: 47,
      icon: ShieldOff,
      tone: "text-foreground",
    },
  ];

  return (
    <PageShell
      activePath="/alerts"
      title="Fraud Alerts"
      subtitle="Real-time risk signals across the KYC pipeline"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                  <div className={cn("mt-1 text-2xl font-bold tracking-tight", s.tone)}>
                    {s.value}
                  </div>
                </div>
                <Icon className={cn("h-5 w-5", s.tone)} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-base">All alerts</CardTitle>
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setTab(f)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition",
                  tab === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {a.ref}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{a.signal}</div>
                      <div className="text-xs text-muted-foreground">{a.detail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-medium", severityStyles[a.severity])}
                      >
                        {a.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{a.channel}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.raisedAt}
                    </TableCell>
                    <TableCell className="text-sm">{a.status}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/verifications/$id" params={{ id: a.ref }}>
                          Investigate
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
