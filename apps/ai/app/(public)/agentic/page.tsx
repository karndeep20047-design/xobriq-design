"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Bot, Sparkles, Workflow, Webhook, Brain, Wrench, Eye,
  Search, UserCheck, ClipboardCheck, ShieldAlert, ChevronRight, CheckCircle2,
} from "lucide-react";

// ───────── data ─────────
const agents = [
  {
    icon: Search,
    title: "Fraud Investigation",
    desc: "Autonomous tracing of suspicious transactions and graph-based anomaly detection.",
    caps: ["Pattern Matching", "Entity Extraction", "Automated Reporting"],
  },
  {
    icon: UserCheck,
    title: "KYC Agent",
    desc: "Automated identity verification, risk scoring, and document validation at scale.",
    caps: ["Doc Analysis", "PEP Screening", "Risk Assessment"],
  },
  {
    icon: ClipboardCheck,
    title: "Compliance Agent",
    desc: "Continuous monitoring of regulatory shifts and automated policy enforcement.",
    caps: ["Policy Auditing", "Drift Detection", "Auto-Correction"],
  },
  {
    icon: ShieldAlert,
    title: "SecOps Agent",
    desc: "L1-L3 autonomous security operations, triage, and threat hunting.",
    caps: ["Alert Triage", "Phishing Response", "SIEM Integration"],
  },
];

const reasoningSteps = [
  {
    icon: Sparkles,
    title: "Thought Formulation",
    desc: "The agent breaks down the high-level goal into logical sub-tasks.",
  },
  {
    icon: Wrench,
    title: "Action & Tool Use",
    desc: "Strategic execution of API calls, database queries, or file operations.",
  },
  {
    icon: Eye,
    title: "Observation & Feedback",
    desc: "Analyzing the outcome of actions and self-correcting if necessary.",
  },
];

const connectors = ["Slack", "Jira", "Notion", "Salesforce", "Snowflake", "GitHub"];

// ───────── page ─────────
export default function AgenticPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <AgenticHero />
      <SpecializedAgents />
      <CustomBuilder />
      <CognitiveReasoning />
      <NativeConnectivity />
      <CTAFooter />
    </div>
  );
}

// ───────── hero ─────────
function AgenticHero() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-6 lg:py-32">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-enterprise-primary/15 blur-[140px]" />

      <div className="relative mx-auto max-w-5xl">
        

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Autonomous
          <br />
          Enterprise Agents
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 max-w-2xl text-lg leading-8 text-enterprise-fg-muted"
        >
          Deploy intelligent agents that reason, plan, and execute complex business workflows with human-level precision — built on the Xobriq Neural Backbone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-start gap-3 sm:flex-row"
        >
          <Link href="/register" className="glow-hover group inline-flex items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover">
            Get Started
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/docs/agentic" className="inline-flex items-center justify-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold text-enterprise-fg transition hover:border-enterprise-border-strong">
            View Documentation
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ───────── specialized agents grid ─────────
function SpecializedAgents() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Industry-First Specialized Agents</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            Purpose-built LLM agents trained on specific enterprise domains and high-compliance datasets.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass-panel flex flex-col rounded-2xl p-6 transition"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/15">
                  <Icon className="h-5 w-5 text-enterprise-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-6 text-enterprise-fg-muted">{a.desc}</p>
                <p className="label-caps-thin mt-5 text-enterprise-fg-subtle">Key Capabilities</p>
                <ul className="mt-3 space-y-1.5">
                  {a.caps.map((cap) => (
                    <li key={cap} className="flex items-center gap-2 text-xs text-enterprise-fg-muted">
                      <CheckCircle2 className="h-3 w-3 text-enterprise-accent" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────── custom builder showcase ─────────
function CustomBuilder() {
  const nodes = [
    { icon: Workflow, label: "Input Trigger" },
    { icon: Brain, label: "LLM Reasoning" },
    { icon: Wrench, label: "Tool Execution" },
    { icon: CheckCircle2, label: "Final Output" },
  ];

  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Custom Agent Builder</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            Design sophisticated multi-step workflows with our drag-and-drop orchestration layer.
          </p>
        </div>

        <div className="mt-12 grid gap-6 rounded-3xl border border-enterprise-border bg-enterprise-bg p-6 sm:p-8 lg:grid-cols-[260px_1fr]">
          <div>
            <p className="label-caps-thin text-enterprise-fg-subtle">Workflow Nodes</p>
            <div className="mt-4 grid gap-2">
              {nodes.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.label} className="flex items-center gap-3 rounded-lg border border-enterprise-border bg-enterprise-bg-lower px-3 py-2.5 text-sm">
                    <Icon className="h-4 w-4 text-enterprise-accent" />
                    <span>{n.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[300px] rounded-2xl border border-dashed border-enterprise-border bg-enterprise-bg-lower p-6">
            <div className="flex h-full flex-col items-center justify-center gap-4 md:flex-row md:gap-2">
              <WorkflowChip label="Trigger" sub="Webhook Event" icon={Webhook} />
              <ChevronRight className="h-5 w-5 text-enterprise-fg-subtle md:rotate-0" style={{ transform: "rotate(90deg)" }} />
              <WorkflowChip label="Reasoning" sub="Analyze Intent" icon={Brain} highlight />
              <ChevronRight className="h-5 w-5 text-enterprise-fg-subtle" style={{ transform: "rotate(90deg)" }} />
              <WorkflowChip label="Output" sub="Slack Notification" icon={CheckCircle2} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type ChipProps = {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
};

function WorkflowChip({ label, sub, icon: Icon, highlight }: ChipProps) {
  const cls = highlight
    ? "border-enterprise-primary bg-enterprise-primary/15"
    : "border-enterprise-border bg-enterprise-bg";
  return (
    <div className={"flex min-w-[140px] flex-col items-center rounded-xl border px-5 py-4 text-center " + cls}>
      <p className="label-caps-thin text-enterprise-fg-subtle">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-enterprise-accent" />
        <span className="text-sm font-semibold">{sub}</span>
      </div>
    </div>
  );
}

// ───────── cognitive reasoning ─────────
function CognitiveReasoning() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Cognitive Reasoning Engine</h2>
          <p className="mt-4 max-w-xl text-enterprise-fg-muted">
            Xobriq agents don&apos;t just predict text; they think in structured hierarchies. Observe the decision-making process in real-time as the agent navigates complex branching paths to reach a resolution.
          </p>

          <div className="mt-8 grid gap-5">
            {reasoningSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex items-start gap-4">
                  <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-enterprise-accent/40 bg-enterprise-accent/10">
                    <Icon className="h-4 w-4 text-enterprise-accent" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-enterprise-fg-muted">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-enterprise-border pb-3">
            <span className="text-enterprise-accent">ROOT_PROMPT_007</span>
            <span className="rounded-full bg-enterprise-accent/15 px-2 py-0.5 text-[10px] text-enterprise-accent">LIVE</span>
          </div>
          <div className="mt-4 space-y-3 leading-6 text-enterprise-fg-muted">
            <p><span className="text-enterprise-primary">→ thought:</span> parse customer query intent</p>
            <p><span className="text-enterprise-primary">→ action:</span> fetch_account_history(id=8a4f2)</p>
            <p><span className="text-enterprise-primary">→ observe:</span> 3 anomalies detected</p>
            <p><span className="text-enterprise-primary">→ thought:</span> escalate to fraud review</p>
            <p><span className="text-enterprise-primary">→ action:</span> create_case(priority=high)</p>
            <p className="text-enterprise-accent">✓ FINAL_STATE_SUCCESS</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────── native interconnectivity ─────────
function NativeConnectivity() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Native Interconnectivity</h2>
            <p className="mt-3 max-w-xl text-enterprise-fg-muted">
              Agents aren&apos;t silos. They connect directly to your data lake, CRM, and communication platforms with zero-trust security.
            </p>
          </div>
          <Link href="/docs/agentic/connectors" className="label-caps-thin inline-flex items-center gap-2 text-enterprise-accent">
            View all 250+ connectors
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {connectors.map((c) => (
            <div key={c} className="grid h-20 place-items-center rounded-xl border border-enterprise-border bg-enterprise-bg text-center text-xs font-semibold text-enterprise-fg-muted transition hover:border-enterprise-primary hover:text-enterprise-fg">
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── CTA ─────────
function CTAFooter() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/15 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Ready to scale intelligence?</h2>
        <p className="mx-auto mt-5 max-w-2xl text-enterprise-fg-muted">
          Join the world&apos;s most advanced engineering teams building the future of autonomous business operations on Xobriq.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="glow-hover inline-flex items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover">
            Build Your First Agent
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold text-enterprise-fg transition hover:border-enterprise-border-strong">
            Talk to Sales
          </Link>
        </div>
      </div>
    </section>
  );
}