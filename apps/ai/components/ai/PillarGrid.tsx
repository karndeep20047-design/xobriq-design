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
import { fadeInUp, staggerFast, viewportOnce } from "./animations";

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
  chipClass: string;
  iconClass: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    name: "Xobriq Guard",
    title: "Fraud Intelligence",
    body: "Real-time fraud scoring across 120+ signals, plus deepfake, liveness and behavioural detection — sub-200ms from Nairobi.",
    href: "/guard",
    stat: "120+ signals",
    Icon: ShieldCheck,
    chipClass: "border-teal-500/25 bg-teal-500/10 dark:border-teal-400/20 dark:bg-teal-400/10",
    iconClass: "text-teal-600 dark:text-teal-400",
  },
  {
    index: "02",
    name: "Agentic AI",
    title: "Autonomous Agents",
    body: "LLM-powered agents that execute fraud investigation, KYC and compliance workflows with audit-grade reasoning.",
    href: "/agentic",
    stat: "24/7 autonomous",
    Icon: Bot,
    chipClass: "border-purple-500/25 bg-purple-500/10 dark:border-purple-400/20 dark:bg-purple-400/10",
    iconClass: "text-purple-600 dark:text-purple-400",
  },
  {
    index: "03",
    name: "Xobriq Cloud",
    title: "Sovereign GPU Compute",
    body: "East Africa's only DGX H200 cluster. Per-second billing, MIG isolation, 100% Kenya data residency.",
    href: "/cloud",
    stat: "H200 cluster",
    Icon: Cpu,
    chipClass: "border-blue-500/25 bg-blue-500/10 dark:border-blue-400/20 dark:bg-blue-400/10",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  {
    index: "04",
    name: "Xobriq Consult",
    title: "Strategy & MLOps",
    body: "AI strategy and MLOps engagements led by a former Google AI researcher, starting with a maturity assessment.",
    href: "/consult",
    stat: "Ex-Google AI",
    Icon: GitBranch,
    chipClass: "border-amber-500/25 bg-amber-500/10 dark:border-amber-400/20 dark:bg-amber-400/10",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    index: "05",
    name: "Xobriq Cyber",
    title: "Managed Defense",
    body: "Pentesting, managed SIEM, incident response, AI security audits and ISO 27001 readiness.",
    href: "/cyber",
    stat: "ISO 27001",
    Icon: Lock,
    chipClass: "border-red-500/25 bg-red-500/10 dark:border-red-400/20 dark:bg-red-400/10",
    iconClass: "text-red-600 dark:text-red-400",
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
      {/* Ultra-faint static wash for depth — no motion, no blob shape. */}
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_srgb,var(--x-accent)_6%,transparent),transparent_70%)]" />
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
        <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center sm:mb-20">
          <p className="x-label text-x-accent">What We Provide</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-x-fg sm:text-5xl md:text-6xl">
            Five pillars, one platform.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-x-muted">
            One console, one contract, one sovereign infrastructure.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerFast}
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-x-line bg-x-line sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
        >
          {PILLARS.map((p) => {
            const Icon = p.Icon;
            return (
              <motion.div key={p.href} variants={fadeInUp}>
                <motion.div whileHover="hover" className="h-full">
                  <Link
                    href={p.href}
                    className="group relative flex h-full flex-col overflow-hidden bg-x-bg p-7 transition-colors duration-300 hover:bg-x-raised"
                  >
                    {/* Accent hairline that draws itself across the top on hover. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-x-accent transition-transform duration-500 group-hover:scale-x-100"
                    />

                    {/* Large translucent index numeral watermark. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-1 -top-3 select-none font-display text-[6rem] font-bold leading-none text-x-fg/[0.045] transition-colors duration-300 group-hover:text-x-accent/[0.09]"
                    >
                      {p.index}
                    </span>

                    <motion.div
                      variants={iconAnimation}
                      className={
                        "relative z-10 grid h-11 w-11 place-items-center rounded-xl border transition-colors duration-300 " +
                        p.chipClass
                      }
                    >
                      <Icon className={"h-5 w-5 stroke-[1.75] " + p.iconClass} />
                    </motion.div>

                    <div className="relative z-10">
                      <p className="x-label mt-8 text-x-muted">{p.name}</p>
                      <h3 className="mt-2 font-display text-xl font-semibold leading-[1.15] tracking-[-0.02em] text-x-fg">
                        {p.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-x-muted">{p.body}</p>
                    </div>

                    <div className="relative z-10 mt-8 flex items-center justify-between border-t border-x-line pt-5">
                      <p className="x-label text-x-dim transition-colors group-hover:text-x-fg">
                        {p.stat}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-x-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-x-accent" />
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
