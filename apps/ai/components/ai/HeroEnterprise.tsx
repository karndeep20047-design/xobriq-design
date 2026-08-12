"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Bot, Cloud } from "lucide-react";
import { fadeInUp, scaleIn, staggerContainer, viewportOnce } from "./animations";

export function HeroEnterprise() {
  return (
    <section className="relative overflow-hidden bg-enterprise-bg pt-20 text-enterprise-fg">
      <div className="tech-grid-light pointer-events-none absolute inset-0" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20"
      >
        <div>
          <motion.div
            variants={fadeInUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-enterprise-primary/25 bg-enterprise-primary/5 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="status-dot" />
            <span className="label-caps-thin text-enterprise-primary">
              AI-Powered · Real-Time Fraud Defense
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            Enterprise Intelligence at <span className="italic text-enterprise-accent">Scale</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-7 max-w-xl text-lg leading-8 text-enterprise-fg-muted"
          >
            Deploy AI-powered fraud detection, deepfake prevention, autonomous agents, sovereign GPU infrastructure, and managed cybersecurity — built for African and global enterprises.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-col items-start justify-start gap-4 sm:flex-row"
          >
            <Link href="/register" className="glow-hover w-full rounded-lg bg-enterprise-primary px-10 py-3.5 text-center text-sm font-bold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover sm:w-auto sm:text-base">
              Get Started
            </Link>
            <Link href="/contact?type=demo_request" className="w-full rounded-lg border border-enterprise-primary bg-transparent px-10 py-3.5 text-center text-sm font-bold text-enterprise-primary transition hover:bg-enterprise-primary/10 sm:w-auto sm:text-base">
              Book Demo
            </Link>
          </motion.div>
        </div>

        <motion.div variants={scaleIn} className="relative hidden lg:block">
          <HeroIllustration />
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-enterprise-primary/20 via-transparent to-enterprise-accent/20 blur-2xl" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border-2 border-dashed border-enterprise-primary/20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 rounded-full border border-enterprise-accent/20"
      />

      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="glass-panel grid h-32 w-32 place-items-center rounded-3xl"
        >
          <ShieldCheck className="h-14 w-14 text-enterprise-primary" />
        </motion.div>
      </div>

      <FloatingIcon Icon={Bot} className="left-[8%] top-[20%]" delay={0} accent="primary" />
      <FloatingIcon Icon={Cloud} className="right-[10%] top-[28%]" delay={0.5} accent="accent" />
      <FloatingIcon Icon={ShieldCheck} className="left-[14%] bottom-[18%]" delay={1} accent="accent" />
      <FloatingIcon Icon={Bot} className="right-[8%] bottom-[12%]" delay={1.5} accent="primary" />
    </div>
  );
}

type FloatingIconProps = {
  Icon: React.ComponentType<{ className?: string }>;
  className: string;
  delay: number;
  accent: "primary" | "accent";
};

function FloatingIcon({ Icon, className, delay, accent }: FloatingIconProps) {
  const color = accent === "primary" ? "text-enterprise-primary" : "text-enterprise-accent";
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
      className={"glass-panel absolute grid h-14 w-14 place-items-center rounded-xl " + className}
    >
      <Icon className={"h-6 w-6 " + color} />
    </motion.div>
  );
}
