import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Globe, Lock, Palette, ShieldCheck } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Configure workspace, security, notifications and compliance settings for XOBRIQ KYC.",
      },
      { property: "og:title", content: "Settings — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Workspace, security and compliance controls for XOBRIQ KYC.",
      },
    ],
  }),
  component: SettingsPage,
});

const sections = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "region", label: "Region", icon: Globe },
] as const;

function SettingsPage() {
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("workspace");
  const [prefs, setPrefs] = useState({
    twoFactor: true,
    ssoRequired: false,
    ipAllowlist: true,
    auditExport: true,
    autoBlock: true,
    piiRedaction: true,
    alertsEmail: true,
    alertsSlack: false,
  });
  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <PageShell activePath="/settings" title="Settings" subtitle="Configure your workspace">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active === s.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {s.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {active === "workspace" ? (
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Workspace</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Company name</Label>
                  <Input defaultValue="Jumia Pay Ltd" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">KRA PIN</Label>
                  <Input defaultValue="P051234567X" className="mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Business email</Label>
                  <Input defaultValue="ops@jumiapay.co.ke" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Support phone</Label>
                  <Input defaultValue="+254 700 123 456" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Registered address</Label>
                  <Input defaultValue="Sameer Business Park, Mombasa Rd, Nairobi" className="mt-1" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button>Save changes</Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {active === "security" ? (
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Security</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/60">
                {[
                  { k: "twoFactor" as const, t: "Require 2FA for all members", d: "Enforce TOTP-based 2FA on every login." },
                  { k: "ssoRequired" as const, t: "Enforce SSO (SAML)", d: "Only allow login via Okta / Azure AD." },
                  { k: "ipAllowlist" as const, t: "Restrict API by IP", d: "Only accept API traffic from allowed IP ranges." },
                  { k: "auditExport" as const, t: "Daily audit log export", d: "Push audit events to your S3 bucket." },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between py-3">
                    <div className="pr-6">
                      <div className="text-sm font-medium">{r.t}</div>
                      <div className="text-xs text-muted-foreground">{r.d}</div>
                    </div>
                    <Switch checked={prefs[r.k]} onCheckedChange={() => toggle(r.k)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {active === "compliance" ? (
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Compliance (Kenya)</CardTitle>
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                  ODPC registered
                </Badge>
              </CardHeader>
              <CardContent className="divide-y divide-border/60">
                {[
                  { k: "autoBlock" as const, t: "Auto-block sanctions matches", d: "Reject verifications matching OFAC / UN / local watchlists." },
                  { k: "piiRedaction" as const, t: "PII redaction in logs", d: "Mask ID numbers and DOB in server logs." },
                  { k: "alertsEmail" as const, t: "Email alerts to DPO", d: "Send breach & incident alerts to dpo@jumiapay.co.ke." },
                  { k: "alertsSlack" as const, t: "Slack alerts to #kyc-ops", d: "Post fraud alerts to your Slack workspace." },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between py-3">
                    <div className="pr-6">
                      <div className="text-sm font-medium">{r.t}</div>
                      <div className="text-xs text-muted-foreground">{r.d}</div>
                    </div>
                    <Switch checked={prefs[r.k]} onCheckedChange={() => toggle(r.k)} />
                  </div>
                ))}
                <div className="pt-3 text-xs text-muted-foreground">
                  Data retention: verification records kept 7 years per CBK guidelines. Applicant selfies purged after 90 days.
                </div>
              </CardContent>
            </Card>
          ) : null}

          {active === "branding" ? (
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Display name</Label>
                  <Input defaultValue="Jumia Pay KYC" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Support URL</Label>
                  <Input defaultValue="https://help.jumiapay.co.ke" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Primary color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md border bg-primary" />
                    <Input defaultValue="#0B7A3B" className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Logo</Label>
                  <div className="mt-1 flex h-9 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                    Upload SVG or PNG
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {active === "region" ? (
            <Card className="border-border/60 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">Region & locale</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Country</Label>
                  <Select defaultValue="ke">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ke">Kenya</SelectItem>
                      <SelectItem value="ug">Uganda</SelectItem>
                      <SelectItem value="tz">Tanzania</SelectItem>
                      <SelectItem value="rw">Rwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Timezone</Label>
                  <Select defaultValue="eat">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eat">EAT (UTC+3)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select defaultValue="kes">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kes">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="usd">USD — US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
