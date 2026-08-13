"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { fadeInUp, staggerFast, viewportOnce } from "./animations";

type CaseStudy = {
  image: string;
  imageAlt: string;
  category: string;
  statusBadge: string;
  title: string;
  description: string;
  metricLabel: string;
  metricIcon: typeof ShieldCheck;
  linkHref: string;
};

const CASE_STUDIES: CaseStudy[] = [
  {
    image: "/images/ops-dashboard.png",
    imageAlt: "Fraud operations dashboard",
    category: "Financial Services",
    statusBadge: "Shadow Mode",
    title: "Shadow-mode fraud pilots",
    description:
      "Run Xobriq Guard alongside your existing fraud stack to prove detection lift on your live production traffic.",
    metricLabel: "70% Detection Lift",
    metricIcon: ShieldCheck,
    linkHref: "/contact?type=pilot_request",
  },
  {
    image: "/images/gpu-rack.png",
    imageAlt: "Sovereign GPU server clusters",
    category: "Infrastructure",
    statusBadge: "On-Premise",
    title: "Sovereign cloud buildouts",
    description:
      "Dedicated GPU capacity on our Nairobi cluster, scoped to your strict compliance and data residency requirements.",
    metricLabel: "100% Data Residency",
    metricIcon: Cpu,
    linkHref: "/contact?type=pilot_request",
  },
];

export function CaseStudiesPreview() {
  return (
    <section
      className="relative z-20 overflow-hidden py-10 sm:py-16 transition-colors duration-300 bg-[#0B0F19] text-white dark:bg-[#FAFCFF] dark:text-slate-900 border-y border-slate-800/80 dark:border-slate-200"
    >
      {/* Texture grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerFast}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 dark:text-blue-600"
          >
            Proved In Production
          </motion.p>

          <motion.h2
            variants={fadeInUp}
            className="mt-1.5 sm:mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl"
          >
            Built for Real-World Deployment
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-300 dark:text-slate-600 max-w-xl mx-auto"
          >
            Every engagement starts with a pilot on your own data. Measurable results in your environment.
          </motion.p>
        </motion.div>

        {/* Compact Horizontal Split Showcase Cards */}
        <div className="mt-6 sm:mt-8 grid gap-4 lg:grid-cols-2 max-w-[340px] sm:max-w-none mx-auto">
          {CASE_STUDIES.map((study) => (
            <CaseStudyCard key={study.title} study={study} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const Icon = study.metricIcon;

  return (
    <Link href={study.linkHref} className="block group">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className="relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-800 bg-[#121826] dark:border-slate-200 dark:bg-white shadow-md dark:shadow-lg transition-colors duration-300 hover:border-blue-500/50 dark:hover:border-blue-500/50 cursor-pointer"
      >
        {/* Media Box (Left / Top) */}
        <div className="relative h-36 sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-slate-950">
          <Image
            src={study.image}
            alt={study.imageAlt}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, 176px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Category Pill Tag */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-white backdrop-blur-md">
              {study.category}
            </span>
          </div>
        </div>

        {/* Content Body (Right / Bottom) */}
        <div className="flex flex-col justify-between flex-1 p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base sm:text-lg font-semibold text-white dark:text-slate-900 group-hover:text-blue-400 dark:group-hover:text-blue-600 transition-colors duration-200">
                {study.title}
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-300 dark:text-blue-600 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                {study.statusBadge}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-300 dark:text-slate-600 line-clamp-2">
              {study.description}
            </p>
          </div>

          {/* Metric + Link Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 dark:border-slate-100 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-blue-400 dark:text-blue-600">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{study.metricLabel}</span>
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-200 dark:text-slate-700 group-hover:text-blue-400 dark:group-hover:text-blue-600 transition-colors duration-150">
              <span>Explore pilot</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
