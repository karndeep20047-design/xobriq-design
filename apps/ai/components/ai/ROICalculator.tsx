"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { HeroBackgroundSnippet } from "@/components/ui/tailwind-css-background-snippet";
import { fadeInUp, staggerFast, viewportOnce } from "./animations";

type Preset = {
  label: string;
  volume: number;
  rate: number;
  value: number;
};

const PRESETS: Preset[] = [
  { label: "Fintech Starter", volume: 100000, rate: 0.8, value: 35 },
  { label: "Scale-Up", volume: 1000000, rate: 1.2, value: 50 },
  { label: "Enterprise Core", volume: 5000000, rate: 1.8, value: 85 },
];

export function ROICalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState(500000);
  const [fraudRate, setFraudRate] = useState(1.2);
  const [avgValue, setAvgValue] = useState(45);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Xobriq Guard achieves 70% typical fraud loss recovery
  const recoveryFactor = 0.7;

  const monthlyFraudLoss = (monthlyVolume * (fraudRate / 100) * avgValue);
  const monthlyPrevented = monthlyFraudLoss * recoveryFactor;
  const annualLoss = monthlyFraudLoss * 12;
  const annualPrevented = monthlyPrevented * 12;

  // Estimated manual review hours saved (avg 12 mins saved per flagged transaction handled by agentic AI)
  const monthlyReviewHoursSaved = Math.round((monthlyVolume * (fraudRate / 100) * 0.5) * (12 / 60));

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return "$" + Math.round(n / 1_000).toLocaleString() + "K";
    return "$" + Math.round(n).toLocaleString();
  };

  const applyPreset = (preset: Preset) => {
    setMonthlyVolume(preset.volume);
    setFraudRate(preset.rate);
    setAvgValue(preset.value);
    setActivePreset(preset.label);
  };

  const handleCustomChange = () => {
    if (activePreset) setActivePreset(null);
  };

  return (
    <section className="relative overflow-hidden py-14 sm:py-24 lg:py-32 border-y border-x-line text-x-fg">
      {/* 21st.dev Radial Aurora Gradient & Tech Grid Background (Matches Hero) */}
      <HeroBackgroundSnippet />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerFast}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-x-accent sm:text-base"
          >
            Calculate Your ROI
          </motion.p>

          <motion.h2
            variants={fadeInUp}
            className="mt-2.5 sm:mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl"
          >
            How much fraud could you{" "}
            <span className="text-x-accent italic">prevent?</span>
          </motion.h2>

          <motion.p variants={fadeInUp} className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-x-muted">
            Simulate how Xobriq&apos;s 70% risk detection boost impacts your bottom line in real-time.
          </motion.p>
        </motion.div>

        {/* Preset Selector */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
        >
          <span className="text-xs font-mono uppercase tracking-wider text-x-dim mr-2 hidden sm:inline">
            Presets:
          </span>
          {PRESETS.map((p) => {
            const isSelected = activePreset === p.label;
            return (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-mono font-medium border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-white bg-white/15 text-white shadow-sm font-semibold"
                    : "border-white/20 bg-x-bg/60 text-x-muted hover:border-white/60 hover:text-x-fg"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </motion.div>

        {/* Calculator Main Layout */}
        <div className="mt-6 sm:mt-12 grid gap-5 sm:gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
          {/* Left: Input Controls */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border-2 border-white/30 bg-x-bg/80 p-5 sm:p-8 backdrop-blur-xl shadow-xl"
          >
            <div>
              <div className="flex items-center gap-3 pb-4 sm:pb-6 border-b border-white/20">
                <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl border-2 border-white/40 bg-white/10">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-semibold text-x-fg">Transaction Parameters</h3>
                  <p className="text-[11px] sm:text-xs text-x-muted">Slide to match your operational volume</p>
                </div>
              </div>

              <div className="mt-5 sm:mt-8 space-y-5 sm:space-y-8">
                {/* Control 1 */}
                <SliderControl
                  label="Monthly Transaction Volume"
                  value={monthlyVolume}
                  min={10000}
                  max={10000000}
                  step={10000}
                  displayValue={monthlyVolume.toLocaleString() + " txns"}
                  onChange={(v) => {
                    setMonthlyVolume(v);
                    handleCustomChange();
                  }}
                />

                {/* Control 2 */}
                <SliderControl
                  label="Baseline Fraud Rate"
                  value={fraudRate}
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  displayValue={fraudRate.toFixed(1) + "% of total"}
                  onChange={(v) => {
                    setFraudRate(v);
                    handleCustomChange();
                  }}
                />

                {/* Control 3 */}
                <SliderControl
                  label="Average Order Value (AOV)"
                  value={avgValue}
                  min={5}
                  max={500}
                  step={5}
                  displayValue={"$" + avgValue.toFixed(0) + " USD"}
                  onChange={(v) => {
                    setAvgValue(v);
                    handleCustomChange();
                  }}
                />
              </div>
            </div>

            {/* Micro reassurance */}
            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20 flex items-center gap-2 text-[11px] sm:text-xs text-x-dim">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-x-accent shrink-0" />
              <span>Calculated using proven benchmark algorithms from live production clusters.</span>
            </div>
          </motion.div>

          {/* Right: Soothing Scorecard & Visualizer */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border-2 border-x-accent bg-gradient-to-b from-x-accent/10 via-x-bg/90 to-x-bg p-5 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Ambient background glow orb */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-x-accent/20 blur-3xl"
            />

            <div className="relative">
              {/* Scorecard Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-x-line">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl border-2 border-x-accent bg-x-accent/20">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-x-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-x-fg">Projected Impact Scorecard</h3>
                    <p className="text-[11px] sm:text-xs text-x-muted">Estimated net value with Xobriq Guard</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-x-accent bg-x-accent/10 px-3 py-1 text-[11px] font-mono font-semibold text-x-accent">
                  <span className="h-2 w-2 rounded-full bg-x-accent animate-pulse" />
                  Live Model
                </div>
              </div>

              {/* Hero Metric Box */}
              <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border-2 border-x-accent bg-x-accent/10 p-4 sm:p-6 text-center relative overflow-hidden shadow-sm">
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] text-x-accent font-bold">
                  Estimated Annual Fraud Prevented
                </p>
                <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-2">
                  <span className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-x-fg tabular-nums">
                    {formatCurrency(annualPrevented)}
                  </span>
                </div>
                <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-x-muted">
                  Based on Xobriq Guard&apos;s 70% risk detection recovery vs. standard rules
                </p>
              </div>

              {/* Visual Comparison Bar */}
              <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between text-[11px] sm:text-xs font-mono">
                  <span className="text-x-muted">Annual Exposure Comparison</span>
                  <span className="text-x-accent font-semibold">+70% Shielded</span>
                </div>

                <div className="space-y-2">
                  {/* Baseline loss bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-x-dim mb-1">
                      <span>Baseline Loss (No Xobriq)</span>
                      <span className="tabular-nums">{formatCurrency(annualLoss)}</span>
                    </div>
                    <div className="h-2 sm:h-2.5 w-full rounded-full bg-x-line/60 overflow-hidden">
                      <div className="h-full bg-red-500/70 rounded-full w-full" />
                    </div>
                  </div>

                  {/* With Xobriq Protected Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-x-fg font-medium mb-1">
                      <span className="text-x-accent">Net Protected Recovery</span>
                      <span className="tabular-nums font-bold text-x-accent">{formatCurrency(annualPrevented)}</span>
                    </div>
                    <div className="h-2.5 sm:h-3 w-full rounded-full bg-x-line/60 overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-x-accent to-x-accent-bright shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "70%" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Metrics Cards */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-x-line bg-x-bg/60 p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-x-accent">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-xs font-mono font-medium text-x-dim uppercase">Monthly Savings</span>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold text-x-fg tabular-nums">
                    {formatCurrency(monthlyPrevented)}
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-x-muted hidden sm:block">Recurring monthly recovery</p>
                </div>

                <div className="rounded-xl border border-x-line bg-x-bg/60 p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-x-accent">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-xs font-mono font-medium text-x-dim uppercase">Review Hours</span>
                  </div>
                  <p className="mt-1.5 sm:mt-2 text-base sm:text-xl font-bold text-x-fg tabular-nums">
                    ~{monthlyReviewHoursSaved.toLocaleString()}h/mo
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-x-muted hidden sm:block">Manual labor saved</p>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-x-line flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <p className="text-[11px] sm:text-xs text-x-muted text-center sm:text-left">
                Want to run this calculation against your custom transaction log?
              </p>

              <Link
                href="/contact?type=demo_request"
                className="group shrink-0 inline-flex items-center gap-2 rounded-xl bg-x-fg px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-x-bg transition-all duration-200 hover:bg-x-fg/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <span>Validate with Live Data</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-mono text-x-dim uppercase tracking-wider font-medium">{label}</label>
        <span className="font-mono font-semibold text-x-accent tabular-nums bg-x-accent/10 border border-white/40 px-2.5 py-0.5 rounded-md">
          {displayValue}
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none bg-x-line/40 cursor-pointer accent-x-accent focus:outline-none"
          style={{
            background: `linear-gradient(to right, var(--x-accent) 0%, var(--x-accent) ${percentage}%, var(--x-line) ${percentage}%, var(--x-line) 100%)`,
          }}
        />
      </div>
    </div>
  );
}