"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, Calendar, TrendingUp, Users, ArrowRight } from "lucide-react";

const segments = [
  {
    title: "Developer",
    subtitle: "Get API access",
    desc: "Sandbox access to Guard and Cloud APIs. Full docs, code samples, and 5,000 free test requests.",
    action: "Get API Key",
    href: "/register",
    Icon: Code2,
    accent: "primary" as const,
  },
  {
    title: "Buyer",
    subtitle: "Book a demo",
    desc: "30-minute call with our fraud engineering team. See Guard analyze your fraud scenarios live.",
    action: "Book Demo",
    href: "/contact?type=demo_request",
    Icon: Calendar,
    accent: "primary" as const,
  },
  {
    title: "Evaluator",
    subtitle: "Calculate ROI",
    desc: "Validate the business case with detailed ROI analysis. Custom projections for your volume.",
    action: "Book Assessment",
    href: "/contact?type=discovery_call",
    Icon: TrendingUp,
    accent: "accent" as const,
  },
  {
    title: "Partner",
    subtitle: "Explore partnership",
    desc: "Integration partnerships, co-selling, and technology alliances with East African banks and fintechs.",
    action: "Talk Partnership",
    href: "/contact?type=partnership",
    Icon: Users,
    accent: "accent" as const,
  },
];

export function SegmentedCTAGrid() {
  return (
    <section className="bg-enterprise-bg py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-3xl text-center mx-auto"
        >
          <p className="label-caps-thin text-enterprise-accent">Choose Your Path</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Different visitors,{" "}
            <span className="text-enterprise-primary italic">different next steps.</span>
          </h2>
          <p className="mt-4 text-enterprise-fg-muted">
            Whether you&apos;re a developer wanting to test the API, a buyer scoping engagement, or a
            partner exploring integration — pick your path.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((seg, i) => {
            const Icon = seg.Icon;
            const accentText =
              seg.accent === "primary" ? "text-enterprise-primary" : "text-enterprise-accent";
            const accentBg =
              seg.accent === "primary" ? "bg-enterprise-primary/10" : "bg-enterprise-accent/10";
            const accentBorder =
              seg.accent === "primary" ? "border-enterprise-primary/30" : "border-enterprise-accent/30";

            return (
              <motion.div
                key={seg.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <Link
                  href={seg.href}
                  className={
                    "glass-panel rounded-2xl p-6 h-full flex flex-col transition-all duration-500 border " +
                    accentBorder +
                    " hover:shadow-[0_0_40px_rgba(26,60,94,0.15)]"
                  }
                >
                  <div className="flex items-start justify-between mb-6">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      className={
                        "h-12 w-12 rounded-xl grid place-items-center border " +
                        accentBg +
                        " " +
                        accentBorder
                      }
                    >
                      <Icon className={"h-6 w-6 " + accentText} />
                    </motion.div>
                    <span
                      className={
                        "opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all " +
                        accentText
                      }
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>

                  <p className={"label-caps-thin mb-2 " + accentText}>{seg.subtitle}</p>
                  <h3 className="text-xl font-semibold text-enterprise-fg mb-3">{seg.title}</h3>
                  <p className="text-sm text-enterprise-fg-muted leading-relaxed mb-6 flex-1">
                    {seg.desc}
                  </p>

                  <div className="pt-4 border-t border-enterprise-border/40">
                    <span
                      className={
                        "inline-flex items-center gap-2 text-sm font-mono font-bold group-hover:gap-3 transition-all " +
                        accentText
                      }
                    >
                      {seg.action}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}