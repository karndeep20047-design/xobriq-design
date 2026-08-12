"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Copy,
  Download,
  Fingerprint,
  Menu,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/kyc/sidebar";
import { useKycIdentity } from "@/components/kyc/identity-context";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { downloadJson } from "@/lib/file-export";
import { statusStyles, type VerificationStatus } from "@/lib/kyc/status-styles";
import {
  type BusinessResult,
  type IdentityResult,
  type PhoneResult,
  type VerificationDetail as VerificationDetailData,
} from "@/lib/kyc/client-api";

const BASE = "/dashboard/xobriqKYC";

function NotFoundView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md border-border/60">
        <CardContent className="space-y-3 p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Verification not found</h1>
          <p className="text-sm text-muted-foreground">
            The reference you requested doesn&apos;t exist or belongs to a different organization.
          </p>
          <Button asChild variant="outline">
            <Link href={`${BASE}/verifications`}>Back to verifications</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function displayStatus(v: VerificationDetailData): VerificationStatus {
  if (v.status === "pending") return "Processing";
  if (v.status === "failed") return "Flagged";
  return v.matched ? "Approved" : "Rejected";
}

function headline(v: VerificationDetailData): string {
  const fallback = v.identifier_number || "—";
  if (v.status === "failed" || !v.result) return fallback;
  if (v.verification_type === "identity")
    return (v.result as IdentityResult).fullName || fallback;
  if (v.verification_type === "phone")
    return (v.result as PhoneResult).mobileNumber || fallback;
  return (v.result as BusinessResult).businessName || fallback;
}

function riskFlagsFor(v: VerificationDetailData): string[] {
  if (v.status === "failed") return [v.error_message || "Verification failed"];
  if (v.status === "completed" && !v.matched) return ["No match found by IPRS"];
  return [];
}

export function VerificationDetailClient({
  verification: v,
}: {
  verification: VerificationDetailData | null;
}) {
  const { notifications } = useKycIdentity();

  if (!v) return <NotFoundView />;

  const copyRef = async () => {
    await navigator.clipboard.writeText(v.ref);
    toast.success("Reference copied");
  };

  const exportRecord = () => {
    downloadJson(`xobriq-kyc-verification-${v.ref}.json`, v);
    toast.success("Verification record downloaded");
  };

  const status = displayStatus(v);
  const name = headline(v);
  const riskFlags = riskFlagsFor(v);
  const score = v.status === "completed" && v.matched ? 100 : 0;

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

            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href={`${BASE}/verifications`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Verifications</span>
              </Link>
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell initialNotifications={notifications} />
              <Button variant="outline" size="sm" className="gap-2" onClick={exportRecord}>
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button asChild size="sm" className="gap-2">
                <Link href={`${BASE}/verify`}>
                  <RefreshCw className="h-4 w-4" /> New verification
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Hero */}
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {name[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-semibold sm:text-2xl">{name}</h1>
                    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
                      {status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <button
                      onClick={copyRef}
                      className="inline-flex items-center gap-1 font-mono hover:text-foreground"
                    >
                      {v.ref}
                      <Copy className="h-3 w-3" />
                    </button>
                    <span>·</span>
                    <span className="capitalize">{v.verification_type}</span>
                    <span>·</span>
                    <span>{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1 rounded-xl border border-border/70 bg-muted/30 p-4 lg:items-end">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  IPRS match
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {v.status === "completed" ? (v.matched ? "Yes" : "No") : "—"}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      score === 100 ? "bg-success" : "bg-destructive",
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: details + audit */}
            <div className="space-y-6 lg:col-span-2">
              <VerificationTypeDetails v={v} />

              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Audit timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="relative space-y-4 border-l border-border/70 pl-5">
                    <li className="relative">
                      <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </span>
                      <div className="text-sm font-medium">Request received</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                    </li>
                    <li className="relative">
                      <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </span>
                      <div className="text-sm font-medium">
                        {v.status === "failed"
                          ? "Verification failed"
                          : v.matched
                            ? "IPRS match confirmed"
                            : "IPRS returned no match"}
                      </div>
                      {v.error_message ? (
                        <div className="text-xs text-muted-foreground">{v.error_message}</div>
                      ) : null}
                      <div className="text-[11px] text-muted-foreground">
                        {v.completed_at ? new Date(v.completed_at).toLocaleString() : "—"}
                        {v.duration_ms ? ` · ${(v.duration_ms / 1000).toFixed(1)}s` : ""}
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Right: meta */}
            <div className="space-y-6">
              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Request metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row icon={Fingerprint} label="Channel" value="Dashboard" />
                  <Row icon={Building2} label="Requested by" value={v.requested_by_email || "—"} />
                  <Row icon={ShieldCheck} label="IP address" value={v.ip_address || "—"} />
                  <Separator />
                  <Row
                    icon={ShieldCheck}
                    label="Submitted"
                    value={new Date(v.created_at).toLocaleString()}
                  />
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "border shadow-[var(--shadow-card)]",
                  riskFlags.length
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-success/30 bg-success/5",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {riskFlags.length ? (
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-success" />
                    )}
                    Risk signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {riskFlags.length ? (
                    <ul className="space-y-2 text-sm">
                      {riskFlags.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No risk signals detected on this verification.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="text-base">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Verified against <strong className="text-foreground">IPRS</strong>{" "}
                    (Kenya) with data subject consent stored per{" "}
                    <strong className="text-foreground">ODPC</strong> guidelines.
                  </p>
                  <p className="text-xs">
                    Retention: 7 years · Data residency: Nairobi (ke-central-1)
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function VerificationTypeDetails({ v }: { v: VerificationDetailData }) {
  if (v.status === "failed" || !v.result) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Verification failed</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">{v.error_message}</CardContent>
      </Card>
    );
  }

  if (v.verification_type === "identity") {
    const result = v.result as IdentityResult;
    return (
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Applicant details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" value={result.firstName || "—"} />
          <Field label="Last name" value={result.lastName || v.last_name || "—"} />
          <Field label="Gender" value={result.gender || "—"} />
          <Field label="Date of birth" value={result.dateOfBirth || "—"} />
          <Field label="Citizenship" value={result.citizenship || "—"} />
          <Field label="ID number" value={result.idNumber || v.identifier_number || "—"} mono />
        </CardContent>
      </Card>
    );
  }

  if (v.verification_type === "phone") {
    const result = v.result as PhoneResult;
    return (
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Phone details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Mobile number" value={result.mobileNumber || v.identifier_number || "—"} mono />
          <Field label="National ID checked against" value={v.identifier_number || "—"} mono />
        </CardContent>
      </Card>
    );
  }

  const result = v.result as BusinessResult;
  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Business details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={result.businessName || "—"} />
          <Field label="Status" value={result.status || "—"} />
          <Field label="Registration date" value={result.registrationDate || "—"} />
          <Field label="Registration number" value={v.identifier_number || "—"} mono />
          <Field label="Physical address" value={result.physicalAddress || "—"} />
          <Field label="Postal address" value={result.postalAddress || "—"} />
        </CardContent>
      </Card>

      {result.beneficialOwners.length > 0 ? (
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Beneficial owners</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {result.beneficialOwners.map((owner, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 px-5 py-3 sm:grid-cols-4">
                <Field label="Name" value={owner.name || "—"} />
                <Field label="Role" value={owner.role || "—"} />
                <Field label="ID number" value={owner.idNumber || "—"} mono />
                <Field
                  label="Ownership"
                  value={owner.ownershipPercentage ? `${owner.ownershipPercentage}%` : "—"}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm font-medium", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
