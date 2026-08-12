import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plug,
  Plus,
  RefreshCw,
  Webhook,
} from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API & Webhooks — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Manage API keys, webhook endpoints and usage for the XOBRIQ KYC verification API.",
      },
      { property: "og:title", content: "API & Webhooks — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Keys, webhooks and usage for the XOBRIQ KYC API.",
      },
    ],
  }),
  component: ApiPage,
});

type ApiKey = {
  id: string;
  name: string;
  env: "Live" | "Sandbox";
  prefix: string;
  secret: string;
  created: string;
  lastUsed: string;
};

const initialKeys: ApiKey[] = [
  {
    id: "key_live_1",
    name: "Production server",
    env: "Live",
    prefix: "sk_live_hk_",
    secret: "s3cr3t_qm18shf9a2kd94jsl0mn7bcpvg82",
    created: "2026-04-11",
    lastUsed: "2 min ago",
  },
  {
    id: "key_test_1",
    name: "Sandbox — mobile team",
    env: "Sandbox",
    prefix: "sk_test_hk_",
    secret: "s4ndb0x_apqm81jdlz03bxr7wvnst9124h",
    created: "2026-03-02",
    lastUsed: "Yesterday",
  },
];

type Hook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDelivery: string;
  status: "Success" | "Failing";
};

const initialHooks: Hook[] = [
  {
    id: "wh_1",
    url: "https://api.jumiapay.co.ke/hooks/xobriq",
    events: ["verification.approved", "verification.rejected"],
    active: true,
    lastDelivery: "5 min ago",
    status: "Success",
  },
  {
    id: "wh_2",
    url: "https://ops.example.co.ke/callbacks/kyc",
    events: ["verification.flagged"],
    active: true,
    lastDelivery: "1 h ago",
    status: "Failing",
  },
];

function ApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [hooks, setHooks] = useState<Hook[]>(initialHooks);

  const copy = (id: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const rotate = (id: string) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, secret: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }
          : k,
      ),
    );
  };

  const addKey = () => {
    const id = `key_${Date.now()}`;
    setKeys((prev) => [
      ...prev,
      {
        id,
        name: "New key",
        env: "Sandbox",
        prefix: "sk_test_hk_",
        secret: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        created: new Date().toISOString().slice(0, 10),
        lastUsed: "—",
      },
    ]);
  };

  const usage = [
    { label: "Requests (24h)", value: "14,208" },
    { label: "Success rate", value: "99.6%", tone: "text-success" },
    { label: "Avg latency", value: "412 ms" },
    { label: "Errors (24h)", value: "58", tone: "text-destructive" },
  ];

  return (
    <PageShell
      activePath="/api"
      title="API & Webhooks"
      subtitle="Connect your systems to XOBRIQ KYC"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {usage.map((u) => (
          <Card key={u.label} className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {u.label}
              </div>
              <div className={cn("mt-1 text-2xl font-bold tracking-tight", u.tone)}>
                {u.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">API keys</CardTitle>
          </div>
          <Button size="sm" className="gap-2" onClick={addKey}>
            <Plus className="h-4 w-4" /> New key
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => {
                  const shown = reveal[k.id];
                  const masked = "•".repeat(24);
                  const full = k.prefix + k.secret;
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="text-sm font-medium">{k.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            k.env === "Live"
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-info/20 bg-info/10 text-info",
                          )}
                        >
                          {k.env}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-1">
                          <code className="truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                            {k.prefix}
                            {shown ? k.secret : masked}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              setReveal((r) => ({ ...r, [k.id]: !r[k.id] }))
                            }
                          >
                            {shown ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => copy(k.id, full)}
                          >
                            {copied === k.id ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.created}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {k.lastUsed}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => rotate(k.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Rotate
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Webhook endpoints</CardTitle>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Add endpoint
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {hooks.map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="truncate font-mono text-xs">{h.url}</code>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium",
                        h.status === "Success"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive",
                      )}
                    >
                      {h.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {h.events.map((e) => (
                      <span
                        key={e}
                        className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Last delivery {h.lastDelivery}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={h.active}
                    onCheckedChange={(v) =>
                      setHooks((prev) =>
                        prev.map((x) => (x.id === h.id ? { ...x, active: v } : x)),
                      )
                    }
                  />
                  <Button size="sm" variant="ghost">
                    Logs
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Quick start</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Base URL</Label>
              <Input
                readOnly
                value="https://api.xobriq.co.ke/v1"
                className="mt-1 font-mono text-xs"
              />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
{`curl https://api.xobriq.co.ke/v1/verify \\
  -H "Authorization: Bearer sk_live_hk_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "document": "national_id",
    "number": "32874821",
    "last_name": "Kamau"
  }'`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
