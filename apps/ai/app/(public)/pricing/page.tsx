// ============================================================================
//  /pricing — Engagement-based, not a price list.
// ============================================================================
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/components/ai/animations";

// ───────────────────────────── PILLAR TABS DATA ─────────────────────────────
const pillarTabs = [
  { id: "cloud", label: "Cloud · GPU" },
  { id: "guard", label: "Guard" },
  { id: "agentic", label: "Agentic" },
  { id: "consult", label: "Consult" },
  { id: "cyber", label: "Cyber" },
];

const PRODUCTS = ["Xobriq Guard", "Xobriq KYC", "Agentic AI", "Xobriq Cloud", "Xobriq Consult", "Xobriq Cyber"];

// ───────────────────────────── XOBRIQ CLOUD GPUs ────────────────────────────
const gpus = [
  {
    name: "Shared Partition",
    desc: "MIG-isolated slice on H200 for startups, researchers, individual ML practitioners.",
    features: [
      "CUDA, PyTorch, TensorFlow pre-installed",
      "HuggingFace integrations",
      "Per-second billing",
      "Sub-20ms latency from Nairobi",
    ],
  },
  {
    name: "Reserved H200",
    desc: "Reserved monthly H200 capacity at a discount for predictable training workloads.",
    featured: true,
    features: [
      "8× H200 SXM · 141GB HBM3e each",
      "1 PetaFLOP AI compute",
      "Discounted vs on-demand",
      "Reserved capacity guarantee",
    ],
  },
  {
    name: "On-Demand H200",
    desc: "Full DGX H200 access on demand. Best for production inference + bursty training.",
    features: [
      "NVLink interconnect",
      "MIG partitioning available",
      "99.9% uptime SLA",
      "Triton multi-model serving",
    ],
  },
];

const managedCloud = [
  {
    name: "Managed AI Training",
    desc: "End-to-end pipeline management — data ingestion, training, hyperparam tuning, evaluation. MLflow + DVC tracking.",
  },
  {
    name: "Managed Inference Hosting",
    desc: "NVIDIA Triton multi-model serving, dedicated endpoints, ONNX portability, 99.9% uptime, sub-100ms p95 latency.",
  },
  {
    name: "Sovereign Enterprise Hosting",
    desc: "Dedicated MIG partition, Kenya DPA compliance, Zero Trust + Keycloak IAM, AES-256 at rest, TLS 1.3 in transit.",
  },
];

// ────────────────────────────── XOBRIQ GUARD ────────────────────────────────
const guardTiers = [
  {
    name: "Sandbox",
    price: "Free",
    unit: "for evaluation",
    desc: "Test Guard against synthetic data.",
    features: [
      "10,000 test API calls / month",
      "All Guard signals available",
      "Documentation + sample SDKs",
      "Community support",
    ],
    cta: { href: "/developers", label: "Get sandbox key" },
  },
  {
    name: "Growth",
    desc: "For fintechs and growing banks. Usage-based, scoped to your call volume.",
    featured: true,
    features: [
      "Production API keys",
      "Fraud, deepfake, identity, behavioural engines",
      "99.9% uptime SLA",
      "Case management module",
      "Email + Slack support",
    ],
    cta: { href: "/contact?type=pricing_inquiry&product=Xobriq+Guard", label: "Talk to sales" },
  },
  {
    name: "Enterprise",
    desc: "For banks, telcos, governments.",
    features: [
      "Dedicated MIG-isolated infrastructure",
      "Custom model fine-tuning on your data",
      "On-premise deployment option",
      "Named CSM + 24/7 incident response",
      "CBK / CMA compliance support",
    ],
    cta: { href: "/contact?type=pricing_inquiry&product=Xobriq+Guard", label: "Request quote" },
  },
];

// ───────────────────────────── XOBRIQ AGENTIC ───────────────────────────────
const agenticServices = [
  {
    name: "Autonomous Fraud Investigation Agent",
    desc: "From signal to evidence report in under 60 seconds. Reduces analyst workload 60–80%.",
  },
  {
    name: "KYC & Onboarding Agent",
    desc: "ID + liveness + sanctions + PEP + adverse media in under 5 minutes.",
  },
  {
    name: "Compliance Reporting Agent",
    desc: "Auto-generates SARs, CTRs, periodic returns under CBK / CMA / FCA frameworks.",
  },
  {
    name: "Security Operations Agent",
    desc: "SIEM monitoring, alert triage, automated containment.",
  },
  {
    name: "Custom Agent System",
    desc: "Bespoke agent design + fine-tuning + deployment + staff transition support.",
    featured: true,
  },
];

// ───────────────────────────── XOBRIQ CONSULT ───────────────────────────────
const consultEngagements = [
  {
    name: "AI Maturity Assessment",
    unit: "Timeline · 3–4 weeks",
    desc: "Entry product. Scored report across data, governance, infrastructure, talent. 12-month roadmap.",
    featured: true,
  },
  {
    name: "AI Fraud Strategy Advisory",
    unit: "12-week engagement",
    desc: "Board-level fraud posture assessment. Quantifies loss, maps to CBK/CMA, transformation roadmap.",
  },
  {
    name: "Fraud Detection Implementation",
    desc: "End-to-end Guard or custom ML deployment. Core banking integration. Analyst training. 90-day support.",
  },
  {
    name: "Custom ML Model Development",
    desc: "Credit risk, churn, claims fraud, clinical decision support, procurement anomaly detection.",
  },
  {
    name: "MLOps as a Managed Service",
    unit: "per month per client",
    desc: "Continuous monitoring (Evidently AI), automated retraining, MLflow versioning, monthly reports.",
  },
  {
    name: "AI Strategy & Transformation",
    desc: "Enterprise opportunity mapping, governance design, talent assessment, regulatory readiness.",
  },
  {
    name: "Data Engineering & Pipelines",
    desc: "Data lakes, ETL/ELT, feature stores, real-time Kafka streaming, data quality frameworks.",
  },
  {
    name: "AI Governance & Ethics",
    unit: "per audit",
    desc: "Bias audit, adversarial robustness, regulatory mapping, vendor assessments.",
  },
  {
    name: "AI Training & Capability Building",
    unit: "session or annual program",
    desc: "Executive AI literacy, MLOps training, responsible AI workshops.",
  },
];

// ───────────────────────────── XOBRIQ CYBER ─────────────────────────────────
const cyberServices = [
  {
    name: "Penetration Testing",
    desc: "Black, grey, white box. API security testing for banking/fintech. Social engineering. CVSS-rated reports.",
  },
  {
    name: "Managed SIEM & Threat Monitoring",
    unit: "per month",
    desc: "Wazuh on H200, AI alert triage, MITRE ATT&CK rules, 24/7 monitoring, Grafana dashboards.",
    featured: true,
  },
  {
    name: "Incident Response Retainer",
    unit: "annual retainer",
    desc: "First call on breach. 2-hour SLA. Forensics, containment, CBK / CMA notification support.",
  },
  {
    name: "AI Security Auditing",
    unit: "per audit",
    desc: "Adversarial robustness, model security, bias testing, third-party vendor assessments.",
  },
  {
    name: "ISO 27001 Readiness",
    desc: "Full gap analysis, ISMS docs, internal audit, advisory through external certification.",
  },
  {
    name: "Cybersecurity AI Advisory",
    unit: "ongoing",
    desc: "AI threat detection strategy, SecOps automation design, quarterly threat briefings, board sessions.",
  },
];

// How we price — replaces the stripped-out numbers with the actual philosophy
const principles = [
  {
    title: "Engagement-based, not seat-based",
    desc: "You pay for the outcome you need — a GPU-hour, a completed audit, a live production integration — never a per-seat license fee for software sitting idle.",
  },
  {
    title: "Scoped after a real conversation",
    desc: "A number without context about your volume, risk profile, and infrastructure is a guess. We'd rather scope it properly than publish a rate card that's wrong for most enterprises.",
  },
  {
    title: "No hidden fees",
    desc: "No ingress/egress surcharges, no per-seat add-ons, no surprise renewal terms. What we scope with you is what you're billed.",
  },
  {
    title: "Built for enterprise procurement",
    desc: "Custom contracts, invoicing terms, and compliance documentation (Kenya DPA, ISO 27001 readiness) that fit how banks and governments actually buy software.",
  },
];

const scopingSteps = [
  { num: "01", title: "Discovery call", desc: "30 minutes — your volume, fraud rate, infrastructure, and compliance requirements." },
  { num: "02", title: "Scoping workshop", desc: "We map your requirements to the right products and engagement model." },
  { num: "03", title: "Custom proposal", desc: "A written quote scoped to your actual usage — no rate-card guesswork." },
  { num: "04", title: "Kickoff", desc: "Contracts signed, environments provisioned, named team assigned." },
];

// ════════════════════════════════════════════════════════════════════════════
//  COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

type Tier = {
  name: string;
  desc?: string;
  price?: string;
  unit?: string;
  featured?: boolean;
  features?: string[];
  cta?: { href: string; label: string };
};

function TierCard({ tier }: { tier: Tier }) {
  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -6 }}
      className={
        "flex h-full flex-col rounded-3xl border p-6 sm:p-8 " +
        (tier.featured
          ? "border-enterprise-primary/60 bg-enterprise-primary/5 shadow-glow"
          : "border-border bg-bg-subtle")
      }
    >
      {tier.featured && (
        <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-enterprise-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-enterprise-accent">
          <Sparkles className="h-3 w-3" /> Most popular
        </div>
      )}

      <h3 className="text-xl font-bold">{tier.name}</h3>
      {tier.desc && <p className="mt-1 text-sm text-fg-muted">{tier.desc}</p>}

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-2xl font-black sm:text-3xl">{tier.price || "Custom"}</span>
      </div>
      {tier.unit && <span className="text-sm text-fg-subtle">{tier.unit}</span>}

      {tier.features && (
        <ul className="mt-6 space-y-2 text-sm">
          {tier.features.map((f: string) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-xteal-500" />
              <span className="text-fg-muted">{f}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={tier.cta?.href || "/contact?type=pricing_inquiry"}
        className={
          "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition " +
          (tier.featured
            ? "glow-hover bg-enterprise-primary text-enterprise-on-primary hover:bg-enterprise-primary-hover"
            : "border border-border bg-bg hover:bg-bg-elevated")
        }
      >
        {tier.cta?.label || "Request quote"} <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.article>
  );
}

function ServiceRow({ s }: { s: Tier }) {
  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -3 }}
      className={
        "rounded-2xl border p-6 " +
        (s.featured
          ? "border-enterprise-primary/40 bg-enterprise-primary/5"
          : "border-border bg-bg-subtle")
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h3 className="font-bold">{s.name}</h3>
          <p className="mt-2 text-sm leading-6 text-fg-muted">{s.desc}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <span className="label-caps-thin rounded-full bg-enterprise-accent/15 px-3 py-1 text-enterprise-accent">
            Custom
          </span>
          {s.unit && <span className="text-xs text-fg-subtle">{s.unit}</span>}
        </div>
      </div>
    </motion.article>
  );
}

function ProductPicker() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));
  };

  const href =
    selected.length === 1
      ? `/contact?type=pricing_inquiry&product=${encodeURIComponent(selected[0])}`
      : "/contact?type=pricing_inquiry";

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8">
      <p className="label-caps-thin text-enterprise-accent">Build your quote</p>
      <h3 className="mt-2 text-xl font-bold">What are you interested in?</h3>
      <p className="mt-2 text-sm text-fg-muted">
        Select as many as apply — we&apos;ll scope a single conversation around all of them.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRODUCTS.map((p) => {
          const active = selected.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={
                "rounded-xl border px-4 py-3 text-sm font-semibold transition " +
                (active
                  ? "border-enterprise-primary bg-enterprise-primary/10 text-enterprise-primary"
                  : "border-border bg-bg hover:border-enterprise-primary/40")
              }
            >
              {p}
            </button>
          );
        })}
      </div>

      <Link
        href={href}
        aria-disabled={selected.length === 0}
        className={
          "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold transition sm:w-auto " +
          (selected.length === 0
            ? "pointer-events-none border border-border bg-bg-subtle text-fg-subtle"
            : "glow-hover bg-enterprise-primary text-enterprise-on-primary hover:bg-enterprise-primary-hover")
        }
      >
        Request this quote <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-3 text-xs text-fg-subtle">No commitment. Just a conversation.</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function PricingPage() {
  return (
    <>
      {/* HERO */}
      <section className="noise-bg relative overflow-hidden px-5 pt-20 pb-12 sm:px-6 md:pt-24">
        <div
          className="hero-orb"
          style={{
            top: "-100px",
            left: "-100px",
            width: "360px",
            height: "360px",
            background: "rgba(154, 109, 0, 0.25)",
          }}
        />
        <div className="relative mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}>
            <motion.p variants={fadeInUp} className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-accent">
              Pricing
            </motion.p>
            <motion.h1 variants={fadeInUp} className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
              Custom-scoped.{" "}
              <span className="brand-gradient">Built for African enterprise.</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-5 max-w-2xl text-fg-muted">
              We don&apos;t publish a rate card — every engagement is scoped to your actual volume,
              infrastructure, and compliance needs. Pay-as-you-go for APIs and GPUs, fixed-price for
              audits, custom annual contracts for enterprise.
            </motion.p>
          </motion.div>

          {/* Quick anchor tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-10 flex flex-wrap gap-2"
          >
            {pillarTabs.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="rounded-full border border-border bg-bg-subtle px-4 py-2 text-sm text-fg-muted transition hover:border-enterprise-primary/40 hover:text-fg"
              >
                {t.label}
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-10 max-w-2xl"
          >
            <ProductPicker />
          </motion.div>
        </div>
      </section>

      {/* ── CLOUD · GPU ────────────────────────────────────────────────── */}
      <section id="cloud" className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-primary">
              Xobriq Cloud · GPU Compute
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              DGX H200, Nairobi.
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              East Africa&apos;s only NVIDIA DGX H200 system. All data
              processed and stored within Kenya. Billed per GPU-hour, scoped to your workload.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-5 lg:grid-cols-3"
          >
            {gpus.map((g) => (<TierCard key={g.name} tier={g} />))}
          </motion.div>

          <h3 className="mt-16 mb-6 text-xl font-bold">Managed cloud services</h3>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-3"
          >
            {managedCloud.map((s) => (<ServiceRow key={s.name} s={s} />))}
          </motion.div>
        </div>
      </section>

      {/* ── GUARD ─────────────────────────────────────────────────────── */}
      <section id="guard" className="bg-bg-subtle px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-xteal-500">
              Xobriq Guard
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Per-call fraud scoring.
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              Real-time AI fraud, deepfake, identity, and behavioural
              detection. Sub-200ms from Nairobi.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-5 lg:grid-cols-3"
          >
            {guardTiers.map((t) => (<TierCard key={t.name} tier={t} />))}
          </motion.div>
        </div>
      </section>

      {/* ── AGENTIC ───────────────────────────────────────────────────── */}
      <section id="agentic" className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-xpurple-500">
              Agentic
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Autonomous agent deployments.
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              Pre-built agents and bespoke autonomous systems for enterprise
              workflows.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-3"
          >
            {agenticServices.map((s) => (<ServiceRow key={s.name} s={s} />))}
          </motion.div>
        </div>
      </section>

      {/* ── CONSULT ───────────────────────────────────────────────────── */}
      <section id="consult" className="bg-bg-subtle px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-accent">
              Consult
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Engagements with deliverables.
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              Led by a former Google AI researcher. Every engagement begins
              with an AI Maturity Assessment.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-3"
          >
            {consultEngagements.map((s) => (<ServiceRow key={s.name} s={s} />))}
          </motion.div>
        </div>
      </section>

      {/* ── CYBER ─────────────────────────────────────────────────────── */}
      <section id="cyber" className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-xred-500">
              Cyber
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Managed cybersecurity services.
            </h2>
            <p className="mt-3 max-w-2xl text-fg-muted">
              Pentesting, SIEM, incident response, audits, and ISO 27001
              readiness.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-3"
          >
            {cyberServices.map((s) => (<ServiceRow key={s.name} s={s} />))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW WE PRICE ──────────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-primary">
              How we price
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Built on honest principles.
            </h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-5 sm:grid-cols-2"
          >
            {principles.map((p) => (
              <motion.div key={p.title} variants={fadeInUp} className="glass-panel rounded-2xl p-6">
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SCOPING PROCESS ───────────────────────────────────────────── */}
      <section className="bg-bg-subtle px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-accent">
              How scoping works
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              From first call to signed quote.
            </h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {scopingSteps.map((s) => (
              <motion.div key={s.num} variants={fadeInUp} className="rounded-2xl border border-border bg-bg p-6">
                <span className="font-mono text-xs font-bold text-enterprise-primary">{s.num}</span>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-muted">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-gradient-to-br from-enterprise-primary/10 via-bg-subtle to-enterprise-accent/10 p-10 text-center md:p-16">
          <h2 className="text-3xl font-black sm:text-4xl">
            Ready for a number instead of a guess?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-fg-muted">
            Talk to our team about multi-year reservations, on-premise
            options, or volume terms for enterprise and government.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact?type=pricing_inquiry"
              className="glow-hover inline-flex items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
            >
              Get a quote <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:sales@xobriq.com"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-bg-subtle px-6 py-3 font-semibold text-fg hover:bg-bg-elevated"
            >
              sales@xobriq.com
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
