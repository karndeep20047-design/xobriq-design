"use client";

// A scripted, looping "product in action" demo for the /kyc marketing page:
// signs in once on mount, then loops forever through submit -> checking
// against IPRS -> match confirmed, bumping the stat cards each pass. Purely
// a client-side animation (setTimeout state machine + framer-motion) — no
// real backend calls, this is a marketing mockup, not the live dashboard.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IdCard, Database, Loader2, CheckCircle2 } from "lucide-react";

type Phase = "submitting" | "checking" | "matched";

const PHASE_ORDER: Phase[] = ["submitting", "checking", "matched"];
const PHASE_DURATION: Record<Phase, number> = {
  submitting: 1400,
  checking: 1800,
  matched: 2400,
};
const LOGIN_DURATION = 1300;

const DEMO_IDS = ["3xxxxxx812", "2xxxxxx947", "3xxxxxx205", "1xxxxxx663"];

export function KycDashboardDemo() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoggedIn(true), LOGIN_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="glass-panel glow-hover relative overflow-hidden rounded-3xl shadow-[0_24px_60px_-15px_rgba(59,130,246,0.12)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 border-b border-enterprise-border bg-enterprise-bg-lower px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-enterprise-fg-subtle/40" />
        </div>
        <span className="ml-1 font-mono text-xs text-enterprise-fg-muted">app.xobriq.ai/dashboard/xobriqKYC</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold text-xgreen-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xgreen-500/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-xgreen-500" />
          </span>
          LIVE
        </span>
      </div>

      <div className="relative min-h-[280px] p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {!loggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <Loader2 className="h-6 w-6 animate-spin text-enterprise-primary" />
              <p className="text-sm text-enterprise-fg-muted">Signing in to Xobriq KYC&hellip;</p>
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <DashboardBody />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DashboardBody() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [totals, setTotals] = useState({ total: 128, approved: 112 });

  const phase = PHASE_ORDER[phaseIndex];

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phase === "matched") {
        setTotals((t) => ({ total: t.total + 1, approved: t.approved + 1 }));
        setRound((r) => r + 1);
        setPhaseIndex(0);
      } else {
        setPhaseIndex((i) => i + 1);
      }
    }, PHASE_DURATION[phase]);
    return () => clearTimeout(timeout);
  }, [phase]);

  const currentId = DEMO_IDS[round % DEMO_IDS.length];

  return (
    <div>
      <p className="text-sm text-enterprise-fg-muted">
        Karibu, Demo <span aria-hidden>👋</span>
      </p>
      <h3 className="mt-1 text-xl font-semibold">Here&apos;s what&apos;s happening with your verifications.</h3>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={totals.total} tone="primary" />
        <StatCard label="Approved" value={totals.approved} tone="green" />
        <StatCard label="Pending" value={1} tone="amber" />
        <StatCard label="Fraud Alerts" value={2} tone="red" />
      </div>

      <div className="relative mt-6 h-[96px] sm:h-[76px] overflow-hidden rounded-2xl border border-enterprise-border bg-enterprise-bg-lower px-5 flex items-center">
        <div className="w-full">
          <AnimatePresence mode="wait">
          {phase === "submitting" ? (
            <motion.div key="submitting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-enterprise-primary/10">
                <IdCard className="h-4 w-4 text-enterprise-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">New verification submitted</p>
                <p className="text-xs text-enterprise-fg-muted">National ID &middot; {currentId}</p>
              </div>
            </motion.div>
          ) : phase === "checking" ? (
            <motion.div key="checking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-xgreen-500/10">
                <Database className="h-4 w-4 animate-pulse text-xgreen-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Checking against IPRS&hellip;</p>
                <p className="text-xs text-enterprise-fg-muted">National ID &middot; {currentId}</p>
              </div>
              <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-enterprise-fg-subtle" />
            </motion.div>
          ) : (
            <motion.div key="matched" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-xgreen-500">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-xgreen-500">IPRS match confirmed &mdash; Approved</p>
                <p className="text-xs text-enterprise-fg-muted">National ID &middot; {currentId}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}

function StatCard({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "green" | "amber" | "red";
}) {
  const toneStyles = {
    primary: "border-t-2 border-t-blue-500 bg-blue-50/20 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 border-x border-b border-enterprise-border/50",
    green: "border-t-2 border-t-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-x border-b border-enterprise-border/50",
    amber: "border-t-2 border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400 border-x border-b border-enterprise-border/50",
    red: "border-t-2 border-t-red-500 bg-red-50/20 dark:bg-red-950/10 text-red-600 dark:text-red-400 border-x border-b border-enterprise-border/50",
  };

  const styleClass = toneStyles[tone];

  return (
    <div className={`rounded-xl p-4 transition-all duration-300 hover:scale-[1.03] ${styleClass}`}>
      <p className="label-caps-thin text-slate-500 dark:text-slate-400 font-semibold">{label}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="mt-1 text-2xl font-bold font-sans"
      >
        {value}
      </motion.p>
    </div>
  );
}
