import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Download, Search, UserPlus } from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { statusStyles, verifications } from "@/lib/kyc-verifications";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Manage verified Kenyan customers, KYC status, risk tier and lifetime activity in XOBRIQ KYC.",
      },
      { property: "og:title", content: "Customers — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Verified customers, risk tier and KYC status across Kenya.",
      },
    ],
  }),
  component: CustomersPage,
});

type Tier = "Retail" | "SME" | "Enterprise";
type Customer = {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  tier: Tier;
  verifications: number;
  lastActive: string;
  status: "Approved" | "Pending" | "Flagged";
  ltvKes: number;
};

const seed: Customer[] = verifications.slice(0, 14).map((v, i) => ({
  id: `CUS-${(20481 + i).toString()}`,
  ref: v.ref,
  name: `${v.firstName} ${v.lastName}`,
  email: `${v.firstName}.${v.lastName}`.toLowerCase() + "@example.co.ke",
  phone: `+2547${(10000000 + i * 91237).toString().slice(0, 8)}`,
  county: v.county,
  tier: (["Retail", "SME", "Enterprise"] as Tier[])[i % 3],
  verifications: 1 + (i % 6),
  lastActive: v.date,
  status:
    v.status === "Approved"
      ? "Approved"
      : v.status === "Flagged" || v.status === "Rejected"
        ? "Flagged"
        : "Pending",
  ltvKes: 12000 + i * 4300,
}));

function CustomersPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return seed;
    return seed.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.county.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s),
    );
  }, [q]);

  const stats = [
    { label: "Total customers", value: seed.length * 187, tone: "text-foreground" },
    {
      label: "Verified",
      value: seed.filter((c) => c.status === "Approved").length * 172,
      tone: "text-success",
    },
    {
      label: "Pending KYC",
      value: seed.filter((c) => c.status === "Pending").length * 34,
      tone: "text-warning-foreground",
    },
    {
      label: "High risk",
      value: seed.filter((c) => c.status === "Flagged").length * 6,
      tone: "text-destructive",
    },
  ];

  return (
    <PageShell
      activePath="/customers"
      title="Customers"
      subtitle="Verified Kenyan customers across all channels"
      actions={
        <Button variant="outline" className="hidden gap-2 sm:inline-flex">
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className={cn("mt-1 text-2xl font-bold tracking-tight", s.tone)}>
                {s.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, county or customer ID…"
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Checks</TableHead>
                  <TableHead className="text-right">LTV (KES)</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{c.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {c.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{c.email}</div>
                      <div>{c.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.county}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {c.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {c.verifications}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {c.ltvKes.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          statusStyles[c.status === "Flagged" ? "Flagged" : c.status],
                        )}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.lastActive}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1">
                        <Link to="/verifications/$id" params={{ id: c.ref }}>
                          Open <ArrowUpRight className="h-3.5 w-3.5" />
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
