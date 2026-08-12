"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CapabilityCard } from "@/components/ai/CapabilityCard";
import {
  ShieldAlert, Radar, ScanLine, ShieldCheck, Lock, Eye,
  CheckCircle2, ArrowRight, Terminal, Zap,
} from "lucide-react";

export default function CyberPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <CyberHero />
      <CapabilityGrid />
      <CommandCenter />
      <TrustArchitecture />
      <ComplianceStrip />
      <CyberCTA />
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────
function CyberHero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-24">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-enterprise-primary/15 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            Autonomous Defense for the <span className="italic text-enterprise-accent">Sovereign Enterprise</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-xl text-lg leading-8 text-enterprise-fg-muted"
          >
            Protecting critical infrastructure with AI-driven penetration testing, managed SIEM, and real-time incident response. Engineered for absolute security.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col items-start gap-3 sm:flex-row"
          >
            <Link href="/contact" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Deploy Defense Shield</Link>
            <Link href="/docs/cyber" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Explore Platform</Link>
          </motion.div>

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-enterprise-border pt-8">
            <HeroStat value="1.2ms" label="Response Time" />
            <HeroStat value="99.9%" label="Threat Mitigation" />
            <HeroStat value="Zero" label="Trust Config" />
          </div>
        </div>

        <CyberMonitor />
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="label-caps-thin mt-1 text-enterprise-fg-subtle">{label}</p>
    </div>
  );
}

function CyberMonitor() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-panel relative rounded-2xl p-5"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
          <p className="label-caps-thin text-enterprise-fg-subtle">Network Latency</p>
          <div className="mt-3 flex items-end gap-1 h-10">
            {[30,45,55,40,60,52,68,72].map((h, i) => (
              <div key={i} style={{ height: h + "%" }} className="flex-1 rounded-sm bg-enterprise-primary/50" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
          <p className="label-caps-thin text-enterprise-fg-subtle">Global Load</p>
          <p className="mt-2 text-2xl font-bold">42.8 Tb/s</p>
          <p className="text-[10px] text-enterprise-accent">● Live traffic</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-accent/20">
            <ShieldCheck className="h-5 w-5 text-enterprise-accent" />
          </div>
          <div>
            <p className="font-semibold">Secured System</p>
            <p className="text-xs text-enterprise-fg-muted">Continuous Red-Teaming active. Next audit in 4h 12m.</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-enterprise-fg-muted">
        <div className="h-1 w-1 animate-ping rounded-full bg-enterprise-accent" />
        Live monitoring · 3 anomalies triaged in the last minute
      </div>
    </motion.div>
  );
}

// ── Capabilities ────────────────────────────────────────────
function CapabilityGrid() {
  const items = [
    { icon: Radar, title: "AI-Powered Pentesting", desc: "Automated, continuous red-teaming that evolves with emerging threat patterns. Real-world simulation at scale.", chips: ["Autonomous Discovery", "Zero-Day Identification"] },
    { icon: ScanLine, title: "Managed SIEM", desc: "Real-time threat detection and log analysis powered by neural processing. Zero noise, high-fidelity alerts.", chips: ["Live Log Ingestion", "Behavioral Analytics"] },
    { icon: Zap, title: "Incident Response", desc: "Rapid containment and recovery protocols that trigger in milliseconds. Automated blast-radius isolation.", chips: ["Instant Quarantine", "Root Cause Analysis"] },
    { icon: ShieldCheck, title: "Security Audits", desc: "Compliance-ready audits for ISO 27001, SOC2, and local regulations. Real-time compliance monitoring.", chips: ["Regulatory Mapping", "Drift Detection"] },
  ];
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sovereign Capabilities</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">
            Engineered to anticipate, resist, and recover. Our AI-driven security suite provides 360° coverage for enterprise digital assets.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="glass-panel flex flex-col rounded-2xl p-6 transition"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/15">
                  <Icon className="h-5 w-5 text-enterprise-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm leading-6 text-enterprise-fg-muted">{it.desc}</p>
                <ul className="mt-6 space-y-1.5 border-t border-enterprise-border pt-4">
                  {it.chips.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-xs text-enterprise-fg-muted">
                      <CheckCircle2 className="h-3 w-3 text-enterprise-accent" />{c}
                    </li>
                  ))}
                </ul>
                <Link href="/docs/cyber" className="label-caps-thin mt-5 inline-flex items-center gap-1 text-enterprise-primary">
                  Learn more <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Command Center ──────────────────────────────────────────
function CommandCenter() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A New Era of Visibility</h2>
          <p className="mt-4 max-w-xl text-enterprise-fg-muted">
            Our proprietary Command Center provides a singular plane of glass over your entire security ecosystem. Monitor live intrusion attempts and automated counter-measures as they happen.
          </p>
          <div className="mt-8 space-y-5">
            <FeatureItem icon={Eye} title="Neural Threat Detection" body="Detecting attacks before signatures are even created." />
            <FeatureItem icon={Zap} title="Sub-Millisecond Response" body="Isolating anomalies in real-time without human intervention." />
          </div>
        </div>

        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-enterprise-border bg-enterprise-bg-lower px-4 py-2.5">
            <div className="flex items-center gap-2 font-mono text-xs text-enterprise-fg-muted">
              <Terminal className="h-3.5 w-3.5" />SOC-TERMINAL-01
            </div>
            <span className="rounded-full bg-enterprise-accent/15 px-2 py-0.5 text-[10px] font-semibold text-enterprise-accent">● LIVE FEED</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-[220px_1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-enterprise-border bg-enterprise-bg-lower p-3">
                <p className="label-caps-thin text-enterprise-fg-subtle">Threat Level</p>
                <p className="mt-1 text-lg font-bold text-green-400">LOW</p>
              </div>
              <div className="rounded-lg border border-enterprise-border bg-enterprise-bg-lower p-3">
                <p className="label-caps-thin text-enterprise-fg-subtle">Active Defenses</p>
                <p className="mt-1 text-lg font-bold">100<span className="text-enterprise-accent">%</span></p>
              </div>
              <div className="rounded-lg border border-enterprise-border bg-enterprise-bg-lower p-3">
                <p className="label-caps-thin text-enterprise-fg-subtle">Integrity Index</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-enterprise-border">
                    <div className="h-full w-[85%] rounded-full bg-enterprise-accent" />
                  </div>
                  <span className="text-xs font-semibold">85%</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-enterprise-border bg-enterprise-bg-lower p-3 font-mono text-[11px] leading-6">
              <p><span className="text-enterprise-fg-subtle">[14:22:01]</span> Intrusion attempt from IP 192.168.1.104 blocked.</p>
              <p><span className="text-enterprise-fg-subtle">[14:22:05]</span> <span className="text-enterprise-accent">Heuristic Analysis:</span> Unauthorized file traversal detected in /var/www.</p>
              <p><span className="text-enterprise-fg-subtle">[14:22:06]</span> Auto SHIELD: Quarantining process ID 44343.</p>
              <p><span className="text-enterprise-fg-subtle">[14:22:15]</span> System integrity check passed. 0 vulnerabilities found.</p>
              <p><span className="text-enterprise-fg-subtle">[14:22:40]</span> Log ingestion heartbeat active.</p>
              <p><span className="text-enterprise-fg-subtle">[14:22:49]</span> Scanning for anomalous SSH patterns...</p>
              <p><span className="text-enterprise-fg-subtle">[14:23:01]</span> Intrusion Attempts Blocked: 1,402 in last hour.</p>
              <p><span className="text-enterprise-fg-subtle">[16:23:00]</span> Routine integrity scan complete. Heartbeat OK.</p>
              <p className="mt-2 text-right text-enterprise-accent">● Active Analysis</p>
            </div>
          </div>
        </div>
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

// ── Trust Architecture ──────────────────────────────────────
function TrustArchitecture() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">The Architecture of Trust</h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl border-l-4 border-l-enterprise-primary p-8">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-primary/15">
              <ShieldCheck className="h-5 w-5 text-enterprise-primary" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Zero-Trust Architecture</h3>
            <p className="mt-3 text-sm text-enterprise-fg-muted">
              Never trust, always verify. Every request, every identity, and every endpoint is authenticated and authorized before granting access.
            </p>
          </div>

          <div className="glass-panel rounded-2xl border-l-4 border-l-enterprise-accent p-8">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-accent/15">
              <Lock className="h-5 w-5 text-enterprise-accent" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">End-to-End Encryption</h3>
            <p className="mt-3 text-sm text-enterprise-fg-muted">
              Military-grade AES-256 encryption at rest and in transit. Your data is invisible to the outside world, including us.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Compliance strip ────────────────────────────────────────
function ComplianceStrip() {
  const badges = ["ISO 27001", "SOC 2 Type II", "HIPAA Compliant", "GDPR Ready", "PCI DSS"];
  return (
    <section className="border-y border-enterprise-border bg-enterprise-bg py-10 px-5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 sm:gap-14">
        {badges.map((b) => (
          <span key={b} className="label-caps-thin text-enterprise-fg-subtle">{b}</span>
        ))}
      </div>
    </section>
  );
}

// ── CTA ─────────────────────────────────────────────────────
function CyberCTA() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/15 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Secure Your Perimeter Today.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-enterprise-fg-muted">
          Join the world&apos;s most secure enterprises. Deploy Xobriq&apos;s autonomous defense engine and protect your digital sovereignty.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Book a Security Audit</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Talk to a Security Expert</Link>
        </div>
      </div>
    </section>
  );
}