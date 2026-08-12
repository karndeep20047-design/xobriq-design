"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Reveal } from "@/components/shared/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/shared/motion/Stagger";

export type PricingTier = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  features: string[];
  featured?: boolean;
  cta: { href: string; label: string };
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tiers: PricingTier[];
  accent?: "blue" | "gold" | "teal" | "purple" | "red";
};

const accentMap = {
  blue:   { text: "text-enterprise-primary", border: "border-enterprise-primary/60", bg: "bg-enterprise-primary/5" },
  gold:   { text: "text-xgold-600",   border: "border-xgold-600/60",   bg: "bg-xgold-600/5"   },
  teal:   { text: "text-xteal-500",   border: "border-xteal-500/60",   bg: "bg-xteal-500/5"   },
  purple: { text: "text-xpurple-500", border: "border-xpurple-500/60", bg: "bg-xpurple-500/5" },
  red:    { text: "text-xred-500",    border: "border-xred-500/60",    bg: "bg-xred-500/5"    },
};

// ────────────────────────────────────────────────────────────────────────────
//  CtaButton — extracted to keep the Link opening tag on ONE line
//  This avoids JSX truncation issues during copy-paste
// ────────────────────────────────────────────────────────────────────────────
function CtaButton(props: { href: string; label: string; featured: boolean }) {
  const base = "mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition";
  const styles = props.featured
    ? "glow-hover bg-enterprise-primary text-enterprise-on-primary hover:bg-enterprise-primary-hover"
    : "border border-border bg-bg-subtle text-fg hover:bg-bg-elevated";

  return (
    <Link href={props.href} className={base + " " + styles}>
      <span>{props.label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  TierCard — also extracted for clarity
// ────────────────────────────────────────────────────────────────────────────
function TierCard(props: {
  tier: PricingTier;
  accentText: string;
  accentBorder: string;
  accentBg: string;
}) {
  const { tier, accentText, accentBorder, accentBg } = props;

  const cardClasses =
    "flex h-full flex-col rounded-3xl border p-6 transition sm:p-8 " +
    (tier.featured
      ? accentBorder + " " + accentBg + " shadow-glow"
      : "border-border bg-bg");

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cardClasses}
    >
      {tier.featured ? (
        <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-xgold-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-xgold-600">
          <Sparkles className="h-3 w-3" />
          Most popular
        </div>
      ) : null}

      <h3 className="text-xl font-bold">{tier.name}</h3>
      <p className="mt-1 text-sm text-fg-muted">{tier.desc}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-3xl font-black sm:text-4xl">{tier.price}</span>
      </div>
      <span className="text-sm text-fg-subtle">{tier.unit}</span>

      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={"mt-0.5 h-4 w-4 shrink-0 " + accentText} />
            <span className="text-fg-muted">{feature}</span>
          </li>
        ))}
      </ul>

      <CtaButton
        href={tier.cta.href}
        label={tier.cta.label}
        featured={!!tier.featured}
      />
    </motion.article>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  Main exported component
// ────────────────────────────────────────────────────────────────────────────
export function PricingSection(props: Props) {
  const { eyebrow, title, subtitle, tiers, accent = "blue" } = props;
  const a = accentMap[accent];

  return (
    <section className="bg-bg-subtle px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mb-12 max-w-2xl">
            <p className={"text-sm font-semibold uppercase tracking-[0.25em] " + a.text}>
              {eyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h2>
            <p className="mt-4 text-fg-muted">{subtitle}</p>
          </div>
        </Reveal>

        <Stagger className="grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <StaggerItem key={tier.name}>
              <TierCard
                tier={tier}
                accentText={a.text}
                accentBorder={a.border}
                accentBg={a.bg}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}