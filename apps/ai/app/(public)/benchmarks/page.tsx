"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, GitCompare, Database, FileCheck2, ArrowRight } from "lucide-react";

const methodology = [
  {
    step: "01",
    icon: Eye,
    title: "Shadow-mode deployment",
    desc: "Xobriq scores your live traffic in parallel with your existing system — nothing changes for your users while we measure.",
  },
  {
    step: "02",
    icon: GitCompare,
    title: "Side-by-side comparison",
    desc: "Detection accuracy, latency, and throughput are measured against your current stack's own output, not a generic industry average.",
  },
  {
    step: "03",
    icon: Database,
    title: "Your data, your environment",
    desc: "Every number comes from your production traffic and your infrastructure — never a synthetic benchmark dataset.",
  },
  {
    step: "04",
    icon: FileCheck2,
    title: "Signed-off results",
    desc: "You get a report of the pilot's measured outcomes before deciding on production cutover — and you keep the data.",
  },
];

export default function BenchmarksPage() {
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <section className="px-5 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="label-caps-thin text-enterprise-accent">Performance &amp; Methodology</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Built for speed. Proven on your data — not ours.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-enterprise-fg-muted">
            We don&apos;t publish marketing benchmark sheets. Every performance claim gets validated
            against your own production traffic during a pilot, measured transparently alongside
            your existing system.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {methodology.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="glass-panel rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/10">
                      <Icon className="h-5 w-5 text-enterprise-primary" />
                    </div>
                    <span className="font-mono text-xs font-bold text-enterprise-primary">{m.step}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-enterprise-fg-muted">{m.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="glass-panel mt-14 rounded-2xl p-8 sm:p-10">
            <p className="label-caps-thin text-enterprise-accent">Infrastructure</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              GPU-accelerated, deployed close to your users.
            </h2>
            <p className="mt-4 max-w-2xl text-enterprise-fg-muted">
              Guard runs on our Nairobi DGX H200 cluster with MIG isolation and per-second billing,
              so latency-sensitive workloads like fraud scoring and liveness detection stay close to
              where your traffic actually originates — with full Kenya data residency for regulated
              workloads.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact?type=discovery_call"
              className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
            >
              Book a Pilot <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-6 py-3 text-sm font-semibold hover:border-enterprise-border-strong"
            >
              Talk to Engineering
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
