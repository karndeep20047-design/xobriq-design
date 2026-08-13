"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { KycProcessVisual } from "@/components/ai/KycProcessVisual";
import { KycDashboardDemo } from "@/components/ai/KycDashboardDemo";
import {
  IdCard, Phone, Building2, FileText, Database, ShieldCheck,
  CheckCircle2, Code2, Gauge, ScanFace, ArrowUpRight,
} from "lucide-react";
import { fadeInUp, staggerFast } from "@/components/ai/animations";

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
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-28">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-xgreen-500/10 blur-[140px]" />
      <div className="container-narrow relative text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Xobriq KYC: <span className="brand-gradient">Identity Verified in Seconds</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-7 text-enterprise-fg-muted sm:text-lg"
        >
          AI-powered identity verification backed by IPRS, Kenya&apos;s national identity registry. National ID, KRA PIN, phone, and business (KYB) checks — matched against a live government record, not a guess.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover">
            <IdCard className="h-4 w-4" /> Get API Access
          </Link>
          <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-6 py-3 text-sm font-semibold hover:border-enterprise-border-strong">
            <FileText className="h-4 w-4" /> Documentation
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-14 max-w-4xl text-left"
        >
          <KycProcessVisual />
        </motion.div>
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

type VerificationCategory = {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  chips: string[];
  span: string;
  iconClass: string;
};

// Mirrors the real picker in the verify dashboard (VerifyClient.tsx —
// kindMeta for the three categories, docMeta/DOC_TYPE_ORDER for the six
// identity-document types it accepts). Passport is deliberately left off:
// docMeta marks it unsupported, so it isn't claimed here either.
const VERIFICATION_CATEGORIES: VerificationCategory[] = [
  {
    Icon: IdCard,
    title: "Identity Documents",
    body: "OCR-scanned or manually entered, matched directly against Kenya's IPRS registry — name, number, and status confirmed live.",
    chips: ["National ID", "Alien ID", "KRA PIN", "Bank Account", "Driving License", "Vehicle Plate"],
    span: "lg:col-span-2",
    iconClass: "text-xgreen-500",
  },
  {
    Icon: Phone,
    title: "Phone Number",
    body: "Subscriber verification and ownership matching to cut down on account-takeover and mule-account fraud.",
    chips: ["Mobile subscriber lookup"],
    span: "lg:col-span-1",
    iconClass: "text-enterprise-primary",
  },
  {
    Icon: Building2,
    title: "Business (KYB)",
    body: "Company registration, directors, and beneficial-ownership checks for onboarding corporate clients.",
    chips: ["Registration lookup", "Beneficial owners"],
    span: "lg:col-span-1",
    iconClass: "text-amber-500",
  },
];

const revealViewport = { once: true, amount: 0.35 } as const;

const iconAnimation: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.08, rotate: -4, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* Faint dot-grid backdrop, feathered at the edges — same visual language as
   the x-system landing sections (PillarGrid), scoped locally here since the
   rest of this page still runs the older enterprise-*/glass-panel styling. */
function SectionBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const amp = prefersReducedMotion ? 0 : 1;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-40 * amp, 40 * amp]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      <div className="x-grid-bg absolute inset-0 opacity-90" />
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_srgb,var(--x-accent)_18%,transparent),transparent_70%)]" />
      <motion.div
        style={{ y }}
        className="absolute left-1/2 top-0 h-[140%] w-px -translate-x-1/2 bg-x-accent/20"
      />
    </div>
  );
}

function VerificationTypes() {
  return (
    <section className="relative overflow-hidden bg-x-bg px-5 py-20 transition-colors duration-150 sm:px-6 lg:py-28">
      <SectionBackdrop />

      <div className="container-medium relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-sm font-semibold uppercase tracking-[0.22em] text-x-accent"
          >
            What We Verify
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl"
          >
            One API, every verification type.
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-base text-x-muted sm:text-lg">
            A single integration covers the identity, phone, and business checks East African
            businesses actually need — six document types under one identity endpoint, no
            separate vendor per document.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3"
        >
          {VERIFICATION_CATEGORIES.map((v) => (
            <motion.div key={v.title} variants={fadeInUp} whileHover="hover" className={v.span}>
              <div className="group relative flex h-full flex-col rounded-lg border border-x-line bg-x-bg p-7 transition-all duration-300 hover:-translate-y-1 hover:border-x-line-strong hover:bg-x-raised hover:shadow-[0_20px_44px_-22px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_20px_44px_-18px_rgba(0,0,0,0.7)]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 rounded-t-lg bg-x-accent transition-transform duration-500 group-hover:scale-x-100"
                />
                <motion.div variants={iconAnimation}>
                  <v.Icon className={"h-7 w-7 " + v.iconClass} />
                </motion.div>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-x-fg">
                  {v.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-x-muted">{v.body}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {v.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-x-line bg-x-raised px-2.5 py-1 font-mono text-[11px] text-x-muted transition-colors group-hover:border-x-line-strong group-hover:text-x-fg"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Cross-sell: liveness/deepfake screening is a Xobriq Guard
              capability, not part of this KYC endpoint's IPRS-backed
              checks — called out separately rather than folded in, so the
              page doesn't overclaim what this API does on its own. */}
          <motion.div variants={fadeInUp} className="lg:col-span-3">
            <Link
              href="/guard"
              className="group flex flex-col items-start gap-4 rounded-lg border border-dashed border-x-line bg-x-raised/40 p-6 transition-all duration-300 hover:border-x-accent/40 hover:bg-x-raised sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <ScanFace className="h-7 w-7 shrink-0 text-purple-500" />
                <div>
                  <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-x-fg">
                    Need liveness or deepfake screening too?
                  </h3>
                  <p className="mt-1 text-sm text-x-muted">
                    Face-match, liveness, and deepfake detection run through Xobriq Guard — pair
                    it with KYC for a complete identity and fraud stack.
                  </p>
                </div>
              </div>
              <span className="x-label inline-flex shrink-0 items-center gap-1.5 text-x-accent">
                Explore Xobriq Guard
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
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
