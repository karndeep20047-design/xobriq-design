"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Bot,
  Cpu,
  GitBranch,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { fadeInUp, staggerFast } from "./animations";
import { cn } from "@/lib/utils";

// Only start the reveal once the section is substantially on-screen (not the
// moment its top edge peeks into the viewport) — feels intentional rather
// than pre-emptive.
const revealViewport = { once: true, amount: 0.45 } as const;

/* "What We Provide" — full rebuild of the old bento PillarGrid.
   - Centered header, "What We Provide" is now the headline itself (not just
     an eyebrow above a differently-worded title).
   - Symmetric 5-up card row instead of the old 3/3/2/2/2 bento grid — a
     visibly different shape, not just a re-skin.
   - Each card carries a large translucent index numeral watermark instead
     of a floating brand-colored icon — the icon moves into a small chip in
     the header row. Card titles use the same font-display /
     tracking-[-0.02em] treatment as the headline.
   - Parallax hairline backdrop (five lines drifting at different scroll
     speeds) instead of the flat x-grid-bg dot grid. */

type Pillar = {
  index: string;
  name: string;
  title: string;
  body: string;
  href: string;
  stat: string;
  Icon: LucideIcon;
  iconClass: string;
  hoverClass: string;
  numClass: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    name: "Xobriq Guard",
    title: "Fraud Intelligence",
    body: "Real-time fraud scoring, deepfake and liveness detection — sub-200ms.",
    href: "/guard",
    stat: "120+ signals",
    Icon: ShieldCheck,
    iconClass: "text-teal-600 dark:text-teal-400",
    hoverClass: "hover:border-teal-500/30 hover:shadow-[0_20px_50px_-12px_rgba(20,184,166,0.18)] dark:hover:shadow-[0_20px_50px_-12px_rgba(20,184,166,0.35)]",
    numClass: "group-hover:text-teal-500/[0.22] dark:group-hover:text-teal-400/[0.25]",
  },
  {
    index: "02",
    name: "Agentic AI",
    title: "Autonomous Agents",
    body: "LLM agents that run fraud, KYC and compliance workflows with audit-grade reasoning.",
    href: "/agentic",
    stat: "24/7 autonomous",
    Icon: Bot,
    iconClass: "text-purple-600 dark:text-purple-400",
    hoverClass: "hover:border-purple-500/30 hover:shadow-[0_20px_50px_-12px_rgba(168,85,247,0.18)] dark:hover:shadow-[0_20px_50px_-12px_rgba(168,85,247,0.35)]",
    numClass: "group-hover:text-purple-500/[0.22] dark:group-hover:text-purple-400/[0.25]",
  },
  {
    index: "03",
    name: "Xobriq Cloud",
    title: "Sovereign GPU Compute",
    body: "East Africa's only DGX H200 cluster, with 100% Kenya data residency.",
    href: "/cloud",
    stat: "H200 cluster",
    Icon: Cpu,
    iconClass: "text-blue-600 dark:text-blue-400",
    hoverClass: "hover:border-blue-500/30 hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.35)]",
    numClass: "group-hover:text-blue-500/[0.22] dark:group-hover:text-blue-400/[0.25]",
  },
  {
    index: "04",
    name: "Xobriq Consult",
    title: "Strategy & MLOps",
    body: "AI strategy and MLOps engagements led by a former Google AI researcher.",
    href: "/consult",
    stat: "Ex-Google AI",
    Icon: GitBranch,
    iconClass: "text-amber-600 dark:text-amber-400",
    hoverClass: "hover:border-amber-500/30 hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.18)] dark:hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.35)]",
    numClass: "group-hover:text-amber-500/[0.22] dark:group-hover:text-amber-400/[0.25]",
  },
  {
    index: "05",
    name: "Xobriq Cyber",
    title: "Managed Defense",
    body: "Pentesting, managed SIEM and incident response, built toward ISO 27001.",
    href: "/cyber",
    stat: "ISO 27001",
    Icon: Lock,
    iconClass: "text-red-600 dark:text-red-400",
    hoverClass: "hover:border-red-500/30 hover:shadow-[0_20px_50px_-12px_rgba(239,68,68,0.18)] dark:hover:shadow-[0_20px_50px_-12px_rgba(239,68,68,0.35)]",
    numClass: "group-hover:text-red-500/[0.22] dark:group-hover:text-red-400/[0.25]",
  },
];

/* Vertical hairlines that drift at different speeds as the section scrolls
   through the viewport — cheap depth cue (pure transform, one shared
   useScroll listener) instead of a static dot grid. Amplitude collapses to
   0 under prefers-reduced-motion. */
function ParallaxLines() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const amp = prefersReducedMotion ? 0 : 1;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], [-30 * amp, 30 * amp]);
  const yMed = useTransform(scrollYProgress, [0, 1], [-64 * amp, 64 * amp]);
  const yFast = useTransform(scrollYProgress, [0, 1], [-100 * amp, 100 * amp]);

  const lines: { left: string; y: typeof ySlow; accent?: boolean }[] = [
    { left: "6%", y: yMed },
    { left: "24%", y: ySlow },
    { left: "50%", y: yFast, accent: true },
    { left: "76%", y: ySlow },
    { left: "94%", y: yMed },
  ];

  return (
    <div
      ref={sectionRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      {/* Dot grid for texture, feathered at the same edges as the lines. */}
      <div className="x-grid-bg absolute inset-0 opacity-90" />
      {/* Two soft static washes for depth — no motion, no blob shape. */}
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_srgb,var(--x-accent)_22%,transparent),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(65%_50%_at_85%_100%,color-mix(in_srgb,var(--x-accent-bright)_18%,transparent),transparent_70%)]" />
      {lines.map((l, i) => (
        <motion.div
          key={i}
          style={{ left: l.left, y: l.y }}
          className={
            "absolute top-0 h-[140%] w-px " +
            (l.accent ? "bg-x-accent/20" : "bg-x-line-strong")
          }
        />
      ))}
    </div>
  );
}

const iconAnimation: Variants = {
  initial: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.08,
    rotate: -4,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export function PillarGrid() {
  return (
    <section className="relative overflow-hidden bg-x-bg py-24 sm:py-32 transition-colors duration-150">
      <ParallaxLines />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center sm:mb-20"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-sm font-semibold uppercase tracking-[0.22em] text-x-accent sm:text-base"
          >
            our ecosystem
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl"
          >
            Five pillars, one platform.
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-base sm:text-lg text-x-muted">
            One console, one contract, one sovereign infrastructure.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        >
          {PILLARS.map((p, i) => {
            const Icon = p.Icon;
            // First and last cards ride a touch higher than the middle three
            // on the single-row desktop layout, for a gentle wave instead of
            // a dead-flat row. Plain (non-motion) wrapper so it doesn't
            // fight Framer's own animated transform on the parent. Skipped
            // below lg, where the grid wraps into multiple rows.
            const isEdge = i === 0 || i === PILLARS.length - 1;
            return (
              <motion.div key={p.href} variants={fadeInUp} className="h-full">
                <div className={cn("h-full transition-transform duration-500 ease-out", isEdge && "lg:-translate-y-16")}>
                <motion.div whileHover="hover" className="h-full">
                  <Link
                    href={p.href}
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden rounded-lg border border-x-line bg-x-bg p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-x-raised",
                      p.hoverClass
                    )}
                  >
                    {/* Accent hairline that draws itself across the top on hover. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-x-accent transition-transform duration-500 group-hover:scale-x-100"
                    />

                    {/* Large translucent index numeral watermark — pulled inward so
                        the card's own overflow-hidden/rounded corner doesn't clip it. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute right-3 top-[-6px] select-none font-display text-[4.75rem] font-bold leading-none text-x-fg/[0.08] transition-all duration-500 ease-out group-hover:-translate-y-1.5",
                        p.numClass
                      )}
                    >
                      {p.index}
                    </span>

                    <motion.div variants={iconAnimation} className="relative z-10">
                      <Icon className={"h-7 w-7 stroke-[1.5] " + p.iconClass} />
                    </motion.div>

                    <div className="relative z-10">
                      <p className="x-label mt-5 text-x-muted">{p.name}</p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold leading-[1.15] tracking-[-0.02em] text-x-fg">
                        {p.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-6 text-x-muted">{p.body}</p>
                    </div>

                    <div className="relative z-10 mt-auto flex items-center justify-between border-t border-x-line pt-4">
                      <p className="x-label text-x-dim transition-colors group-hover:text-x-fg">
                        {p.stat}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-x-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-x-accent" />
                    </div>
                  </Link>
                </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
