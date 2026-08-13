"use client";

import { motion } from "framer-motion";
import { Marquee } from "./Marquee";
import { fadeInUp, viewportOnce } from "./animations";

/* Replaces the old TrustBar's fabricated "trusted by" logo marquee — those
   were placeholder company names, not real clients. This states verticals
   Xobriq is actually built for (the same list the /register industry
   picker uses), with no implied client roster. A continuous marquee still
   reads as the "belt of proof" motion pattern visitors expect right after
   the pillars, just honest about what's actually being claimed. */

const INDUSTRIES: string[] = [
  "Banking & Capital Markets",
  "Fintech & Mobile Money",
  "Insurance",
  "Telco",
  "Government & Public Sector",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
];

export function IndustriesStrip() {
  return (
    <section className="bg-x-bg py-12 transition-colors duration-150 sm:py-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="mx-auto mb-8 max-w-7xl px-5 text-center sm:px-6 lg:px-8"
      >
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.22em] text-x-accent sm:text-base">
          Industries We Serve
        </h2>
        <p className="mt-4 text-base sm:text-lg text-x-muted">
          Built for regulated, high-stakes industries.
        </p>
      </motion.div>

      <Marquee speed={34}>
        {INDUSTRIES.map((label) => (
          <span key={label} className="inline-flex shrink-0 items-center px-5 py-2.5">
            <span className="text-sm font-medium text-x-fg">{label}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
