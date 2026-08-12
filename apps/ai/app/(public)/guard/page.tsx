"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EyeScanIllustration } from "@/components/ai/EyeScanIllustration";
import {
  ShieldCheck, Zap, Cpu, Eye, Fingerprint, Code2, CheckCircle2,
  ArrowRight, FileText, Activity,
} from "lucide-react";

export default function GuardPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <GuardHero />
      <DetectionEngine />
      <Biometrics />
      <DeveloperAPI />
      <GuardCTA />
    </div>
  );
}

function GuardHero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-28">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-enterprise-primary/12 blur-[140px]" />
      <div className="container-narrow relative text-center">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Xobriq Guard: <span className="text-white">Total Fraud Intelligence</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mx-auto mt-6 max-w-2xl text-base leading-7 text-enterprise-fg-muted sm:text-lg">
          A billion-dollar engineering solution for massive-scale risk management. Real-time neural verification for the world&apos;s most demanding financial ecosystems.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover">
            <ShieldCheck className="h-4 w-4" /> Deploy Guard Now
          </Link>
          <Link href="/docs/guard" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-6 py-3 text-sm font-semibold hover:border-enterprise-border-strong">
            <FileText className="h-4 w-4" /> Documentation
          </Link>
        </motion.div>
        <RiskMonitorMockup />
      </div>
    </section>
  );
}

function RiskMonitorMockup() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="glass-panel mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl text-left">
      <div className="flex items-center justify-between border-b border-enterprise-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
          </div>
          <span className="ml-3 font-mono text-xs text-enterprise-fg-muted">guard_v2.4.0 // risk_monitor</span>
        </div>
        <span className="label-caps-thin text-enterprise-accent">● System Nominal</span>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          <div>
            <p className="label-caps-thin text-enterprise-fg-subtle">Global Risk Score</p>
            <p className="mt-2 text-4xl font-bold">0.002</p>
            <div className="mt-2 h-1 w-full rounded-full bg-enterprise-border">
              <div className="h-full w-[8%] rounded-full bg-enterprise-accent" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="label-caps-thin text-enterprise-fg-subtle">Active Signals</p>
            <SignalRow name="Velocity" status="Normal" tone="ok" />
            <SignalRow name="Geolocation" status="Verified" tone="ok" />
            <SignalRow name="Fingerprint" status="Warning" tone="warn" />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-enterprise-border bg-enterprise-bg-lower">
          <Image src="/images/neural-analysis.png" alt="Neural verification network" width={800} height={500} className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-enterprise-bg-lower via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-base font-semibold">Neural Verification Engine</p>
            <p className="mt-1 text-xs text-enterprise-fg-muted">Processing 450k events per second across global nodes.</p>
          </div>
          <span className="absolute right-4 top-4 rounded-full bg-enterprise-accent/20 px-2 py-0.5 text-[10px] font-semibold text-enterprise-accent">SCAN_ID: 99x_Z4</span>
        </div>
      </div>
    </motion.div>
  );
}

function SignalRow({ name, status, tone }: { name: string; status: string; tone: "ok" | "warn" }) {
  const cls = tone === "ok" ? "text-enterprise-accent" : "text-enterprise-primary";
  return (
    <div className="flex items-center justify-between rounded border border-enterprise-border bg-enterprise-bg-lower px-3 py-1.5 text-xs">
      <span className="text-enterprise-fg-muted">{name}</span>
      <span className={"font-semibold " + cls}>{status}</span>
    </div>
  );
}

function DetectionEngine() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Advanced Detection Engine</h2>
          <p className="mt-4 max-w-xl text-enterprise-fg-muted">
            Our proprietary neural architecture doesn&apos;t just block fraud; it understands intent. By analyzing over 12,000 unique data points per transaction, Xobriq Guard predicts malicious behavior before the first byte is sent.
          </p>
          <div className="mt-8 grid gap-6">
            <FeatureItem icon={Zap} title="Zero-Latency Scoring" body="Real-time decisions delivered in under 45ms across our global edge network." />
            <FeatureItem icon={Cpu} title="Adaptive ML Pipelines" body="Self-learning models that automatically pivot against new botnet patterns and social engineering tactics." />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="label-caps-thin text-enterprise-fg-subtle">Deep Analysis View</p>
            <Activity className="h-4 w-4 text-enterprise-accent" />
          </div>
          <div className="mt-5 space-y-2">
            {[85, 62, 92, 74].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-enterprise-border">
                <motion.div initial={{ width: 0 }} whileInView={{ width: w + "%" }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full bg-gradient-to-r from-enterprise-primary to-enterprise-accent" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-enterprise-border pt-5 text-center">
            <Stat label="Entropy" value="0.82" />
            <Stat label="Latency" value="12ms" />
            <Stat label="Confidence" value="99.9%" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureItem({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-enterprise-primary/10">
        <Icon className="h-4 w-4 text-enterprise-primary" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-enterprise-fg-muted">{body}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-caps-thin text-enterprise-fg-subtle">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function Biometrics() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="container-medium">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Hardened Biometrics & Identity</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            The perimeter has moved from the password to the persona. Xobriq provides end-to-end identity intelligence.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="glass-panel overflow-hidden rounded-2xl">
            <div className="grid gap-5 p-8 sm:grid-cols-[1fr_180px] sm:items-center">
              <div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-primary">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">Deepfake Detection</h3>
                <p className="mt-3 text-sm text-enterprise-fg-muted">
                  Real-time biometric liveness checks that defeat advanced GAN-based injection attacks and synthetic media fraud.
                </p>
                <Link href="/docs/guard/deepfake" className="label-caps-thin mt-6 inline-flex items-center gap-2 text-enterprise-primary">
                  Explore Biometrics <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                <Image src="/images/eye-scan.png" alt="Biometric eye scan" fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                <div className="pointer-events-none absolute inset-y-0 left-[22%] w-[2px] bg-enterprise-accent/70 shadow-[0_0_12px_rgba(181,196,255,0.7)]" />
                <div className="pointer-events-none absolute inset-y-0 right-[22%] w-[2px] bg-enterprise-accent/70 shadow-[0_0_12px_rgba(181,196,255,0.7)]" />
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-panel rounded-2xl p-8">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-accent">
              <Fingerprint className="h-5 w-5 text-enterprise-bg" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Identity Intel</h3>
            <p className="mt-3 text-sm text-enterprise-fg-muted">
              Unified KYC/AML screening against 400+ global sanctions lists and 150+ regional government databases.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-accent" />PEP & Sanctions Screening</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-accent" />Real-time ID OCR</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-enterprise-accent" />Risk-based Authentication</li>
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Developer-First Risk API</h2>
          <p className="mt-4 max-w-xl text-enterprise-fg-muted">
            Integration in minutes, not months. Xobriq Guard is built for scale, providing a simple yet powerful REST API and native SDKs for all major languages.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Python","Node.js","Go","Java","Ruby",".NET"].map((lang) => (
              <span key={lang} className="rounded-md border border-enterprise-border bg-enterprise-bg-low px-3 py-1 text-xs font-medium">{lang}</span>
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
            <span className="font-mono text-xs text-enterprise-fg-muted">risk_scoring.py</span>
            <Code2 className="ml-auto h-3.5 w-3.5 text-enterprise-fg-subtle" />
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 sm:text-sm">
{"`import xobriq\n\nxobriq.api_key = 'sk_live_guard_552x01'\n\n# Evaluate transaction risk in real-time\nscore = xobriq.guard.score(\n  txn_id='txn_123_495x',\n  customer_id='cust_99x',\n  include_fingerprint=True\n)\n\nprint(f\"Risk Score: {score.value}\")`"}
          </pre>
        </div>
      </div>
    </section>
  );
}

function GuardCTA() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/12 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Secure Your Infrastructure Today.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-enterprise-fg-muted">
          Join the world&apos;s most secure financial institutions using Xobriq Guard.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Request Access</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Talk to Sales</Link>
        </div>
      </div>
    </section>
  );
}