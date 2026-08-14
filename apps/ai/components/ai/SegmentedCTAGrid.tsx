"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Building2,
  Terminal,
  Cpu,
  Lock,
} from "lucide-react";
import { fadeInUp, staggerFast, viewportOnce } from "./animations";

type SegmentId = "developer" | "buyer" | "evaluator" | "partner";

type Segment = {
  id: SegmentId;
  title: string;
  badge: string;
  tagline: string;
  desc: string;
  actionText: string;
  href: string;
  Icon: typeof Code2;
  perks: string[];
};

const SEGMENTS: Segment[] = [
  {
    id: "developer",
    title: "Developer",
    badge: "API & SDK Sandbox",
    tagline: "Ship fraud protection in 5 minutes with robust SDKs",
    desc: "Instant access to Xobriq Guard and Cloud APIs. Includes open API specs, Python/TypeScript SDKs, and 5,000 free sandbox requests.",
    actionText: "Get Free API Keys",
    href: "/register",
    Icon: Code2,
    perks: [
      "Sub-200ms REST & gRPC endpoints",
      "TypeScript & Python SDKs available",
      "5,000 free monthly sandbox requests",
    ],
  },
  {
    id: "buyer",
    title: "Buyer",
    badge: "Enterprise Security & ROI",
    tagline: "Quantifiable risk reduction with enterprise SLA guarantees",
    desc: "Schedule a 30-minute executive briefing with our principal AI engineers. Review SOC-2 compliance, data residency, and custom SLA terms.",
    actionText: "Schedule Executive Briefing",
    href: "/contact?type=demo_request",
    Icon: Calendar,
    perks: [
      "Dedicated East Africa cluster deployment",
      "SOC-2 Type II & ISO27001 compliant",
      "Guaranteed 99.9% uptime SLA",
    ],
  },
  {
    id: "evaluator",
    title: "Evaluator",
    badge: "Benchmarks & Proof",
    tagline: "Test Xobriq models against legacy rule engines",
    desc: "Run shadow-mode evaluations on your real transaction data. Compare false positive rates and risk detection lift in real time.",
    actionText: "Request Shadow Pilot",
    href: "/contact?type=discovery_call",
    Icon: TrendingUp,
    perks: [
      "Zero disruption to existing tech stack",
      "Real-time accuracy comparison report",
      "70% typical fraud loss recovery",
    ],
  },
  {
    id: "partner",
    title: "Partner",
    badge: "Alliance & Co-Selling",
    tagline: "Integrate Xobriq AI into your banking or telco stack",
    desc: "Co-selling, reseller programs, and deep technological alliances for regional banks, mobile money operators, and system integrators.",
    actionText: "Explore Alliance Program",
    href: "/contact?type=partnership",
    Icon: Users,
    perks: [
      "Co-branded customer portals",
      "Revenue sharing & reseller margins",
      "Dedicated solution architect support",
    ],
  },
];

function HangingLightString({ position = "left" }: { position: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
        delay: position === "left" ? 0.1 : 0.25,
      }}
      className={`pointer-events-none absolute -top-16 ${
        position === "left" ? "left-4 sm:left-12 lg:left-20" : "right-4 sm:right-12 lg:right-20"
      } z-10 flex flex-col items-center`}
    >
      {/* Wire extending down from section seam above */}
      <div className="w-[2px] h-20 bg-gradient-to-b from-blue-500 via-sky-400 to-blue-600/40 dark:from-sky-300 dark:via-blue-400 dark:to-sky-500/40 shadow-sm" />

      {/* Hanging Light Bulb Assembly with gentle floating/glowing animation */}
      <motion.div
        animate={{ y: [0, 6, 0], rotate: [0, position === "left" ? 3 : -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative -mt-0.5 flex flex-col items-center"
      >
        {/* Bulb Socket Cap */}
        <div className="h-3.5 w-3 rounded-t-sm bg-slate-700 dark:bg-slate-800 border border-slate-600" />

        {/* Bulb Glass Body & Glowing Aura */}
        <div className="relative -mt-0.5 grid place-items-center">
          {/* Radial Light Glow backdrop */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-sky-400/50 dark:bg-sky-400/60 blur-lg"
          />

          <svg
            width="32"
            height="40"
            viewBox="0 0 28 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 drop-shadow-[0_0_14px_rgba(56,189,248,0.85)]"
          >
            {/* Bulb Glass outline */}
            <path
              d="M14 2C7.37 2 2 7.37 2 14C2 18.5 4.5 22.4 8.2 24.4L9.5 29H18.5L19.8 24.4C23.5 22.4 26 18.5 26 14C26 7.37 20.63 2 14 2Z"
              className="fill-blue-100/95 dark:fill-sky-900/90 stroke-blue-600 dark:stroke-sky-300"
              strokeWidth="1.8"
            />
            {/* Filament */}
            <path
              d="M10 29V32H18V29M12 18L14 12L16 18M11 16H17"
              className="stroke-amber-400 dark:stroke-amber-300"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SegmentedCTAGrid() {
  const [activeTab, setActiveTab] = useState<SegmentId>("developer");
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-rotate tabs every 3s; pause for 5s on user manual click
  useEffect(() => {
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
      }, 5000);
      return () => clearTimeout(pauseTimer);
    }

    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = SEGMENTS.findIndex((s) => s.id === prev);
        const nextIndex = (currentIndex + 1) % SEGMENTS.length;
        return SEGMENTS[nextIndex].id;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTabClick = (id: SegmentId) => {
    setActiveTab(id);
    setIsPaused(true);
  };

  const activeSegment = SEGMENTS.find((s) => s.id === activeTab) || SEGMENTS[0];

  const handleCopy = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="relative z-10 overflow-visible py-16 sm:py-24 lg:py-28 bg-[#D8E8FF] dark:bg-[#0A1633] text-slate-900 dark:text-white border-y border-blue-200/80 dark:border-blue-800/50 transition-colors duration-300">
      {/* Decorative Hanging Light Strings with Drop-Down Entrance Animation */}
      <HangingLightString position="left" />
      <HangingLightString position="right" />

      {/* Light Blue Soft Radial Ambient Backlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-300/60 via-sky-200/40 to-transparent dark:from-blue-700/40 dark:via-blue-900/30 dark:to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerFast}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-sky-400 sm:text-sm"
          >
            CHOOSE YOUR PATH
          </motion.p>

          <motion.h2
            variants={fadeInUp}
            className="mt-2.5 sm:mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-slate-900 dark:text-white sm:text-5xl"
          >
            Built for your exact{" "}
            <span className="text-blue-600 dark:text-sky-400 italic">role.</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed"
          >
            Whether you&apos;re an engineer building APIs, an executive scoping ROI, or a partner exploring integration, select your path below.
          </motion.p>
        </motion.div>

        {/* Audience Segment Switcher Pills — Segmented Track with Spring Sliding Pill */}
        <div className="mt-6 sm:mt-10 flex items-center justify-center">
          <div className="inline-flex flex-nowrap items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-white/70 dark:bg-slate-900/80 border border-blue-200/60 dark:border-blue-900/40 shadow-sm max-w-full overflow-x-auto no-scrollbar">
            {SEGMENTS.map((seg) => {
              const Icon = seg.Icon;
              const isActive = activeTab === seg.id;
              return (
                <button
                  key={seg.id}
                  onClick={() => handleTabClick(seg.id)}
                  className={`relative inline-flex items-center gap-1 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold transition-colors duration-200 shrink-0 border-0 outline-none select-none ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAudienceTab"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-md shadow-blue-500/25"
                      transition={{ type: "spring", stiffness: 480, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? "text-white" : "text-blue-600 dark:text-sky-400"}`} />
                    <span>{seg.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Showcase Deck (Main Hero Interactive Card) */}
        <div className="mt-8 sm:mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-3xl border border-blue-200/90 dark:border-blue-900/50 bg-white/90 dark:bg-[#0B1224]/90 shadow-xl dark:shadow-2xl backdrop-blur-md grid lg:grid-cols-12 gap-0 min-h-[690px] sm:min-h-[580px] lg:min-h-[480px]"
            >
              {/* Left Column: Context & Action */}
              <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-blue-100 dark:border-blue-900/40">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/60 dark:border-sky-500/30 bg-blue-50 dark:bg-sky-500/10 px-3 py-1 text-xs font-mono font-medium text-blue-700 dark:text-sky-300">
                    <activeSegment.Icon className="h-3.5 w-3.5" />
                    <span>{activeSegment.badge}</span>
                  </div>

                  <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    {activeSegment.tagline}
                  </h3>

                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {activeSegment.desc}
                  </p>

                  {/* Bullet perks */}
                  <ul className="mt-5 space-y-2.5">
                    {activeSegment.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-sky-400" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary CTA Button */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-blue-900/30">
                  <Link
                    href={activeSegment.href}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-6 py-3 shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.01]"
                  >
                    <span>{activeSegment.actionText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Interactive Feature Preview */}
              <div className="lg:col-span-6 bg-slate-950 p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden">
                {/* Background Tech Mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                {activeTab === "developer" && (
                  <div className="relative z-10">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5 text-sky-400" />
                        <span>POST /v1/guard/analyze</span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>

                    <pre className="mt-3 font-mono text-[11px] sm:text-xs text-slate-200 leading-relaxed overflow-x-auto p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                      <code>{`curl -X POST https://api.xobriq.ai/v1/guard/analyze \\
  -H "Authorization: Bearer xob_live_8f3a..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4200.00,
    "currency": "KES",
    "device_fingerprint": "dev_9941a8",
    "account_id": "acc_884210"
  }'`}</code>
                    </pre>

                    <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        200 OK — Risk Score: 0.02 (Safe)
                      </span>
                      <span className="text-slate-400 text-[10px]">182ms</span>
                    </div>
                  </div>
                )}

                {activeTab === "buyer" && (
                  <div className="relative z-10 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="h-5 w-5 text-blue-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">SOC-2 Type II & ISO27001</p>
                            <p className="text-[10px] text-slate-400">Audited enterprise risk architecture</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-5 w-5 text-emerald-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">East Africa Sovereign Cloud</p>
                            <p className="text-[10px] text-slate-400">Strict local data residency & sovereignty</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                          Nairobi Cluster
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Zap className="h-5 w-5 text-amber-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">Enterprise SLA Guarantee</p>
                            <p className="text-[10px] text-slate-400">Financial uptime commitment</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-300">
                          99.9% Uptime
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "evaluator" && (
                  <div className="relative z-10 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
                        <span>Latency Benchmark</span>
                        <span className="font-mono text-sky-400">86% Faster</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Xobriq Guard AI</span>
                            <span className="text-emerald-400 font-mono">185ms</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[18%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Legacy Rule Engine</span>
                            <span className="text-red-400 font-mono">1,450ms</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-red-500/70 w-[95%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Cpu className="h-5 w-5 text-sky-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">Fraud Recovery Rate</p>
                          <p className="text-[10px] text-slate-400">Verified pilot lift</p>
                        </div>
                      </div>
                      <span className="text-base font-bold font-mono text-sky-400">+70%</span>
                    </div>
                  </div>
                )}

                {activeTab === "partner" && (
                  <div className="relative z-10 space-y-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                      Integration Ecosystem
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <Building2 className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">Core Banking</p>
                        <p className="text-[10px] text-slate-400">ISO 20022 APIs</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <Zap className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">Mobile Money</p>
                        <p className="text-[10px] text-slate-400">Instant Settlement</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <Lock className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">Fintech Rails</p>
                        <p className="text-[10px] text-slate-400">KYC & Sanctions</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <Users className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-white">Co-Selling</p>
                        <p className="text-[10px] text-slate-400">Reseller Portals</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}