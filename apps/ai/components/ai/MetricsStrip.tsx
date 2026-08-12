"use client";

import { AnimatedNumber } from "./AnimatedNumber";

type Accent = "primary" | "accent";

type Metric = {
  target: number;
  decimals?: number;
  suffix: string;
  label: string;
  accent: Accent;
};

const metrics: Metric[] = [
  {
    target: 99.2,
    decimals: 1,
    suffix: "%",
    label: "Fraud Detection Accuracy",
    accent: "primary",
  },
  {
    target: 200,
    suffix: "ms",
    label: "Risk Scoring Latency",
    accent: "accent",
  },
  {
    target: 97,
    suffix: "%",
    label: "Liveness Detection Accuracy",
    accent: "primary",
  },
  {
    target: 99.9,
    decimals: 1,
    suffix: "%",
    label: "API Uptime SLA",
    accent: "accent",
  },
];

export function MetricsStrip() {
  return (
    <section className="relative z-20 border-y border-enterprise-border/40 bg-enterprise-bg-lower py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 sm:px-6 md:grid-cols-4">
        {metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>
    </section>
  );
}

function Metric({ target, decimals = 0, suffix, label, accent }: Metric) {
  const colorClass =
    accent === "primary" ? "text-enterprise-primary" : "text-enterprise-accent";

  return (
    <div className="text-center">
      <p className={"font-bold tabular-nums " + colorClass + " text-4xl sm:text-5xl md:text-6xl"}>
        <AnimatedNumber value={target} decimals={decimals} suffix={suffix} duration={1.8} />
      </p>
      <p className="label-caps-thin mt-2 text-enterprise-fg-muted">{label}</p>
    </div>
  );
}