"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "./animations";

export function HomeCTA() {
  return (
    <section className="bg-enterprise-bg py-20 sm:py-28">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="mx-auto max-w-5xl rounded-3xl border border-enterprise-primary/25 bg-gradient-to-br from-enterprise-primary/10 via-transparent to-enterprise-accent/10 p-10 text-center sm:p-16"
      >
        <motion.p variants={fadeInUp} className="label-caps-thin text-enterprise-accent">Start Today</motion.p>
        <motion.h2 variants={fadeInUp} className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready to deploy sovereign intelligence?
        </motion.h2>
        <motion.p variants={fadeInUp} className="mx-auto mt-5 max-w-2xl text-enterprise-fg-muted">
          Talk to our team about Guard integration, GPU reservations, agentic
          AI pilots, or a full AI maturity assessment.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="glow-hover w-full rounded-lg bg-enterprise-primary px-10 py-3.5 text-sm font-bold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover sm:w-auto sm:text-base"
          >
            Get API Key
          </Link>
          <Link
            href="/contact"
            className="w-full rounded-lg border border-enterprise-border bg-enterprise-bg-low px-10 py-3.5 text-sm font-bold text-enterprise-fg transition hover:border-enterprise-primary/40 sm:w-auto sm:text-base"
          >
            Talk to Sales
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}