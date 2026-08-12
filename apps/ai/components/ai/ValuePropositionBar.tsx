"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const supportingBadges = [
  "Real-time fraud scoring",
  "100% Kenya data residency",
  "Sub-100ms inference",
  "Regulator-ready audit trails",
];

export function ValuePropositionBar() {
  return (
    <section className="relative overflow-hidden border-y border-enterprise-border/40 bg-enterprise-bg-low/40 py-8">
      <motion.div
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[10%] top-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-enterprise-primary/10 blur-2xl"
      />
      <motion.div
        animate={{ x: [0, -40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute right-[10%] top-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-enterprise-accent/10 blur-2xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="mx-auto max-w-4xl text-lg font-semibold text-enterprise-fg sm:text-xl md:text-2xl leading-relaxed">
            Enterprise AI fraud prevention, sovereign GPU infrastructure, and autonomous agents —{" "}
            <span className="text-enterprise-primary italic">
              deployed on-premises in Nairobi
            </span>{" "}
            with a 48-hour production SLA.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {supportingBadges.map((badge, i) => (
              <motion.div
                key={badge}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-2"
              >
                <div className="grid h-5 w-5 place-items-center rounded-full bg-enterprise-primary/15">
                  <Check className="h-3 w-3 text-enterprise-primary" />
                </div>
                <span className="text-sm font-mono text-enterprise-fg-muted">{badge}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}