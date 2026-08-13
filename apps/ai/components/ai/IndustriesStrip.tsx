"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  Wallet,
  Umbrella,
  Signal,
  Landmark,
  HeartPulse,
  ShoppingBag,
  Factory,
  type LucideIcon,
} from "lucide-react";
import { Marquee } from "./Marquee";
import { fadeInUp, viewportOnce } from "./animations";

/* Replaces the old TrustBar's fabricated "trusted by" logo marquee — those
   were placeholder company names, not real clients. This states verticals
   Xobriq is actually built for (the same list the /register industry
   picker uses), with no implied client roster. A continuous marquee still
   reads as the "belt of proof" motion pattern visitors expect right after
   the pillars, just honest about what's actually being claimed. */

type Industry = {
  label: string;
  Icon: LucideIcon;
};

const INDUSTRIES: Industry[] = [
  { label: "Banking & Capital Markets", Icon: Banknote },
  { label: "Fintech & Mobile Money", Icon: Wallet },
  { label: "Insurance", Icon: Umbrella },
  { label: "Telco", Icon: Signal },
  { label: "Government & Public Sector", Icon: Landmark },
  { label: "Healthcare", Icon: HeartPulse },
  { label: "Retail & E-commerce", Icon: ShoppingBag },
  { label: "Manufacturing", Icon: Factory },
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
        <p className="x-label text-x-accent">Industries We Serve</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-x-fg sm:text-3xl">
          Built for regulated, high-stakes industries.
        </h2>
      </motion.div>

      <Marquee speed={34}>
        {INDUSTRIES.map((ind) => {
          const Icon = ind.Icon;
          return (
            <span
              key={ind.label}
              className="inline-flex shrink-0 items-center gap-2.5 px-5 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0 text-x-accent" />
              <span className="text-sm font-medium text-x-fg">{ind.label}</span>
            </span>
          );
        })}
      </Marquee>
    </section>
  );
}
