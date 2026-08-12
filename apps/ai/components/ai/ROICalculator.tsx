"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, ArrowRight, DollarSign } from "lucide-react";

export function ROICalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState(500000);
  const [fraudRate, setFraudRate] = useState(1.2);
  const [avgValue, setAvgValue] = useState(45);

  // Xobriq catches ~70% more fraud than baseline systems
  const improvementRate = 0.7;

  const monthlyFraudLoss = (monthlyVolume * fraudRate * avgValue) / 100;
  const monthlyPrevented = monthlyFraudLoss * improvementRate;
  const annualPrevented = monthlyPrevented * 12;
  const annualLoss = monthlyFraudLoss * 12;

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
    return "$" + n.toFixed(0);
  };

  return (
    <section className="bg-enterprise-bg-low/30 py-24 sm:py-28 backdrop-blur-md border-y border-enterprise-border/40">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-3xl text-center mx-auto"
        >
          <p className="label-caps-thin text-enterprise-accent">Calculate Your ROI</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            How much fraud could you{" "}
            <span className="text-enterprise-primary italic">prevent?</span>
          </h2>
          <p className="mt-4 text-enterprise-fg-muted max-w-2xl mx-auto">
            Adjust the sliders to match your volume. See estimated annual fraud prevention based
            on Xobriq&apos;s typical 70% improvement over baseline systems.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-enterprise-primary/10 border border-enterprise-primary/30 grid place-items-center">
                <Calculator className="h-5 w-5 text-enterprise-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-enterprise-fg">Your Inputs</h3>
                <p className="text-xs text-enterprise-fg-muted">Adjust to match your business</p>
              </div>
            </div>

            <div className="space-y-6">
              <SliderInput
                label="Monthly transaction volume"
                value={monthlyVolume}
                min={10000}
                max={10000000}
                step={10000}
                format={(n) => n.toLocaleString() + " transactions"}
                onChange={setMonthlyVolume}
              />
              <SliderInput
                label="Current fraud rate"
                value={fraudRate}
                min={0.1}
                max={5}
                step={0.1}
                format={(n) => n.toFixed(1) + "% of transactions"}
                onChange={setFraudRate}
              />
              <SliderInput
                label="Average transaction value"
                value={avgValue}
                min={5}
                max={500}
                step={5}
                format={(n) => "$" + n.toFixed(0) + " USD"}
                onChange={setAvgValue}
              />
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-2xl overflow-hidden border-2 border-enterprise-primary/30 relative"
          >
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-enterprise-primary/20 blur-3xl"
            />

            <div className="relative p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-enterprise-primary/20 border border-enterprise-primary/40 grid place-items-center">
                  <TrendingUp className="h-5 w-5 text-enterprise-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-enterprise-fg">Estimated Impact</h3>
                  <p className="text-xs text-enterprise-fg-muted">Per year with Xobriq Guard</p>
                </div>
              </div>

              <div className="space-y-5">
                <ResultCard
                  label="Current annual fraud losses"
                  value={formatCurrency(annualLoss)}
                  detail="Without additional protection"
                  isNegative
                />
                <ResultCard
                  label="Estimated annual fraud prevented"
                  value={formatCurrency(annualPrevented)}
                  detail="With Xobriq Guard's 70% improvement"
                  isPrimary
                  showAnimation
                />
                <ResultCard
                  label="Monthly fraud prevented"
                  value={formatCurrency(monthlyPrevented)}
                  detail="Recurring monthly ROI"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-enterprise-border/40">
                <p className="text-xs text-enterprise-fg-muted mb-4">
                  Estimates based on typical Xobriq Guard performance across banking, fintech, and
                  mobile money clients. Book a demo to validate with your data.
                </p>
                <Link
                  href="/contact?type=demo_request"
                  className="glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-5 py-2.5 text-sm font-bold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover"
                >
                  Book Demo to Validate
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-mono uppercase tracking-wider text-enterprise-fg-muted">
          {label}
        </label>
        <span className="text-sm font-bold text-enterprise-primary tabular-nums">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none bg-enterprise-border/40 accent-enterprise-primary cursor-pointer"
      />
    </div>
  );
}

function ResultCard({
  label,
  value,
  detail,
  isNegative,
  isPrimary,
  showAnimation,
}: {
  label: string;
  value: string;
  detail: string;
  isNegative?: boolean;
  isPrimary?: boolean;
  showAnimation?: boolean;
}) {
  const textColor = isNegative
    ? "text-red-400"
    : isPrimary
    ? "text-enterprise-primary"
    : "text-enterprise-fg";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={
        "rounded-xl p-5 border transition-all " +
        (isPrimary
          ? "border-enterprise-primary/40 bg-enterprise-primary/5"
          : "border-enterprise-border/40 bg-enterprise-bg-low/40")
      }
    >
      <p className="label-caps-thin text-enterprise-fg-subtle mb-2">{label}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <DollarSign className={"h-4 w-4 " + textColor} />
        <p className={"text-3xl font-bold tabular-nums " + textColor}>
          {value.replace("$", "")}
        </p>
        {showAnimation && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs font-mono text-enterprise-primary"
          >
            ●
          </motion.span>
        )}
      </div>
      <p className="text-xs text-enterprise-fg-muted">{detail}</p>
    </motion.div>
  );
}