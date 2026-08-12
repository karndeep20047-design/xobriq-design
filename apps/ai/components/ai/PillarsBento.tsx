"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Cloud, GitBranch, ShieldAlert, Zap } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "./animations";
import {
  FraudNetworkVisual,
  AgentOrbitVisual,
  GpuStackVisual,
  ConsultBranchVisual,
  CyberPulseVisual,
} from "./PillarVisuals";

// Small credibility stat that reveals on hover instead of sitting on the
// card permanently — rewards a closer look rather than competing with the
// headline copy for attention.
function StatReveal({ label, tone = "primary" }: { label: string; tone?: "primary" | "accent" | "red" }) {
  const toneClass =
    tone === "accent" ? "bg-enterprise-accent/15 text-enterprise-accent" :
    tone === "red" ? "bg-xred-500/15 text-xred-500" :
    "bg-enterprise-primary/15 text-enterprise-primary";
  return (
    <span
      className={
        "pointer-events-none absolute bottom-4 right-4 inline-flex translate-y-1 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 " +
        toneClass
      }
    >
      <Zap className="h-3 w-3" /> {label}
    </span>
  );
}

export function PillarsBento() {
  return (
    <section className="bg-enterprise-bg py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label-caps-thin text-enterprise-accent">The Ecosystem</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Five Integrated Intelligence Pillars
            </h2>
          </div>
          <p className="max-w-md text-enterprise-fg-muted">
            Modular architecture lets enterprises deploy a single pillar or orchestrate the full Xobriq suite under one console, one contract, one sovereign infrastructure.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-12"
        >
          <motion.div variants={fadeInUp} whileHover={{ y: -4 }} className="glass-panel glow-hover group relative flex flex-col justify-end overflow-hidden rounded-2xl p-8 transition md:col-span-8 md:min-h-[420px]">
            <FraudNetworkVisual />
            <p className="label-caps-thin text-enterprise-primary">Xobriq Guard</p>
            <h3 className="mt-2 text-3xl font-semibold">Fraud Intelligence</h3>
            <p className="mt-4 max-w-lg text-enterprise-fg-muted">
              Real-time fraud scoring on 120+ signals plus deepfake, liveness, identity, and behavioural detection — sub-200ms from Nairobi, trained on East African banking data.
            </p>
            <Link href="/guard" className="label-caps-thin mt-6 inline-flex w-fit items-center gap-2 text-enterprise-primary">
              <span>Explore Guard</span>
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <StatReveal label="120+ signals" />
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={{ y: -4 }} className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-2xl p-7 transition md:col-span-4">
            <AgentOrbitVisual />
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/10">
              <Bot className="h-5 w-5 text-enterprise-primary" />
            </div>
            <div className="mt-8">
              <p className="label-caps-thin text-enterprise-fg-muted">Agentic AI</p>
              <h3 className="mt-2 text-xl font-semibold">Autonomous Agents</h3>
              <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">
                LLM-powered agents that execute fraud investigation, KYC, and compliance workflows with audit-grade reasoning.
              </p>
            </div>
            <StatReveal label="24/7 Autonomous" />
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={{ y: -4 }} className="glass-panel group relative overflow-hidden rounded-2xl border-t-2 border-t-enterprise-accent/30 p-7 transition md:col-span-4 flex flex-col justify-between">
            <GpuStackVisual />
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-accent/15">
              <Cloud className="h-5 w-5 text-enterprise-accent" />
            </div>
            <div className="mt-8">
              <p className="label-caps-thin text-enterprise-accent">Xobriq Cloud</p>
              <h3 className="mt-2 text-xl font-semibold">Sovereign GPU Compute</h3>
              <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">
                East Africa&apos;s only DGX H200 cluster. Per-second billing, MIG isolation, 100% Kenya data residency.
              </p>
            </div>
            <StatReveal label="H200 Cluster" tone="accent" />
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:col-span-8 md:grid-cols-2">
            <motion.div variants={fadeInUp} whileHover={{ y: -4 }} className="glass-panel group relative overflow-hidden rounded-2xl p-7 transition hover:bg-white/[0.04]">
              <ConsultBranchVisual />
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/10">
                <GitBranch className="h-5 w-5 text-enterprise-primary" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Xobriq Consult</h3>
              <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">
                AI strategy and MLOps engagements led by a former Google AI researcher. Begins with an AI Maturity Assessment.
              </p>
              <StatReveal label="Ex-Google AI" />
            </motion.div>

            <motion.div variants={fadeInUp} whileHover={{ y: -4 }} className="glass-panel group relative overflow-hidden rounded-2xl p-7 transition hover:bg-white/[0.04]">
              <CyberPulseVisual />
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-xred-500/10">
                <ShieldAlert className="h-5 w-5 text-xred-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Xobriq Cyber</h3>
              <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">
                Pentesting, managed SIEM, incident response, AI security audits and ISO 27001 readiness for enterprise clients.
              </p>
              <StatReveal label="ISO 27001" tone="red" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
