"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CTAProps {
  badge?: {
    text: string;
  };
  title: string;
  description?: string;
  action: {
    text: string;
    href: string;
    variant?: "default" | "glow";
  };
  withGlow?: boolean;
  className?: string;
}

export function CTASection({
  badge,
  title,
  description,
  action,
  withGlow = true,
  className,
}: CTAProps) {
  return (
    <section className={cn("overflow-hidden py-12 md:py-20 bg-transparent text-slate-900 dark:text-white relative z-10", className)}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto flex max-w-container flex-col items-center gap-6 px-8 py-14 text-center sm:gap-8 md:py-24 border border-blue-500/30 dark:border-blue-500/40 rounded-xl bg-[#070E22] dark:bg-[#070E22] text-white backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Luminous Top Edge Highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />

        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge
              variant="outline"
              className="border-blue-400/40 bg-blue-500/10 text-sky-300 px-3.5 py-1 text-xs font-mono font-semibold tracking-wider uppercase rounded-md"
            >
              <span>{badge.text}</span>
            </Badge>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold sm:text-5xl tracking-tight text-white max-w-3xl leading-[1.15]"
        >
          {title}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-slate-300 max-w-2xl text-base sm:text-lg leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 w-full sm:w-auto"
        >
          <Button
            variant={action.variant || "default"}
            size="lg"
            className="w-full sm:w-auto rounded-lg px-8 py-6 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/40 hover:scale-[1.02] transition-all"
            asChild
          >
            <Link href={action.href}>{action.text}</Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-lg px-8 py-6 text-base font-semibold border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white transition-all"
            asChild
          >
            <Link href="/contact">Talk to Sales</Link>
          </Button>
        </motion.div>

        {/* Glow Effect Rectangle Frame */}
        {withGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pointer-events-none absolute inset-0 rounded-xl border border-blue-500/40 shadow-[0_0_120px_10px_rgba(59,130,246,0.35)]"
          />
        )}
      </motion.div>
    </section>
  );
}
