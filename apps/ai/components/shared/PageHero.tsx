"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2, Shield, Sparkles, Cloud, Bot, GitBranch,
  ShieldCheck, ShieldAlert, Newspaper, BarChart3, Code2, FileText,
  Users, Zap, Rocket, Compass, BookOpen, Layers, Cpu, Globe,
  Briefcase, Award, Mail, Phone,
  type LucideProps,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  Building2, Shield, Sparkles, Cloud, Bot, GitBranch,
  ShieldCheck, ShieldAlert, Newspaper, BarChart3, Code2, FileText,
  Users, Zap, Rocket, Compass, BookOpen, Layers, Cpu, Globe,
  Briefcase, Award, Mail, Phone,
};

export type PageHeroCTA = {
  label: string;
  href: string;
  variant?: "primary" | "outline";
};

export type PageHeroProps = {
  title: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  iconName?: string;
  accent?: "blue" | "teal" | "purple" | "gold" | "red";
  ctas?: PageHeroCTA[];
};

const accentClasses: Record<NonNullable<PageHeroProps["accent"]>, string> = {
  blue: "text-enterprise-primary",
  teal: "text-xteal-500",
  purple: "text-xpurple-500",
  gold: "text-xgold-600",
  red: "text-xred-500",
};

export function PageHero(props: PageHeroProps) {
  const title = props.title;
  const subtitle = props.subtitle;
  const eyebrow = props.eyebrow;
  const iconName = props.iconName;
  const accent = props.accent || "blue";
  const ctas = props.ctas || [];

  const accentClass = accentClasses[accent];
  const Icon = iconName ? ICON_MAP[iconName] : null;

  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 lg:py-28">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-enterprise-primary/12 blur-[140px]" />

      <div className="relative mx-auto max-w-4xl text-center">
        {Icon ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={"mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-enterprise-primary/10 " + accentClass}
          >
            <Icon className="h-7 w-7" />
          </motion.div>
        ) : null}

        {eyebrow ? (
          <p className={"label-caps-thin mb-3 " + accentClass}>{eyebrow}</p>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>

        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-7 text-enterprise-fg-muted sm:text-lg"
          >
            {subtitle}
          </motion.p>
        ) : null}

        {ctas.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            {ctas.map((cta) => {
              const cls = cta.variant === "outline"
                ? "inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-6 py-3 text-sm font-semibold hover:border-enterprise-border-strong"
                : "glow-hover inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover";
              const key = cta.href + "-" + cta.label;
              return (
                <Link key={key} href={cta.href} className={cls}>
                  <span>{cta.label}</span>
                  {cta.variant === "outline" ? null : <ArrowRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}