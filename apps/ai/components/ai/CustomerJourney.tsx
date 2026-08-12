"use client";

import { motion } from "framer-motion";
import { Search, Database, Code2 } from "lucide-react";

const CONNECTOR_CAPTION = "Understanding Your Needs";

export function CustomerJourney() {
  return (
    <section className="bg-enterprise-bg py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl text-center mx-auto"
        >
          <p className="label-caps-thin inline-flex items-center gap-2 text-enterprise-accent">
            <span className="status-dot" />
            How It Works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            The AI Transformation Journey
          </h2>
          <p className="mt-4 text-enterprise-fg-muted">
            We begin with a detailed consultation to learn about your business challenges, goals,
            and opportunities for AI integration.
          </p>
        </motion.div>

        {/* Desktop: card — connector — spotlight — connector — card */}
        <div className="hidden lg:flex items-center justify-center gap-4 xl:gap-6">
          <JourneyCard
            icon={Search}
            title="Discovery & Consultation"
            delay={0}
          />
          <Connector delay={0.1} />
          <JourneySpotlight
            icon={Database}
            title="Data & Feasibility"
            description="Our experts analyze your data, workflows, and technology stack."
            delay={0.2}
          />
          <Connector delay={0.3} />
          <JourneyCard
            icon={Code2}
            title="Development & Integration"
            delay={0.4}
          />
        </div>

        {/* Mobile: vertical stack */}
        <div className="lg:hidden space-y-6">
          <JourneyCard icon={Search} title="Discovery & Consultation" delay={0} stacked />
          <MobileConnector />
          <JourneySpotlight
            icon={Database}
            title="Data & Feasibility"
            description="Our experts analyze your data, workflows, and technology stack."
            delay={0.1}
            stacked
          />
          <MobileConnector />
          <JourneyCard icon={Code2} title="Development & Integration" delay={0.2} stacked />
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  icon: Icon,
  title,
  delay,
  stacked,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  delay: number;
  stacked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className={
        "flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-enterprise-primary/10 via-enterprise-primary/5 to-enterprise-accent/10 p-8 text-center transition " +
        (stacked ? "w-full" : "h-56 w-56 shrink-0 xl:h-64 xl:w-64")
      }
    >
      <div className="grid h-16 w-16 place-items-center rounded-full border border-enterprise-primary/20 bg-enterprise-bg">
        <Icon className="h-7 w-7 text-enterprise-primary" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-enterprise-fg">{title}</h3>
    </motion.div>
  );
}

function JourneySpotlight({
  icon: Icon,
  title,
  description,
  delay,
  stacked,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
  stacked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      className={
        "flex flex-col items-center rounded-2xl border-2 border-dashed border-enterprise-primary/30 p-6 " +
        (stacked ? "w-full" : "w-64 shrink-0 xl:w-72")
      }
    >
      <div className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-enterprise-primary/15 to-enterprise-accent/25 xl:h-36 xl:w-36">
        <Icon className="h-9 w-9 text-enterprise-primary" />
      </div>

      <h3 className="relative z-10 -mt-4 rounded-full bg-enterprise-bg px-3 py-1 text-center text-base font-semibold text-enterprise-fg">
        {title}
      </h3>

      <div className="-mt-4 grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-enterprise-primary to-enterprise-accent p-6 text-center xl:h-44 xl:w-44">
        <p className="text-xs font-medium leading-relaxed text-white">{description}</p>
      </div>
    </motion.div>
  );
}

function Connector({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay }}
      className="flex w-14 shrink-0 flex-col items-center gap-2 xl:w-20"
    >
      <div className="h-px w-full border-t-2 border-dotted border-enterprise-primary/40" />
      <p className="text-center text-[10px] leading-tight text-enterprise-fg-subtle">
        {CONNECTOR_CAPTION}
      </p>
    </motion.div>
  );
}

function MobileConnector() {
  return (
    <div className="flex items-center gap-3 pl-8">
      <div className="h-6 w-px border-l-2 border-dotted border-enterprise-primary/40" />
      <p className="text-[10px] text-enterprise-fg-subtle">{CONNECTOR_CAPTION}</p>
    </div>
  );
}
