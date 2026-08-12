"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { fadeInUp, staggerFast, viewportOnce } from "./animations";

/* 2026 redesign replacement for MetricsStrip.
   Same published figures; new treatment — hairline-divided columns on the
   near-black ground, monospace micro-labels, and no per-metric colour coding
   (the old strip alternated brand primary/accent, which the redesign drops in
   favour of a single accent used sparingly). */

type Metric = {
  target: number;
  decimals?: number;
  suffix: string;
  label: string;
};

const METRICS: Metric[] = [
  { target: 99.2, decimals: 1, suffix: "%", label: "Fraud Detection Accuracy" },
  { target: 200, suffix: "ms", label: "Risk Scoring Latency" },
  { target: 97, suffix: "%", label: "Liveness Detection Accuracy" },
  { target: 99.9, decimals: 1, suffix: "%", label: "API Uptime SLA" },
];

export function MetricsBand() {
  return (
    <section className="relative border-y border-x-line bg-x-bg transition-colors duration-150">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerFast}
        className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-6 lg:grid-cols-4 lg:px-8"
      >
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            variants={fadeInUp}
            className={
              "border-x-line py-12 pr-6 sm:py-16 transition-colors duration-150 " +
              // Hairlines between columns only — never on the outer edges,
              // which the section's own border-y already closes.
              (i % 2 === 1 ? "border-l pl-6 " : "") +
              (i >= 2 ? "border-t lg:border-t-0 " : "") +
              (i === 2 ? "lg:border-l lg:pl-6 " : "") +
              (i === 3 ? "lg:pl-6 " : "")
            }
          >
            <p className="font-display text-4xl font-semibold tracking-[-0.02em] tabular-nums text-x-fg sm:text-5xl transition-colors duration-150">
              <AnimatedNumber
                value={m.target}
                decimals={m.decimals ?? 0}
                suffix={m.suffix}
                duration={1.8}
              />
            </p>
            <p className="x-label mt-3 text-x-dim transition-colors duration-150">{m.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
