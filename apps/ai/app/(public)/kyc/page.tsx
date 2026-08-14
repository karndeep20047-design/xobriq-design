"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KycProcessVisual } from "@/components/ai/KycProcessVisual";
import { KycDashboardDemo } from "@/components/ai/KycDashboardDemo";
import { docMeta, DOC_TYPE_ORDER } from "@/lib/kyc/document-types";
import {
  Phone, Building2, Database, ShieldCheck,
  CheckCircle2, Code2, Gauge, UserCheck, ScanFace,
} from "lucide-react";

export default function KycPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <KycHero />
      <LiveDemo />
      <VerificationTypes />
      <TrustAndRisk />
      <DeveloperAPI />
      <KycCTA />
    </div>
  );
}

function KycHero() {
  return (
    <section className="relative overflow-hidden bg-[#040B1D] text-white border-b border-blue-500/10">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 min-h-[600px] lg:min-h-[685px]">
        
        {/* Left Column: Text Content with darker tone overlay */}
        <div className="flex flex-col justify-center px-6 py-12 lg:py-20 lg:pr-16 lg:pl-8 lg:border-r lg:border-blue-500/10 bg-[#030918]/60 text-center lg:text-left z-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-0 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] text-white"
          >
            Xobriq KYC:{" "}
            <span className="relative inline-block whitespace-nowrap">
              Identity Verified
              <svg
                className="absolute left-0 -bottom-2 w-full h-3 text-emerald-500 overflow-visible"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M 1,5 Q 25,1 50,6 T 99,5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
                />
              </svg>
            </span>{" "}
            in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              Seconds
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-base leading-relaxed text-slate-300 max-w-xl mx-auto lg:mx-0"
          >
            AI-powered identity verification backed by IPRS, Kenya&apos;s national identity registry. National ID, KRA PIN, phone, and business (KYB) checks, matched against a live government record, not a guess.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto text-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              Get API Access
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto text-center rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:text-white"
            >
              Documentation
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-slate-400"
          >
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Live IPRS registry match</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Under 2s decisions</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Sandbox in minutes</span>
          </motion.div>
        </div>

        {/* Right Column: Floating Animation Panel */}
        <div className="flex items-center justify-center p-8 lg:p-16 bg-transparent z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full max-w-md lg:max-w-none"
          >
            <KycProcessVisual />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function LiveDemo() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">See It In Action</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            A live look at the Xobriq KYC dashboard — sign in, submit a verification, and watch it get matched against IPRS in real time.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-12 max-w-3xl"
        >
          <KycDashboardDemo />
        </motion.div>
      </div>
    </section>
  );
}

type VerificationType = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent: "blue" | "red" | "teal" | "orange";
};

// Tailwind can't see classes built from a runtime string (`text-${accent}-500`
// gets purged), so each accent is spelled out in full ahead of time and
// looked up by key instead.
const ACCENTS = {
  blue: {
    icon: "text-xblue-400",
    ring: "hover:border-xblue-500/40 hover:shadow-[0_20px_50px_-24px_rgba(42,104,168,0.55)]",
    line: "bg-xblue-500",
  },
  red: {
    icon: "text-xred-500",
    ring: "hover:border-xred-500/40 hover:shadow-[0_20px_50px_-24px_rgba(178,34,34,0.5)]",
    line: "bg-xred-500",
  },
  teal: {
    icon: "text-xteal-500",
    ring: "hover:border-xteal-500/40 hover:shadow-[0_20px_50px_-24px_rgba(10,126,106,0.5)]",
    line: "bg-xteal-500",
  },
  // Business (KYB) — was xgreen, which reads too close to the Phone card's
  // teal at a glance. Orange isn't in the custom "x" palette, so this one
  // uses Tailwind's stock scale directly.
  orange: {
    icon: "text-orange-500 dark:text-orange-400",
    ring: "hover:border-orange-500/40 hover:shadow-[0_20px_50px_-24px_rgba(234,88,12,0.5)]",
    line: "bg-orange-500",
  },
} as const;

// The four checks Xobriq KYC actually runs. Document-level detail (National
// ID, Alien ID, KRA PIN, etc.) lives one tier down, under "Identity" — see
// the chip row below, sourced from the same docMeta the verify form and ID
// scan dialog use, so this marketing page can never quietly drift out of
// sync with what the API actually accepts.
const VERIFICATION_TYPES: VerificationType[] = [
  { Icon: UserCheck, title: "Identity", body: "OCR plus live registry match across six Kenyan document types, verified against IPRS in real time.", accent: "blue" },
  { Icon: ScanFace, title: "Deepfake & Liveness", body: "AI-powered liveness and deepfake detection catches synthetic faces and spoofed selfies before they reach onboarding.", accent: "red" },
  { Icon: Phone, title: "Phone Number", body: "Subscriber verification and ownership matching to cut down on account-takeover and mule-account fraud.", accent: "teal" },
  { Icon: Building2, title: "Business (KYB)", body: "Company registration, directors, and beneficial-ownership checks for onboarding corporate clients.", accent: "orange" },
];

function VerificationTypes() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">One API, Every Verification Type</h2>
          <p className="mx-auto mt-3 max-w-lg text-enterprise-fg-muted">
            Deepfake, identity, phone and business checks. One API, zero extra vendors.
          </p>
        </div>

        {/* Tier 1 — the four checks Xobriq KYC runs, each carrying its own
            accent so they read as distinct categories rather than four
            identical green cards. */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VERIFICATION_TYPES.map((v, i) => {
            const a = ACCENTS[v.accent];
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={
                  "group relative overflow-hidden rounded-2xl border border-enterprise-border bg-enterprise-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 " +
                  a.ring
                }
              >
                <span
                  aria-hidden
                  className={
                    "absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 " +
                    a.line
                  }
                />
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <v.Icon className={"h-7 w-7 " + a.icon} />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{v.title}</h3>
                <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">{v.body}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tier 2 — every live document type Identity verification accepts,
            as a grid of icon tiles rather than a flat pill row, so each one
            reads as its own item instead of blurring into a wrapped line of
            text. Filtered to supported types only — docMeta still lists
            Passport as unsupported, so it's excluded rather than shown as
            a placeholder. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-5 rounded-2xl border border-enterprise-border bg-enterprise-surface p-7 shadow-sm sm:p-8"
        >
          <p className="label-caps text-enterprise-fg-subtle">Identity verification covers</p>
          <DocumentTypeChips />
        </motion.div>
      </div>
    </section>
  );
}

// Idle "showcase" sweep — walks the active/hover look down the row one tile
// at a time, then back, on a timer, so the row demonstrates its own
// interaction instead of sitting static until someone happens to hover it.
// A real :hover still applies independently on top of this. Skips the timer
// entirely under prefers-reduced-motion — the tiles are still fully usable,
// just static.
function DocumentTypeChips() {
  const docs = DOC_TYPE_ORDER.filter((key) => docMeta[key].supported);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let i = 0;
    let direction = 1;
    const id = setInterval(() => {
      if (i === docs.length - 1) direction = -1;
      else if (i === 0) direction = 1;
      i += direction;
      setActiveIndex(i);
    }, 600);

    return () => clearInterval(id);
  }, [docs.length]);

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {docs.map((key, i) => {
        const d = docMeta[key];
        const DocIcon = d.icon;
        const isActive = i === activeIndex;
        return (
          <div
            key={key}
            title={d.label}
            className={
              "group flex items-center gap-3 rounded-xl border border-enterprise-border bg-enterprise-bg-low p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-xgreen-500/35 hover:bg-xgreen-500/[0.05] hover:shadow-[0_14px_30px_-16px_rgba(26,125,60,0.45)] " +
              (isActive ? "-translate-y-0.5 border-xgreen-500/35 bg-xgreen-500/[0.05] shadow-[0_14px_30px_-16px_rgba(26,125,60,0.45)]" : "")
            }
          >
            <DocIcon className="h-5 w-5 shrink-0 text-xgreen-500" />
            <span className="text-sm font-semibold leading-tight text-enterprise-fg">{d.shortLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrustAndRisk() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">A Real Registry, Not a Guess</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            Every match is against a live government or telco record, then scored for risk alongside Xobriq Guard&apos;s fraud signals.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-panel rounded-2xl p-8"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-xgreen-500">
              <Database className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">IPRS-Backed Verification</h3>
            <p className="mt-3 text-sm text-enterprise-fg-muted">
              National ID lookups query Kenya&apos;s Integrated Population Registration System directly — a live match, not a document-only OCR guess.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-xgreen-500" />Live national registry match</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-xgreen-500" />Sandbox and production environments</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-xgreen-500" />Full audit trail on every request</li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel rounded-2xl p-8"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-primary">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Fraud & Risk Signals</h3>
            <p className="mt-3 text-sm text-enterprise-fg-muted">
              Every verification is scored against Xobriq Guard&apos;s fraud-signal model, so a matched identity still surfaces a risk score you can act on.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-primary" />Real-time risk scoring</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-primary" />Fraud-alert flagging on mismatches</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-primary" />Wallet-metered, pay-per-verification pricing</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DeveloperAPI() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Integrate in Minutes</h2>
          <p className="mt-4 max-w-xl text-enterprise-fg-muted">
            One REST endpoint per verification type, authenticated with your API key. Generate sandbox keys instantly from your dashboard and move to production once you&apos;re ready — no code changes required.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["National ID", "KRA PIN", "Phone", "Business (KYB)"].map((t) => (
              <span key={t} className="rounded-md border border-enterprise-border bg-enterprise-bg-low px-3 py-1 text-xs font-medium">{t}</span>
            ))}
          </div>
        </div>
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-enterprise-border bg-enterprise-bg-lower px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
            </div>
            <span className="font-mono text-xs text-enterprise-fg-muted">verify_identity.sh</span>
            <Code2 className="ml-auto h-3.5 w-3.5 text-enterprise-fg-subtle" />
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 sm:text-sm">
{`curl -X POST https://xobriq.ai/api/v1/kyc/verify-identity \\
  -H "Authorization: Bearer xob_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "identifierType": "national_id",
    "identifierNumber": "3xxxxxxx"
  }'`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function KycCTA() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/12 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-14">
        <ShieldCheck className="mx-auto h-10 w-10 text-xgreen-500" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Verify Identities in Under 2 Seconds.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-enterprise-fg-muted">
          Get sandbox API keys today and go live once your integration is ready — no waiting on a sales call to start building.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Request Access</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Talk to Sales</Link>
        </div>
      </div>
    </section>
  );
}
