"use client";

import { useState, useTransition } from "react";
import { LifeBuoy, Mail, Send } from "lucide-react";

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
import { submitKycSupportRequestAction } from "./actions";

export type SupportRequestRow = {
  id: string;
  subject: string;
  status: string;
  urgency: string;
  createdAt: string;
  respondedAt: string | null;
  replies: { message: string; created_at: string }[];
};

const statusStyles: Record<string, string> = {
  new: "border-destructive/30 bg-destructive/10 text-destructive",
  in_progress: "border-warning/30 bg-warning/15 text-warning-foreground",
  responded: "border-success/30 bg-success/10 text-success",
  closed: "border-border bg-muted text-muted-foreground",
};

const SUPPORT_EMAIL = "info@xobriq.com";

export function SupportClient({ initialRequests }: { initialRequests: SupportRequestRow[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [form, setForm] = useState({ subject: "", urgency: "normal", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function submit() {
    if (!form.subject || !form.message) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subject", form.subject);
      fd.set("message", form.message);
      fd.set("urgency", form.urgency);
      const result = await submitKycSupportRequestAction(fd);
      if (!result.ok) {
        setError(result.error || "Failed to submit request.");
        return;
      }
      setSent(true);
      setRequests((prev) => [
        {
          id: `pending-${prev.length}`,
          subject: form.subject,
          status: "new",
          urgency: form.urgency,
          createdAt: new Date().toISOString(),
          respondedAt: null,
          replies: [],
        },
        ...prev,
      ]);
      setForm({ subject: "", urgency: "normal", message: "" });
      setTimeout(() => setSent(false), 4000);
    });
  }

  return (
    <PageShell title="Support" subtitle="Get help from the Xobriq team">
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Email support</div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Your requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No requests yet — submit one and our team will respond by email.
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("font-medium", statusStyles[r.status] || statusStyles.new)}
                        >
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium">{r.subject}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Submitted {new Date(r.createdAt).toLocaleString()}
                        {r.respondedAt ? ` · Responded ${new Date(r.respondedAt).toLocaleDateString()}` : ""}
                      </div>
                    </div>
                  </div>
                  {r.replies.length > 0 ? (
                    <div className="mt-2 space-y-2 border-t border-border/60 pt-2">
                      {r.replies.map((reply, i) => (
                        <div key={i} className="rounded-md bg-muted/40 p-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Xobriq replied · {new Date(reply.created_at).toLocaleString()}
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap text-xs">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">New request</CardTitle>
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
              <Label className="text-xs">Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm((p) => ({ ...p, urgency: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "normal", "high", "critical"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Describe the issue</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                rows={5}
                className="mt-1"
                placeholder="Include reference IDs and steps to reproduce"
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button className="w-full gap-2" onClick={submit}>
              <Send className="h-4 w-4" /> Submit request
            </Button>
            {sent ? (
              <div className="rounded-md border border-success/30 bg-success/10 p-2 text-center text-xs text-success">
                Request submitted — our team will reply by email.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
