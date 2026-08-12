import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Open a ticket, browse the XOBRIQ KYC knowledge base or reach our Nairobi support desk.",
      },
      { property: "og:title", content: "Support — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Get help from the XOBRIQ KYC support team.",
      },
    ],
  }),
  component: SupportPage,
});

const tickets = [
  { id: "TCK-4021", subject: "IPRS timeout on batch upload", updated: "2 h ago", status: "Open", priority: "High" },
  { id: "TCK-3998", subject: "Webhook signature validation", updated: "Yesterday", status: "Waiting", priority: "Medium" },
  { id: "TCK-3921", subject: "Enable Alien ID for Mombasa branch", updated: "3 days ago", status: "Resolved", priority: "Low" },
];

const kb = [
  { t: "Verifying a Kenyan National ID", d: "Fields, formats and IPRS match logic." },
  { t: "Handling passport MRZ errors", d: "Troubleshoot common MRZ checksum failures." },
  { t: "Webhook events reference", d: "All events, payloads and retry behaviour." },
  { t: "Fraud scoring explained", d: "How XOBRIQ KYC computes the 0-100 confidence score." },
  { t: "ODPC compliance checklist", d: "Consent, retention and DPO obligations in Kenya." },
  { t: "Sandbox test IDs", d: "Deterministic IDs for approved / rejected / flagged flows." },
];

const statusStyles = {
  Open: "border-destructive/30 bg-destructive/10 text-destructive",
  Waiting: "border-warning/30 bg-warning/15 text-warning-foreground",
  Resolved: "border-success/30 bg-success/10 text-success",
} as const;

function SupportPage() {
  const [form, setForm] = useState({ subject: "", priority: "Medium", body: "" });
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!form.subject || !form.body) return;
    setSent(true);
    setForm({ subject: "", priority: "Medium", body: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <PageShell activePath="/support" title="Support" subtitle="We're online Mon–Sat, 07:00–22:00 EAT">
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { t: "Live chat", d: "Median reply 3 min", icon: MessageCircle, action: "Start chat" },
          { t: "Nairobi hotline", d: "+254 20 000 4545", icon: Phone, action: "Call now" },
          { t: "Knowledge base", d: "80+ articles & guides", icon: BookOpen, action: "Browse" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.t} className="border-border/60 shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{c.t}</div>
                    <div className="text-xs text-muted-foreground">{c.d}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  {c.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Your tickets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", statusStyles[t.status as keyof typeof statusStyles])}
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium">{t.subject}</div>
                  <div className="text-[11px] text-muted-foreground">Updated {t.updated}</div>
                </div>
                <Button size="sm" variant="ghost" className="gap-1">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">New ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Brief summary"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Critical"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Describe the issue</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                rows={5}
                className="mt-1"
                placeholder="Include reference IDs and steps to reproduce"
              />
            </div>
            <Button className="w-full gap-2" onClick={submit}>
              <Send className="h-4 w-4" /> Submit ticket
            </Button>
            {sent ? (
              <div className="rounded-md border border-success/30 bg-success/10 p-2 text-center text-xs text-success">
                Ticket submitted. We'll reply within 1 hour.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Popular articles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {kb.map((a) => (
            <a
              key={a.t}
              href="#"
              className="group rounded-lg border border-border/60 p-3 transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{a.t}</div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{a.d}</div>
            </a>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
