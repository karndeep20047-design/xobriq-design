"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

type Pillar = {
  index: string;
  name: string;
  title: string;
  body: string;
  href: string;
  stat: string;
  span: string;
  Icon: LucideIcon;
  colorClass: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    name: "Xobriq Guard",
    title: "Fraud Intelligence",
    body: "Real-time fraud scoring across 120+ signals, plus deepfake, liveness, identity and behavioural detection — sub-200ms from Nairobi, trained on East African banking data.",
    href: "/guard",
    stat: "120+ signals",
    span: "md:col-span-3",
    Icon: ShieldCheck,
    colorClass: "text-teal-600/75 group-hover:text-teal-500 dark:text-teal-400/80 dark:group-hover:text-teal-300",
  },
  {
    index: "02",
    name: "Agentic AI",
    title: "Autonomous Agents",
    body: "LLM-powered agents that execute fraud investigation, KYC and compliance workflows with audit-grade reasoning.",
    href: "/agentic",
    stat: "24/7 autonomous",
    span: "md:col-span-3",
    Icon: Bot,
    colorClass: "text-purple-600/75 group-hover:text-purple-500 dark:text-purple-400/80 dark:group-hover:text-purple-300",
  },
  {
    index: "03",
    name: "Xobriq Cloud",
    title: "Sovereign GPU Compute",
    body: "East Africa's only DGX H200 cluster. Per-second billing, MIG isolation, 100% Kenya data residency.",
    href: "/cloud",
    stat: "H200 cluster",
    span: "md:col-span-2",
    Icon: Cpu,
    colorClass: "text-blue-600/75 group-hover:text-blue-500 dark:text-blue-400/80 dark:group-hover:text-blue-300",
  },
  {
    index: "04",
    name: "Xobriq Consult",
    title: "Strategy & MLOps",
    body: "AI strategy and MLOps engagements led by a former Google AI researcher, starting with an AI Maturity Assessment.",
    href: "/consult",
    stat: "Ex-Google AI",
    span: "md:col-span-2",
    Icon: GitBranch,
    colorClass: "text-amber-600/75 group-hover:text-amber-500 dark:text-amber-400/80 dark:group-hover:text-amber-300",
  },
  {
    index: "05",
    name: "Xobriq Cyber",
    title: "Managed Defense",
    body: "Pentesting, managed SIEM, incident response, AI security audits and ISO 27001 readiness.",
    href: "/cyber",
    stat: "ISO 27001",
    span: "md:col-span-2",
    Icon: Lock,
    colorClass: "text-red-600/75 group-hover:text-red-500 dark:text-red-400/80 dark:group-hover:text-red-300",
  },
];

const iconAnimation = {
  initial: { scale: 1, rotate: 0, opacity: 0.25 },
  hover: {
    scale: 1.12,
    rotate: 5,
    opacity: 0.85,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export function PillarGrid() {
  return (
    <section className="relative overflow-hidden bg-x-bg py-24 sm:py-32 transition-colors duration-150">
      {/* Feather the grid away at both edges using alpha mask (no color gradient element) */}
      <div
        aria-hidden
        className="x-grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-2xl">
          <p className="x-label text-x-accent">The Ecosystem</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl">
            Five pillars, one platform.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-x-muted">
            One console, one contract, one sovereign infrastructure.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerFast}
          className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-x-line bg-x-line md:grid-cols-6"
        >
          {PILLARS.map((p) => {
            const Icon = p.Icon;
            return (
              <motion.div key={p.href} variants={fadeInUp} className={p.span}>
                <motion.div whileHover="hover" className="h-full">
                  <Link
                    href={p.href}
                    className="group relative flex h-full flex-col overflow-hidden bg-x-bg p-8 transition-colors duration-300 hover:bg-x-raised"
                  >
                    {/* Accent hairline that draws itself across the top on hover. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-x-accent transition-transform duration-500 group-hover:scale-x-100"
                    />

                    <div className="relative z-10 flex items-start justify-between">
                      <span className="x-label text-x-dim transition-colors group-hover:text-x-accent">
                        {p.index}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <p className="x-label mt-10 text-x-muted">{p.name}</p>
                      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-x-fg">
                        {p.title}
                      </h3>
                      <p className="mt-4 flex-1 text-sm leading-6 text-x-muted">{p.body}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-auto pt-8">
                      <p className="x-label text-x-dim transition-colors group-hover:text-x-fg">
                        {p.stat}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-x-dim transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-x-accent" />
                    </div>

                    {/* Decorative Respective Pillar Icon with Respective Brand Colors */}
                    <motion.div
                      aria-hidden
                      variants={iconAnimation}
                      className={
                        "pointer-events-none absolute top-5 right-5 sm:top-6 sm:right-6 z-0 transition-colors duration-300 " +
                        p.colorClass
                      }
                    >
                      <Icon className="h-12 w-12 sm:h-14 sm:w-14 stroke-[1.5]" />
                    </motion.div>
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
