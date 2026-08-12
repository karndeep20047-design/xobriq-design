"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Shield, Rocket, ShieldCheck, Compass, Cog, LineChart, Scale, CheckCircle2 } from "lucide-react";

export default function ConsultPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <ConsultHero />
      <StrategicPillars />
      <AdvisoryFramework />
      <WorldClass />
      <MetricsRow />
      <ConsultCTA />
    </div>
  );
}

function ConsultHero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-28">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-enterprise-primary/15 blur-[140px]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-enterprise-primary/30 bg-enterprise-primary/10 px-3 py-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-enterprise-accent" />
            <span className="label-caps-thin text-enterprise-accent">Elite Strategic Advisory</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Strategic AI Transformation for the <span className="text-enterprise-primary">Sovereign Enterprise</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-enterprise-fg-muted">
            Accelerate your AI maturity with world-class advisory, governance, and engineering excellence. Built for regulated industries and government-scale intelligence.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <Link href="/contact" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Book a Consultation</Link>
            <Link href="/docs/consult" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">View Advisory Framework</Link>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative aspect-square overflow-hidden rounded-2xl border border-enterprise-border">
          <Image src="/images/neural-analysis.png" alt="Global intelligence network" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-enterprise-bg via-transparent to-enterprise-bg" />
        </motion.div>
      </div>
    </section>
  );
}

function StrategicPillars() {
  const pillars = [
    { icon: LineChart, title: "AI Maturity Assessment", desc: "Evaluating infrastructure, data readiness, and organizational alignment for AI adoption." },
    { icon: Scale, title: "AI Governance & Ethics", desc: "Developing robust frameworks for responsible, compliant, and sovereign AI deployment." },
    { icon: Cog, title: "MLOps & Engineering", desc: "Building the pipelines and infrastructure required for production-grade AI at scale." },
    { icon: Shield, title: "Fraud & Risk Strategy", desc: "Architecting resilient financial ecosystems using Xobriq&apos;s proprietary fraud intelligence." },
  ];
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Strategic Pillars</h2>
          <p className="mx-auto mt-3 max-w-2xl text-enterprise-fg-muted">Foundational expertise to navigate the complexity of enterprise AI integration.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-panel rounded-2xl border border-enterprise-border bg-enterprise-bg-lower p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/15">
                  <Icon className="h-5 w-5 text-enterprise-primary" />
                </div>
                <h3 className="mt-5 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-enterprise-fg-muted">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdvisoryFramework() {
  const phases = [
    { n: "01", title: "Discovery", body: "Comprehensive audit of current data assets and operational pain points." },
    { n: "02", title: "Strategy", body: "Architecting the custom roadmap for AI integration and resource allocation." },
    { n: "03", title: "Implementation", body: "Engineering production-ready models and deploying resilient infrastructure." },
    { n: "04", title: "Governance", body: "Establishing rigorous compliance monitoring and ethical guardrails." },
    { n: "05", title: "Scale", body: "Optimizing and expanding AI capabilities across the entire enterprise value chain." },
  ];
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="label-caps-thin text-enterprise-accent">The Blueprint</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Xobriq Advisory Framework</h2>
        <p className="mt-3 max-w-2xl text-enterprise-fg-muted">A systematic, multi-phase methodology designed to transition enterprises from experimental AI to operational dominance.</p>

        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-enterprise-border lg:block" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {phases.map((p) => (
              <div key={p.n} className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-enterprise-primary bg-enterprise-bg text-sm font-bold text-enterprise-primary">{p.n}</div>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-enterprise-fg-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorldClass() {
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-enterprise-border">
          <Image src="/images/ops-dashboard.png" alt="Global engineering meet" width={1200} height={800} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-enterprise-bg via-enterprise-bg/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="label-caps-thin text-enterprise-accent">Global Pedigree, Local Roots</p>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">World-Class Engineering Meet Regional Context</h3>
            <p className="mt-3 max-w-xl text-sm text-enterprise-fg-muted">Our leadership brings decades of experience from Silicon Valley&apos;s elite — including veterans from FAANG and Palantir — uniquely combined with deep technical roots in the East African ecosystem.</p>
            <div className="mt-6 flex gap-8">
              <div><p className="text-2xl font-bold">15+</p><p className="label-caps-thin text-enterprise-fg-subtle">Years Avg. XP</p></div>
              <div><p className="text-2xl font-bold">500+</p><p className="label-caps-thin text-enterprise-fg-subtle">Models Deployed</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border-l-4 border-l-enterprise-primary p-6">
            <h4 className="font-semibold">Sovereign Data Control</h4>
            <p className="mt-2 text-sm text-enterprise-fg-muted">Ensuring your data never leaves your jurisdiction, meeting the strictest regulatory requirements of government and financial sectors.</p>
          </div>
          <div className="glass-panel rounded-2xl border-l-4 border-l-enterprise-accent p-6">
            <h4 className="font-semibold">Rapid AI Maturity</h4>
            <p className="mt-2 text-sm text-enterprise-fg-muted">We don&apos;t just advise; we build. Transition from proof-of-concept to production in as little as 12 weeks.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsRow() {
  const stats = [
    { v: "35%", l: "Reduction in Operational Risk", s: "Achieved for a regional Tier-1 Bank through automated governance." },
    { v: "10x", l: "Faster AI Deployment Cycles", s: "Enabled via Xobriq&apos;s proprietary MLOps framework and pipeline accelerators." },
    { v: "99.9%", l: "Fraud Detection Accuracy", s: "Delivered for national mobile money ecosystem using agentic intelligence." },
  ];
  return (
    <section className="border-y border-enterprise-border px-5 py-14 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <p className="text-4xl font-bold sm:text-5xl">{s.v}</p>
            <p className="label-caps-thin mt-2 text-enterprise-fg-subtle">{s.l}</p>
            <p className="mx-auto mt-2 max-w-xs text-xs text-enterprise-fg-muted">{s.s}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConsultCTA() {
  return (
    <section className="px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/15 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to lead the AI era?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-enterprise-fg-muted">Join the ranks of sovereign enterprises building resilient, intelligent futures with Xobriq Consult.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Talk to an Advisor</Link>
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Download Whitepaper</Link>
        </div>
      </div>
    </section>
  );
}