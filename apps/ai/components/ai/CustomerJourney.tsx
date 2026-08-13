"use client";

import { motion } from "framer-motion";
import { Plug2, ScanSearch, ShieldCheck, type LucideIcon } from "lucide-react";
import { fadeInUp, staggerFast } from "./animations";

/* "How It Works" — full rebuild of the old CustomerJourney (gradient-blob
   cards, dashed-circle "spotlight", pulsing status dot — the generic-
   template look the rest of this redesign has moved away from).
   Split layout: a centered "How It Works" eyebrow spans the top, then the
   headline/subhead sit left and the three steps run down the right as a
   vertical rail — closer to how Linear/Stripe lay out an explainer than a
   row of three identical cards. */

const revealViewport = { once: true, amount: 0.4 } as const;

type Step = {
  index: string;
  name: string;
  title: string;
  body: string;
  Icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    index: "01",
    name: "Connect",
    title: "Plug into your stack",
    body: "Wire Xobriq into your onboarding, transaction or identity flows through one API. No infrastructure changes, live in an afternoon.",
    Icon: Plug2,
  },
  {
    index: "02",
    name: "Detect & Analyze",
    title: "AI reads every signal",
    body: "Guard scores risk across 120+ signals in real time while agentic AI investigates flagged cases and reasons through the evidence.",
    Icon: ScanSearch,
  },
  {
    index: "03",
    name: "Respond",
    title: "Act before it's a loss",
    body: "Approve, block or escalate automatically in sub-200ms, with a full audit trail on every decision.",
    Icon: ShieldCheck,
  },
];

export function CustomerJourney() {
  return (
    <section
      className="relative overflow-hidden py-24 transition-colors duration-150 sm:py-32"
      style={{
        // An actual visible gradient rather than a flat colour. The first
        // attempt (13%/11% accent mixed into x-bg) was mathematically a
        // gradient but perceptually invisible — x-bg is pure black in dark
        // mode, and a color-mix that faint barely nudges off black at all.
        // Bumped hard enough to actually read as two-tone corners.
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--x-accent) 32%, var(--x-bg)) 0%, var(--x-bg) 50%, color-mix(in srgb, var(--x-accent-bright) 28%, var(--x-bg)) 100%)",
      }}
    >
      {/* Feathered dot grid on top of the gradient for texture. */}
      <div
        aria-hidden
        className="x-grid-bg pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={fadeInUp}
          className="text-center font-mono text-sm font-semibold uppercase tracking-[0.22em] text-x-accent sm:text-base"
        >
          How It Works
        </motion.p>

        <div className="mt-4 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left: headline + subhead */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={revealViewport}
            variants={staggerFast}
            className="text-center lg:text-left"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl"
            >
              From signal to decision.
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-base sm:text-lg text-x-muted">
              Three steps, sub-200ms, one platform.
            </motion.p>
          </motion.div>

          {/* Right: vertical step rail */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={revealViewport}
            variants={staggerFast}
          >
            {STEPS.map((step, i) => {
              const Icon = step.Icon;
              const isLast = i === STEPS.length - 1;
              return (
                <motion.div key={step.index} variants={fadeInUp} className="flex gap-5">
                  {/* Icon + the connector down to the next icon, in normal
                      flow — no absolute-position math to line up, so it
                      can't end up disconnected the way a separately-placed
                      line could. The travelling dot/glow are one shared
                      7s cycle across all three steps — see the
                      journey-dot / journey-active comment in globals.css. */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-x-line bg-x-bg journey-active-${i + 1}`}
                    >
                      <Icon className="h-6 w-6 text-x-accent" strokeWidth={1.75} />
                    </div>
                    {!isLast && (
                      <div className="relative z-0 -mt-3 -mb-3 w-px flex-1 bg-x-line">
                        <span aria-hidden className={`journey-dot-${i + 1}`} />
                      </div>
                    )}
                  </div>

                  <div className={isLast ? "pb-0" : "pb-10"}>
                    <p className="x-label text-x-dim">
                      {step.index} &middot; {step.name}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-[1.15] tracking-[-0.02em] text-x-fg">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-x-muted">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
