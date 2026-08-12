"use client";

import { motion, type Variants } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ParticleScanReveal } from "./ParticleScanReveal";
import { FlowButton } from "@/components/ui/flow-button";
import { Button6 } from "@/components/ui/button-6";
import { HeroBackgroundSnippet } from "@/components/ui/tailwind-css-background-snippet";

/* The hero follows the site-wide light/dark toggle, same as MetricsBand and
   PillarGrid — every colour here is the shared x-bg/x-fg/x-muted/x-accent
   token set, not a literal. */

const EASE = [0.16, 1, 0.3, 1] as const;

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE, delay: d },
  }),
};

const lineWrap = "overflow-hidden";
const line: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: d },
  }),
};

const CALLOUTS = [
  {
    value: "99.2%",
    label: "Fraud Detection Accuracy",
    className: "top-2 -left-3 sm:top-[4%] sm:-left-12 text-left z-40",
    animClass: "animate-hero-float-1",
    delay: 1.2,
  },
  {
    value: "200ms",
    label: "Risk Scoring Latency",
    className: "bottom-2 -right-3 sm:bottom-[6%] sm:-right-10 text-left z-40",
    animClass: "animate-hero-float-2",
    delay: 1.4,
  },
];

export function HeroParticleScan() {
  return (
    <section className="relative mt-0 sm:-mt-20 flex min-h-screen items-center overflow-hidden text-x-fg">
      {/* 21st.dev Radial Aurora Gradient & Tech Grid Background */}
      <HeroBackgroundSnippet />

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-12 pt-28 sm:px-6 sm:gap-10 sm:pb-14 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-28"
      >
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <motion.div
            variants={rise}
            custom={0}
            className="group mb-6 sm:mb-9 hidden sm:inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:bg-white/90 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:border-white/30 dark:hover:bg-white/[0.10]"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 dark:bg-cyan-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-cyan-400" />
            </span>
            <span className="font-sans font-semibold tracking-tight">Enterprise AI &amp; Cyber Defense</span>
            <span className="h-3.5 w-[1px] bg-slate-300 dark:bg-white/20" />
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-cyan-400">
              <span>Platform 2.0</span>
              <Sparkles className="h-3 w-3 transition-transform duration-300 group-hover:scale-110" />
            </span>
          </motion.div>

          <h1 className="font-display text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold leading-[1.05] sm:leading-[0.95] tracking-[-0.03em] text-center sm:text-left">
            <span className={`block ${lineWrap}`}>
              <motion.span variants={line} custom={0.15} className="block">
                See what
              </motion.span>
            </span>
            <span className={`block ${lineWrap}`}>
              <motion.span variants={line} custom={0.28} className="block text-x-accent">
                others{" "}
                <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 dark:from-sky-400 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent inline">
                  miss.
                </span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={rise}
            custom={0.55}
            className="mt-5 sm:mt-8 max-w-lg text-sm sm:text-lg leading-6 sm:leading-8 text-x-muted text-center sm:text-left mx-auto sm:mx-0"
          >
            Fraud intelligence, autonomous agents, sovereign GPU compute and
            managed cyber defense. All under one platform, built in East Africa for
            enterprises everywhere.
          </motion.p>

          <motion.div
            variants={rise}
            custom={0.7}
            className="mt-6 sm:mt-11 flex flex-row items-center justify-center sm:justify-start gap-2.5 sm:gap-4 w-full sm:w-auto"
          >
            <FlowButton href="/register" text="Get Started" className="w-[142px] xs:w-[160px] sm:w-auto" />
            <Button6 href="/contact?type=demo_request" className="w-[142px] xs:w-[160px] sm:w-auto">
              Book a Demo
            </Button6>
          </motion.div>
        </div>

        {/* Artwork container */}
        <motion.div
          variants={rise}
          custom={0.3}
          style={{ willChange: "transform, opacity" }}
          className="relative mx-auto w-full max-w-[420px] sm:max-w-[480px] lg:mx-0 lg:ml-auto"
        >
          <div className="relative z-10">
            <ParticleScanReveal
              src="/images/hero-portrait.png"
              alt="Portrait revealed as a particle scan on hover"
              showGrid={false}
              restingOpacity={0}
              introScan
              introDelay={400}
              className="aspect-[768/840] w-full"
              style={{
                clipPath: "ellipse(50% 45.71% at 50% 50%)",
                WebkitClipPath: "ellipse(50% 45.71% at 50% 50%)",
              }}
            />
          </div>

          {/* Decorative scan-target ring (Dual Orbital SVG Radar Ellipse Ring - Mathematically matched to portrait clip-path) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[-2.5%] z-0"
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full w-full animate-[spin_10s_linear_infinite]"
            >
              <defs>
                <linearGradient id="hero-radar-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0072c4" stopOpacity="0.95" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#818cf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0072c4" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <ellipse
                cx="50"
                cy="50"
                rx="48.8"
                ry="44.6"
                fill="none"
                stroke="url(#hero-radar-ring-grad)"
                strokeWidth="0.6"
                strokeDasharray="100 53.3"
              />
            </svg>
          </div>

          {/* GPU-Accelerated Hardware Translucent Floating Callout Cards (Light White Glass in Light Mode, Dark Grey Glass in Dark Mode) */}
          {CALLOUTS.map((c) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: c.delay }}
              style={{ willChange: "transform, opacity" }}
              className={`absolute ${c.className}`}
            >
              <div
                className={`rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 shadow-lg backdrop-blur-xl dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-[0_10px_35px_rgba(0,0,0,0.8)] ${c.animClass}`}
              >
                <p className="font-sans text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {c.value}
                </p>
                <p className="font-sans text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mt-0.5 whitespace-nowrap">
                  {c.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
