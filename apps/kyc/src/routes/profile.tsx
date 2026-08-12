import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Camera,
  CheckCircle2,
  Copy,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Business Profile — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Manage your XOBRIQ KYC business profile, contact details, compliance officer and verified business documents.",
      },
      { property: "og:title", content: "Business Profile — XOBRIQ KYC" },
      {
        property: "og:description",
        content: "Manage business profile and compliance details on XOBRIQ KYC.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState({
    legalName: "Jumia Pay Ltd",
    tradingName: "Jumia Pay",
    kraPin: "P051234567X",
    brsNumber: "PVT-KA7X92M",
    industry: "fintech",
    country: "KE",
    email: "compliance@jumiapay.co.ke",
    phone: "+254 700 123 456",
    website: "https://pay.jumia.co.ke",
    address: "Sameer Business Park, Mombasa Road, Nairobi 00100",
    officerName: "Grace Wanjiru",
    officerEmail: "grace.wanjiru@jumiapay.co.ke",
    officerPhone: "+254 711 998 214",
    about:
      "Licensed payments processor serving e-commerce and marketplace clients across East Africa. Regulated by the CBK under the National Payment System Act.",
  });

  const update = <K extends keyof typeof profile>(k: K, v: (typeof profile)[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <PageShell
      activePath="/profile"
      title="Business profile"
      subtitle="Update your organisation details, compliance officer and verified documents"
      actions={
        <Button variant="outline" asChild>
          <Link to="/settings">Workspace settings</Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="border-border/60 shadow-[var(--shadow-card)] lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                    JM
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm transition hover:bg-muted"
                  aria-label="Change logo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 text-base font-semibold">{profile.legalName}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                Business ·
                <span className="inline-flex items-center gap-1 font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <Badge
                variant="outline"
                className="mt-3 border-primary/30 bg-primary/5 text-[10px] font-semibold uppercase tracking-wider text-primary"
              >
                Enterprise plan
              </Badge>
            </div>

            <Separator className="my-5" />

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate">{profile.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{profile.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.address}</span>
              </li>
            </ul>

            <Separator className="my-5" />

            <div className="space-y-2.5">
              <IdRow
                label="KRA PIN"
                value={profile.kraPin}
                onCopy={() => copy(profile.kraPin, "KRA PIN")}
              />
              <IdRow
                label="BRS No."
                value={profile.brsNumber}
                onCopy={() => copy(profile.brsNumber, "BRS number")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Editable details */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" /> Organisation details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal name">
                <Input
                  value={profile.legalName}
                  onChange={(e) => update("legalName", e.target.value)}
                />
              </Field>
              <Field label="Trading name">
                <Input
                  value={profile.tradingName}
                  onChange={(e) => update("tradingName", e.target.value)}
                />
              </Field>
              <Field label="KRA PIN">
                <Input
                  value={profile.kraPin}
                  onChange={(e) => update("kraPin", e.target.value)}
                />
              </Field>
              <Field label="BRS registration number">
                <Input
                  value={profile.brsNumber}
                  onChange={(e) => update("brsNumber", e.target.value)}
                />
              </Field>
              <Field label="Industry">
                <Select
                  value={profile.industry}
                  onValueChange={(v) => update("industry", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">Fintech / Payments</SelectItem>
                    <SelectItem value="banking">Banking</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="telco">Telco / MNO</SelectItem>
                    <SelectItem value="lending">Digital lending</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Country of operation">
                <Select
                  value={profile.country}
                  onValueChange={(v) => update("country", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KE">Kenya</SelectItem>
                    <SelectItem value="UG">Uganda</SelectItem>
                    <SelectItem value="TZ">Tanzania</SelectItem>
                    <SelectItem value="RW">Rwanda</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="About" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={profile.about}
                  onChange={(e) => update("about", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business email">
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={profile.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Website">
                <Input
                  value={profile.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </Field>
              <Field label="Registered address" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={profile.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> Compliance officer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="Full name">
                <Input
                  value={profile.officerName}
                  onChange={(e) => update("officerName", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={profile.officerEmail}
                  onChange={(e) => update("officerEmail", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={profile.officerPhone}
                  onChange={(e) => update("officerPhone", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verified documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { name: "Certificate of Incorporation", status: "Verified", date: "12 Mar 2026" },
                { name: "KRA PIN Certificate", status: "Verified", date: "12 Mar 2026" },
                { name: "CR12 (Directors & Shareholders)", status: "Verified", date: "14 Mar 2026" },
                { name: "Proof of Address (utility bill)", status: "Pending review", date: "—" },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">Uploaded {doc.date}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      doc.status === "Verified"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-warning/30 bg-warning/10 text-warning"
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2 gap-2">
                <Upload className="h-4 w-4" /> Upload document
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
            <Button variant="outline">Cancel</Button>
            <Button
              onClick={() => toast.success("Profile saved")}
              className="gap-2"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function IdRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
      <div className="text-xs">
        <div className="font-medium text-muted-foreground">{label}</div>
        <div className="font-mono">{value}</div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
