import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  Building2,
  Car,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Fingerprint,
  FileText,
  Globe2,
  IdCard,
  Info,
  Landmark,
  Loader2,
  Lock,
  Phone,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
  AlertTriangle,
  ScrollText,
} from "lucide-react";

import { PageShell } from "@/components/kyc/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  verifyIdentity,
  verifyPhone,
  verifyBusiness,
  XobriqApiError,
  type BeneficialOwner,
  type BusinessResult,
  type IdentityResult,
  type PhoneResult,
  type VerificationOutcome,
} from "@/lib/xobriq-api";
import { walletOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "New Verification — XOBRIQ KYC" },
      {
        name: "description",
        content:
          "Run a real Creditinfo identity, phone or business (KYB) verification for a Kenyan customer.",
      },
      { property: "og:title", content: "New Verification — XOBRIQ KYC" },
      {
        property: "og:description",
        content:
          "Kickoff a Kenyan identity, phone or business verification against the Creditinfo network.",
      },
    ],
  }),
  component: VerifyPage,
});

function kes(amount: number) {
  return (
    "KES " + amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

type VerificationKind = "identity" | "phone" | "business";
type DocType = "national_id" | "passport" | "alien_id" | "krapin" | "bank" | "dl" | "plate";
type CheckStatus = "pass" | "fail" | "warn";
type CheckRow = { label: string; status: CheckStatus; detail: string };
type AuditTone = "primary" | "success" | "warning" | "muted";
type AuditEntry = { time: Date; label: string; detail: string; tone: AuditTone };

const kindMeta: Record<
  VerificationKind,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  identity: { label: "Identity", icon: CreditCard },
  phone: { label: "Phone", icon: Phone },
  business: { label: "Business (KYB)", icon: Building2 },
};

const docMeta: Record<
  DocType,
  {
    label: string;
    hint: string;
    placeholder: string;
    example: string;
    icon: React.ComponentType<{ className?: string }>;
    pattern: RegExp;
    minLen: number;
    maxLen: number;
    normalize: (v: string) => string;
    supported: boolean;
  }
> = {
  national_id: {
    label: "Kenyan National ID",
    hint: "8-digit National ID number as printed on the ID card.",
    placeholder: "e.g. 29184023",
    example: "29184023",
    icon: CreditCard,
    pattern: /^\d{7,9}$/,
    minLen: 7,
    maxLen: 9,
    normalize: (v) => v.replace(/\D/g, "").slice(0, 9),
    supported: true,
  },
  passport: {
    label: "Kenyan Passport",
    hint: "Not supported by this Creditinfo strategy yet.",
    placeholder: "e.g. AK1234567",
    example: "AK1234567",
    icon: Globe2,
    pattern: /^[A-Z]{1,2}\d{6,8}$/,
    minLen: 7,
    maxLen: 10,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10),
    supported: false,
  },
  alien_id: {
    label: "Alien / Foreigner ID",
    hint: "7 to 9 digit Alien registration number.",
    placeholder: "e.g. 100482915",
    example: "100482915",
    icon: Fingerprint,
    pattern: /^\d{6,10}$/,
    minLen: 6,
    maxLen: 10,
    normalize: (v) => v.replace(/\D/g, "").slice(0, 10),
    supported: true,
  },
  krapin: {
    label: "KRA PIN",
    hint: "11-character KRA PIN, e.g. business or individual tax PIN.",
    placeholder: "e.g. A123456789A",
    example: "A123456789A",
    icon: Receipt,
    pattern: /^[A-Za-z0-9]{6,11}$/,
    minLen: 6,
    maxLen: 11,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11),
    supported: true,
  },
  bank: {
    label: "Bank Account",
    hint: "Bank account number to verify against Creditinfo's bank register.",
    placeholder: "e.g. 12345678",
    example: "12345678",
    icon: Landmark,
    pattern: /^[A-Za-z0-9]{5,20}$/,
    minLen: 5,
    maxLen: 20,
    normalize: (v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 20),
    supported: true,
  },
  dl: {
    label: "Driving License",
    hint: "Driving license number as printed on the license.",
    placeholder: "e.g. 12345678",
    example: "12345678",
    icon: IdCard,
    pattern: /^[A-Za-z0-9]{5,15}$/,
    minLen: 5,
    maxLen: 15,
    normalize: (v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 15),
    supported: true,
  },
  plate: {
    label: "Vehicle Plate",
    hint: "Vehicle registration / number plate.",
    placeholder: "e.g. KAA 123A",
    example: "KAA123A",
    icon: Car,
    pattern: /^[A-Za-z0-9]{5,10}$/,
    minLen: 5,
    maxLen: 10,
    normalize: (v) =>
      v
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10),
    supported: true,
  },
};

const lastNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Last name must be at least 2 characters" })
  .max(60, { message: "Last name must be less than 60 characters" })
  .regex(/^[A-Za-z][A-Za-z'\- ]*$/, {
    message: "Only letters, spaces, apostrophes and hyphens allowed",
  });

const mobileSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?254|0)[17]\d{8}$/, { message: "Use a Kenyan mobile number, e.g. 0723456789" });

const nationalIdForPhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{7,9}$/, { message: "7 to 9 digit National ID number" });

const registrationNumberSchema = z
  .string()
  .trim()
  .min(4, { message: "Enter a valid registration number" })
  .max(40, { message: "Registration number is too long" })
  .regex(/^[A-Za-z0-9/-]+$/, { message: "Only letters, digits, slashes and hyphens allowed" });

const consentSchema = z.literal(true, {
  errorMap: () => ({ message: "You must confirm you have consent" }),
});

function VerifyPage() {
  const [kind, setKind] = useState<VerificationKind>("identity");

  // Identity fields
  const [docType, setDocType] = useState<DocType>("national_id");
  const [docNumber, setDocNumber] = useState("");
  const [lastName, setLastName] = useState("");

  // Phone fields
  const [nationalId, setNationalId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Business fields
  const [registrationNumber, setRegistrationNumber] = useState("");

  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [record, setRecord] = useState<VerificationOutcome<
    IdentityResult | PhoneResult | BusinessResult
  > | null>(null);

  const docMetaCurrent = docMeta[docType];
  const currentStep: 1 | 2 | 3 = record ? 3 : submitting ? 2 : 1;

  const mounted = useMounted();
  const { data: wallet } = useQuery(walletOptions(mounted));
  const cost = wallet ? wallet.pricing[kind] : null;
  const insufficientBalance = !!(wallet && cost !== null && wallet.balance < cost);

  const docSchema = useMemo(
    () =>
      z
        .string()
        .trim()
        .min(docMetaCurrent.minLen, {
          message: `Must be at least ${docMetaCurrent.minLen} characters`,
        })
        .max(docMetaCurrent.maxLen, {
          message: `Must be at most ${docMetaCurrent.maxLen} characters`,
        })
        .regex(docMetaCurrent.pattern, { message: "Invalid format for this document" }),
    [docMetaCurrent],
  );

  function switchKind(next: VerificationKind) {
    setKind(next);
    setErrors({});
    setRecord(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (kind === "identity") {
      const docParse = docSchema.safeParse(docNumber);
      if (!docParse.success) nextErrors.docNumber = docParse.error.issues[0]?.message;
      if (lastName) {
        const lastNameParse = lastNameSchema.safeParse(lastName);
        if (!lastNameParse.success) nextErrors.lastName = lastNameParse.error.issues[0]?.message;
      }
    } else if (kind === "phone") {
      const idParse = nationalIdForPhoneSchema.safeParse(nationalId);
      if (!idParse.success) nextErrors.nationalId = idParse.error.issues[0]?.message;
      const mobileParse = mobileSchema.safeParse(mobileNumber);
      if (!mobileParse.success) nextErrors.mobileNumber = mobileParse.error.issues[0]?.message;
    } else {
      const regParse = registrationNumberSchema.safeParse(registrationNumber);
      if (!regParse.success) nextErrors.registrationNumber = regParse.error.issues[0]?.message;
    }

    const consentParse = consentSchema.safeParse(consent);
    if (!consentParse.success) nextErrors.consent = consentParse.error.issues[0]?.message;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setRecord(null);
    setSubmittedAt(new Date());

    try {
      if (kind === "identity") {
        const identifierType =
          docType === "alien_id"
            ? "krapinalien_id"
            : docType === "passport"
              ? "national_id"
              : docType;
        const result = await verifyIdentity({
          identifierType,
          identifierNumber: docNumber,
          lastName: lastName || undefined,
        });
        setRecord(result);
        notifyOutcome(result);
      } else if (kind === "phone") {
        const result = await verifyPhone({ nationalId, mobileNumber });
        setRecord(result);
        notifyOutcome(result);
      } else {
        const result = await verifyBusiness({ registrationNumber });
        setRecord(result);
        notifyOutcome(result);
      }
    } catch (err) {
      const message =
        err instanceof XobriqApiError ? err.message : "Something went wrong. Please try again.";
      toast.error("Verification failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  function notifyOutcome(result: VerificationOutcome<unknown>) {
    if (result.status === "failed") {
      toast.error("Verification failed", { description: result.errorMessage || undefined });
    } else if (result.matched) {
      toast.success("Match confirmed", { description: `Ref ${result.ref}` });
    } else {
      toast(`No match found — Ref ${result.ref}`);
    }
  }

  const reset = () => {
    setDocNumber("");
    setLastName("");
    setNationalId("");
    setMobileNumber("");
    setRegistrationNumber("");
    setConsent(false);
    setErrors({});
    setRecord(null);
    setSubmittedAt(null);
  };

  return (
    <PageShell
      activePath="/verify"
      title="New Verification"
      subtitle="Real-time identity, phone and business verification via Creditinfo"
    >
      <div className="mx-auto max-w-3xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Step {currentStep} of 3
            </div>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {record ? "Verification result" : "Start a new verification"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {record
                ? "Response received from Creditinfo. Review the outcome and audit trail."
                : "Choose a verification type and run it against the live Creditinfo sandbox."}
            </p>
          </div>
        </div>

        <StepProgress current={currentStep} />

        {record ? (
          <ResultStep record={record} kind={kind} submittedAt={submittedAt} onReset={reset} />
        ) : (
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-base">Enter customer details</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Data is transmitted over TLS and never stored beyond your retention policy.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-6 space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Verification type
                </Label>
                <Tabs value={kind} onValueChange={(v) => switchKind(v as VerificationKind)}>
                  <TabsList className="grid w-full grid-cols-3">
                    {(Object.keys(kindMeta) as VerificationKind[]).map((k) => {
                      const Icon = kindMeta[k].icon;
                      return (
                        <TabsTrigger key={k} value={k} className="gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{kindMeta[k].label}</span>
                          <span className="sm:hidden">{kindMeta[k].label.split(" ")[0]}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {kind === "identity" ? (
                  <IdentityFields
                    docType={docType}
                    setDocType={(t) => {
                      setDocType(t);
                      setDocNumber("");
                      setErrors((p) => ({ ...p, docNumber: undefined }));
                    }}
                    docNumber={docNumber}
                    setDocNumber={setDocNumber}
                    lastName={lastName}
                    setLastName={setLastName}
                    errors={errors}
                    setErrors={setErrors}
                  />
                ) : kind === "phone" ? (
                  <PhoneFields
                    nationalId={nationalId}
                    setNationalId={setNationalId}
                    mobileNumber={mobileNumber}
                    setMobileNumber={setMobileNumber}
                    errors={errors}
                    setErrors={setErrors}
                  />
                ) : (
                  <BusinessFields
                    registrationNumber={registrationNumber}
                    setRegistrationNumber={setRegistrationNumber}
                    errors={errors}
                    setErrors={setErrors}
                  />
                )}

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(v) => {
                        setConsent(!!v);
                        if (errors.consent) setErrors((p) => ({ ...p, consent: undefined }));
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium text-foreground">
                        I have the customer's consent
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        You confirm you have obtained explicit consent from the data subject as
                        required by the Kenya Data Protection Act, 2019.
                      </span>
                    </span>
                  </label>
                  {errors.consent ? (
                    <p className="mt-2 text-xs text-destructive">{errors.consent}</p>
                  ) : null}
                </div>

                {insufficientBalance ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    Insufficient wallet balance — top up to continue.{" "}
                    <Link to="/billing/top-up" className="underline underline-offset-2">
                      Top up now
                    </Link>
                  </p>
                ) : null}

                <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    Cost:{" "}
                    <span className="font-semibold text-foreground">
                      {cost !== null ? kes(cost) : "Not billed"}
                    </span>{" "}
                    · Wallet: {wallet ? kes(wallet.balance) : "—"}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || insufficientBalance}
                      className="gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        <>
                          Run verification
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function IdentityFields({
  docType,
  setDocType,
  docNumber,
  setDocNumber,
  lastName,
  setLastName,
  errors,
  setErrors,
}: {
  docType: DocType;
  setDocType: (t: DocType) => void;
  docNumber: string;
  setDocNumber: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  errors: Record<string, string | undefined>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
}) {
  const meta = docMeta[docType];
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Document type
        </Label>
        <Tabs value={docType} onValueChange={(v) => setDocType(v as DocType)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabsTrigger value="national_id" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">National </span>ID
            </TabsTrigger>
            <TabsTrigger value="alien_id" className="gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" />
              Alien ID
            </TabsTrigger>
            <TabsTrigger value="krapin" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              KRA PIN
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="dl" className="gap-1.5">
              <IdCard className="h-3.5 w-3.5" />
              Driving License
            </TabsTrigger>
            <TabsTrigger value="plate" className="gap-1.5">
              <Car className="h-3.5 w-3.5" />
              Plate
            </TabsTrigger>
            <TabsTrigger value="passport" disabled className="gap-1.5 opacity-50">
              <Globe2 className="h-3.5 w-3.5" />
              Passport
            </TabsTrigger>
          </TabsList>
          {(
            ["national_id", "alien_id", "krapin", "bank", "dl", "plate", "passport"] as DocType[]
          ).map((t) => (
            <TabsContent
              key={t}
              value={t}
              className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground"
            >
              <Info className="mr-1 inline h-3 w-3 -translate-y-px" />
              {docMeta[t].hint}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="docNumber">{meta.label} number</Label>
          <Input
            id="docNumber"
            value={docNumber}
            onChange={(e) => {
              setDocNumber(meta.normalize(e.target.value));
              if (errors.docNumber) setErrors((p) => ({ ...p, docNumber: undefined }));
            }}
            placeholder={meta.placeholder}
            inputMode={docType === "national_id" || docType === "alien_id" ? "numeric" : "text"}
            autoComplete="off"
            maxLength={meta.maxLen}
            aria-invalid={!!errors.docNumber}
            className={cn(
              "font-mono tracking-wide",
              errors.docNumber && "border-destructive focus-visible:ring-destructive",
            )}
          />
          {errors.docNumber ? (
            <p className="text-xs text-destructive">{errors.docNumber}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Example: {meta.example}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name (optional)</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value.slice(0, 60));
              if (errors.lastName) setErrors((p) => ({ ...p, lastName: undefined }));
            }}
            placeholder="e.g. Kamau"
            autoComplete="family-name"
            maxLength={60}
            aria-invalid={!!errors.lastName}
            className={cn(errors.lastName && "border-destructive focus-visible:ring-destructive")}
          />
          {errors.lastName ? (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Stored on the record for your reference — not sent to Creditinfo.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function PhoneFields({
  nationalId,
  setNationalId,
  mobileNumber,
  setMobileNumber,
  errors,
  setErrors,
}: {
  nationalId: string;
  setNationalId: (v: string) => void;
  mobileNumber: string;
  setMobileNumber: (v: string) => void;
  errors: Record<string, string | undefined>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="nationalId">National ID number</Label>
        <Input
          id="nationalId"
          value={nationalId}
          onChange={(e) => {
            setNationalId(e.target.value.replace(/\D/g, "").slice(0, 9));
            if (errors.nationalId) setErrors((p) => ({ ...p, nationalId: undefined }));
          }}
          placeholder="e.g. 29184023"
          inputMode="numeric"
          aria-invalid={!!errors.nationalId}
          className={cn(
            "font-mono tracking-wide",
            errors.nationalId && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.nationalId ? (
          <p className="text-xs text-destructive">{errors.nationalId}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            The ID the mobile number should be registered against.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mobileNumber">Mobile number</Label>
        <Input
          id="mobileNumber"
          value={mobileNumber}
          onChange={(e) => {
            setMobileNumber(e.target.value);
            if (errors.mobileNumber) setErrors((p) => ({ ...p, mobileNumber: undefined }));
          }}
          placeholder="e.g. 0723456789"
          inputMode="tel"
          aria-invalid={!!errors.mobileNumber}
          className={cn(
            "font-mono tracking-wide",
            errors.mobileNumber && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.mobileNumber ? (
          <p className="text-xs text-destructive">{errors.mobileNumber}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Example: 0723456789</p>
        )}
      </div>
    </div>
  );
}

function BusinessFields({
  registrationNumber,
  setRegistrationNumber,
  errors,
  setErrors,
}: {
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  errors: Record<string, string | undefined>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="registrationNumber">Business registration number</Label>
      <Input
        id="registrationNumber"
        value={registrationNumber}
        onChange={(e) => {
          setRegistrationNumber(e.target.value.toUpperCase().slice(0, 40));
          if (errors.registrationNumber)
            setErrors((p) => ({ ...p, registrationNumber: undefined }));
        }}
        placeholder="e.g. CPR/2014/475757"
        autoComplete="off"
        aria-invalid={!!errors.registrationNumber}
        className={cn(
          "font-mono tracking-wide",
          errors.registrationNumber && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {errors.registrationNumber ? (
        <p className="text-xs text-destructive">{errors.registrationNumber}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Checks registration status and returns beneficial owners via Creditinfo BRS/UBO.
        </p>
      )}
    </div>
  );
}

function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Customer details" },
    { n: 2, label: "Creditinfo match" },
    { n: 3, label: "Result & audit log" },
  ];
  return (
    <div className="my-5 flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-success bg-success text-success-foreground",
                active && "border-primary bg-primary text-primary-foreground",
                !done && !active && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? <span className="mx-2 h-px w-8 bg-border sm:w-12" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function buildAuditTrail(
  record: VerificationOutcome<unknown>,
  submittedAt: Date | null,
): AuditEntry[] {
  const entries: AuditEntry[] = [
    {
      time: submittedAt || new Date(record.createdAt),
      label: "Request received",
      detail: "Submitted from the Xobriq KYC dashboard",
      tone: "primary",
    },
    {
      time: new Date(record.createdAt),
      label: "Creditinfo query dispatched",
      detail: `Verification ref ${record.ref}`,
      tone: "primary",
    },
  ];

  if (record.status === "completed") {
    entries.push({
      time: record.completedAt ? new Date(record.completedAt) : new Date(),
      label: record.matched ? "Creditinfo match confirmed" : "Creditinfo returned no match",
      detail: `Completed in ${record.durationMs ? (record.durationMs / 1000).toFixed(1) : "?"}s`,
      tone: record.matched ? "success" : "warning",
    });
  } else {
    entries.push({
      time: record.completedAt ? new Date(record.completedAt) : new Date(),
      label: "Verification failed",
      detail: record.errorMessage || "Unknown error",
      tone: "warning",
    });
  }
  return entries;
}

function ResultStep({
  record,
  kind,
  submittedAt,
  onReset,
}: {
  record: VerificationOutcome<IdentityResult | PhoneResult | BusinessResult>;
  kind: VerificationKind;
  submittedAt: Date | null;
  onReset: () => void;
}) {
  const failed = record.status === "failed";
  const matched = !!record.matched;

  const tone = failed
    ? {
        badge: "bg-destructive/10 text-destructive border-destructive/30",
        ring: "text-destructive",
        text: "text-destructive",
        icon: XCircle,
        headline: "Verification could not be completed",
      }
    : matched
      ? {
          badge: "bg-success/10 text-success border-success/30",
          ring: "text-success",
          text: "text-success",
          icon: CheckCircle2,
          headline: "Matched against Creditinfo",
        }
      : {
          badge: "bg-warning/10 text-warning border-warning/40",
          ring: "text-warning",
          text: "text-warning",
          icon: AlertTriangle,
          headline: "No match found",
        };
  const StatusIcon = tone.icon;
  const statusLabel = failed ? "Failed" : matched ? "Matched" : "Not matched";
  const audit = buildAuditTrail(record, submittedAt);

  const copyRef = () => {
    navigator.clipboard.writeText(record.ref);
    toast.success("Reference copied");
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-card)]">
        <div
          className={cn(
            "flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
            !failed && matched && "bg-success/5",
            !failed && !matched && "bg-warning/5",
            failed && "bg-destructive/5",
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background",
                tone.text,
              )}
            >
              <StatusIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("font-semibold", tone.badge)}>
                  {statusLabel}
                </Badge>
                <span className="text-sm font-medium text-foreground">{tone.headline}</span>
              </div>
              <h2 className="mt-1 truncate text-lg font-semibold">
                {resultHeadline(kind, record)}
              </h2>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {kindMeta[kind].label} verification
              </div>
            </div>
          </div>
          <ConfidenceGauge matched={!failed && matched} tone={tone.ring} />
        </div>

        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:p-6">
          <MetaField
            label="Reference"
            value={
              <button
                onClick={copyRef}
                className="inline-flex items-center gap-1.5 font-mono text-sm text-foreground hover:text-primary"
              >
                {record.ref}
                <Copy className="h-3 w-3" />
              </button>
            }
          />
          <MetaField
            label="Completed"
            value={record.completedAt ? formatDateTime(new Date(record.completedAt)) : "—"}
          />
          <MetaField
            label="Latency"
            value={record.durationMs ? `${(record.durationMs / 1000).toFixed(1)}s` : "—"}
          />
          <MetaField label="Source" value="Creditinfo · Sandbox" />
        </CardContent>
      </Card>

      {failed ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-[var(--shadow-card)]">
          <CardContent className="p-5 text-sm text-destructive sm:p-6">
            {record.errorMessage}
          </CardContent>
        </Card>
      ) : (
        <ResultDetails kind={kind} record={record} />
      )}

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Audit log</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <ol className="relative space-y-4 border-l border-border pl-5">
            {audit.map((entry, idx) => (
              <li key={idx} className="relative">
                <span
                  className={cn(
                    "absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-background",
                    entry.tone === "primary" && "bg-primary",
                    entry.tone === "success" && "bg-success",
                    entry.tone === "warning" && "bg-warning",
                    entry.tone === "muted" && "bg-muted-foreground/50",
                  )}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">{entry.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {formatTime(entry.time)}
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {failed
            ? "Not billed — verification did not complete"
            : "KES 35.00 debited from wallet · New balance KES 128,415.00"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => toast.success("Report exported")}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" asChild className="gap-1.5">
            <Link to="/verifications">
              <FileText className="h-4 w-4" />
              View in verifications
            </Link>
          </Button>
          <Button onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            New verification
          </Button>
        </div>
      </div>
    </div>
  );
}

function resultHeadline(
  kind: VerificationKind,
  record: VerificationOutcome<IdentityResult | PhoneResult | BusinessResult>,
) {
  if (record.status === "failed" || !record.result) return "—";
  if (kind === "identity") return (record.result as IdentityResult).fullName || "—";
  if (kind === "phone") return (record.result as PhoneResult).mobileNumber || "—";
  return (record.result as BusinessResult).businessName || "—";
}

function ResultDetails({
  kind,
  record,
}: {
  kind: VerificationKind;
  record: VerificationOutcome<IdentityResult | PhoneResult | BusinessResult>;
}) {
  if (kind === "identity") {
    const result = record.result as IdentityResult;
    const checks = buildIdentityChecks(result);
    // `fields` is only present on records verified after this was added —
    // older records fall back to the fixed national_id/alien_id field set.
    const fields =
      result.fields && result.fields.length > 0
        ? result.fields
        : [
            { label: "First name", value: result.firstName || "—" },
            { label: "Last name", value: result.lastName || "—" },
            { label: "Gender", value: result.gender || "—" },
            { label: "Date of birth", value: result.dateOfBirth || "—" },
            { label: "Citizenship", value: result.citizenship || "—" },
            { label: "ID number", value: result.idNumber || "—" },
          ];
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Applicant details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-5">
            {fields.map((f) => (
              <MetaField key={f.label} label={f.label} value={f.value || "—"} />
            ))}
          </CardContent>
        </Card>
        <ChecksCard checks={checks} />
      </div>
    );
  }

  if (kind === "phone") {
    const result = record.result as PhoneResult;
    const checks: CheckRow[] = [
      {
        label: "Mobile number match",
        status: result.matched ? "pass" : "fail",
        detail: result.matched
          ? `${result.mobileNumber} confirmed against the provided National ID`
          : "Creditinfo did not confirm this number against the provided ID",
      },
    ];
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Phone details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-5">
            <MetaField label="Mobile number" value={result.mobileNumber || "—"} />
            <MetaField label="Status" value={result.matched ? "Matched" : "Not matched"} />
          </CardContent>
        </Card>
        <ChecksCard checks={checks} />
      </div>
    );
  }

  const result = record.result as BusinessResult;
  const checks: CheckRow[] = [
    {
      label: "Registration status",
      status: result.matched ? "pass" : "fail",
      detail: result.status ? `Status: ${result.status}` : "No registration status returned",
    },
  ];
  if (result.beneficialOwners.length > 0) {
    checks.push({
      label: "Beneficial owners",
      status: "pass",
      detail: `${result.beneficialOwners.length} beneficial owner(s) returned`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Business details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <MetaField label="Business name" value={result.businessName || "—"} />
            <MetaField label="Status" value={result.status || "—"} />
            <MetaField label="Registration date" value={result.registrationDate || "—"} />
            <MetaField label="Physical address" value={result.physicalAddress || "—"} />
            <MetaField label="Postal address" value={result.postalAddress || "—"} />
          </CardContent>
        </Card>
        <ChecksCard checks={checks} />
      </div>

      {result.beneficialOwners.length > 0 ? (
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm">Beneficial owners</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {result.beneficialOwners.map((owner: BeneficialOwner, i: number) => (
              <div key={i} className="grid grid-cols-2 gap-3 px-5 py-3 sm:grid-cols-4">
                <MetaField label="Name" value={owner.name || "—"} />
                <MetaField label="Role" value={owner.role || "—"} />
                <MetaField label="ID number" value={owner.idNumber || "—"} />
                <MetaField
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

function buildIdentityChecks(result: IdentityResult): CheckRow[] {
  return [
    {
      label: "Creditinfo record found",
      status: result.matched ? "pass" : "fail",
      detail: result.matched
        ? "Matched to a live Creditinfo record"
        : "No matching record returned",
    },
  ];
}

function ChecksCard({ checks }: { checks: CheckRow[] }) {
  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Verification checks</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 p-0">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{c.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.detail}</div>
            </div>
            <CheckPill status={c.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConfidenceGauge({ matched, tone }: { matched: boolean; tone: string }) {
  const score = matched ? 100 : 0;
  const size = 88;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex items-center gap-3 self-start rounded-xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            className="stroke-muted"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            className={cn("transition-all", tone)}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold leading-none">{matched ? "Match" : "No match"}</span>
        </div>
      </div>
      <div className="hidden text-xs text-muted-foreground sm:block">
        <div className="font-semibold uppercase tracking-wide text-foreground">Creditinfo</div>
        <div>Real-time result</div>
      </div>
    </div>
  );
}

function CheckPill({ status }: { status: CheckStatus }) {
  if (status === "pass") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <Check className="h-3 w-3" />
        Pass
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        <AlertTriangle className="h-3 w-3" />
        Review
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
      <XCircle className="h-3 w-3" />
      Fail
    </span>
  );
}

function MetaField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-sm text-foreground">{value}</div>
    </div>
  );
}

function formatDateTime(d: Date) {
  return d.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
