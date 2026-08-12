"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Cloud as CloudIcon, MapPin, Zap, Leaf, CheckCircle2, ArrowRight, Server } from "lucide-react";

export default function CloudPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <CloudHero />
      <CloudFeatureRow />
      <IntelligenceStack />
      <ComputeProfiles />
      <CloudCTA />
    </div>
  );
}

function CloudHero() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-28">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-enterprise-primary/15 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-enterprise-primary/30 bg-enterprise-primary/10 px-3 py-1.5">
            <CloudIcon className="h-3.5 w-3.5 text-enterprise-accent" />
            <span className="label-caps-thin text-enterprise-accent">Xobriq Cloud · Alpha v5.2</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Sovereign AI Infrastructure for the Digital Frontier.
          </motion.h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-enterprise-fg-muted">
            High-performance GPU compute, localized data residency, and enterprise-grade inference hosting built for East Africa. Own your intelligence, secure your future.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Secure Your Compute Today</Link>
            <Link href="/docs/cloud" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">View Documentation</Link>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-enterprise-border">
          <Image src="/images/gpu-rack.png" alt="Xobriq GPU data center" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-tr from-enterprise-bg via-enterprise-bg/40 to-transparent" />
          <div className="absolute bottom-4 right-4 rounded-lg bg-enterprise-bg/80 px-4 py-3 backdrop-blur">
            <p className="label-caps-thin text-enterprise-fg-subtle">Active Nodes</p>
            <p className="mt-1 text-2xl font-bold">1,240 <span className="text-xs text-enterprise-fg-muted">TFLOPS</span></p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CloudFeatureRow() {
  const feats = [
    { icon: Cpu, title: "NVIDIA H200 Clusters", body: "Hyper-scale GPU clusters for massive model training and rapid enterprise inference deployment." },
    { icon: MapPin, title: "Sovereign Data Residency", body: "Physical infrastructure located in Nairobi, Addis, and Kigali. Your data never leaves the region." },
    { icon: Zap, title: "Ultra-Low Latency Edge", body: "Direct interconnects with local telcos ensure sub-10ms latency for real-time AI agents." },
    { icon: Leaf, title: "Green Energy Powered", body: "Powered by geothermal and hydro-electric grids, achieving an industry-leading PUE of 1.15." },
  ];
  return (
    <section className="px-5 py-16 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {feats.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="glass-panel rounded-2xl p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-enterprise-primary/15">
                <Icon className="h-5 w-5 text-enterprise-primary" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-enterprise-fg-muted">{f.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function IntelligenceStack() {
  const layers = [
    { n: "03", title: "AI Applications", tags: ["Guard", "Agentic AI", "Visual Compute"] },
    { n: "02", title: "Orchestration & MLOps", tags: ["Kubernetes", "PyTorch native", "Model Registry"], highlight: true },
    { n: "01", title: "Sovereign GPU Cloud", tags: ["NVIDIA H200 HGX", "Infiniband 800G", "NVLink Fabric"] },
  ];
  return (
    <section className="bg-enterprise-bg-low px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The Xobriq Intelligence Stack</h2>
          <p className="mx-auto mt-3 max-w-xl text-enterprise-fg-muted">
            A vertically integrated architecture designed to bridge the gap between raw silicon and cognitive excellence.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {layers.map((l) => (
            <div key={l.n} className={"rounded-2xl border p-6 " + (l.highlight ? "border-enterprise-primary bg-enterprise-primary/10" : "border-enterprise-border bg-enterprise-bg")}>
              <div className="flex items-center gap-3">
                <span className="label-caps-thin text-enterprise-fg-subtle">Layer {l.n}</span>
              </div>
              <p className="mt-1 text-xl font-semibold">{l.title}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {l.tags.map((t) => (
                  <span key={t} className="rounded-md border border-enterprise-border bg-enterprise-bg-low px-2.5 py-1 text-xs text-enterprise-fg-muted">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComputeProfiles() {
  const tiers = [
    { name: "Startup", tag: "Pre-Signing", price: "Custom", unit: "billed per GPU-hour", features: ["Shared H200 Instance", "80GB VRAM", "Standard Support"], cta: "Start Free Trial", primary: false },
    { name: "Enterprise", tag: "Recommended", price: "Custom", unit: "billed per GPU-hour", features: ["Dedicated H200 Node", "8x NVLink 400G", "24/7 Concierge Support", "Custom SLA"], cta: "Provision Now", primary: true },
    { name: "Sovereign", tag: "Critical Infrastructure", price: "Custom", unit: "pricing", features: ["Dedicated Air-Gapped Pod", "Government Compliance", "On-prem Hybrid Sync", "White-glove Training"], cta: "Contact Sales", primary: false },
  ];
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Select Your Compute Profile</h2>
          <p className="mx-auto mt-3 max-w-xl text-enterprise-fg-muted">Tailored performance for every stage of your AI journey.</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name} className={"glass-panel rounded-2xl p-8 " + (t.primary ? "border-2 border-enterprise-primary shadow-md shadow-enterprise-primary/10" : "")}>
              <span className={"label-caps-thin " + (t.primary ? "text-enterprise-primary" : "text-enterprise-fg-subtle")}>{t.tag}</span>
              <h3 className="mt-2 text-2xl font-semibold">{t.name}</h3>
              <p className="mt-4 text-4xl font-bold">{t.price}</p>
              <p className="mt-1 text-sm text-enterprise-fg-muted">{t.unit}</p>
              <ul className="mt-6 space-y-3 border-t border-enterprise-border pt-6 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-enterprise-fg-muted"><CheckCircle2 className="h-4 w-4 text-enterprise-accent" />{f}</li>
                ))}
              </ul>
              <Link href="/contact" className={"mt-8 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold " + (t.primary ? "bg-enterprise-primary text-enterprise-on-primary hover:bg-enterprise-primary-hover" : "border border-enterprise-border bg-enterprise-bg-low hover:border-enterprise-border-strong")}>{t.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CloudCTA() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-enterprise-primary/30 bg-gradient-to-br from-enterprise-primary/15 via-enterprise-bg-low to-enterprise-accent/10 p-10 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Scale the Digital Frontier?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-enterprise-fg-muted">Join the elite enterprises building the next generation of East African intelligence on Xobriq Cloud.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-7 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Secure Your Compute Today</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-7 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Request Architecture Review</Link>
        </div>
      </div>
    </section>
  );
}