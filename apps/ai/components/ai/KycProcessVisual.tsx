"use client";

// The centerpiece visual for the /kyc marketing page: a looping "capture a
// document with your phone" mockup. Built as a JS phase machine (same
// convention as KycDashboardDemo's login->submit->checking->matched loop)
// rather than one giant declarative keyframe timeline — the story has too
// many distinct beats (phone arrives, ID slides into frame and settles,
// shutter fires, capture zooms into a full scan, fields extract, verified)
// to reason about as fractions of a single cycle.
//
// Sequence: phone mockup animates in -> a generic ID card slides into the
// on-screen viewfinder and settles (a little "adjusting to fit" wiggle,
// guide corners going green once aligned) -> shutter button fires (flash) ->
// the phone view exits and a large scan card zooms in from that same
// position -> a scan line sweeps it while four fields resolve into a
// structured "Extracted & matched" panel -> a "Verified against IPRS"
// banner holds -> everything resets and loops.
//
// useReducedMotion swaps the whole thing for a static end state (fields
// already extracted, verified banner shown, no phone) instead of turning
// animation off mid-sequence.

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  User,
  CreditCard,
  CalendarDays,
  Database,
  CheckCircle2,
  ScanLine,
  type LucideIcon,
} from "lucide-react";

type Field = { label: string; value: string; Icon: LucideIcon };

const FIELDS: Field[] = [
  { label: "Full Name", value: "JOHN K. MWANGI", Icon: User },
  { label: "ID Number", value: "29184023", Icon: CreditCard },
  { label: "Date of Birth", value: "14 Apr 1990", Icon: CalendarDays },
  { label: "IPRS Match", value: "Confirmed", Icon: Database },
];

// Seconds after the scan card mounts that each field resolves, and how long
// the scan line takes to sweep to match.
const FIELD_DELAYS = [0.55, 1.0, 1.45, 1.9];
const SCAN_DURATION = 2.15;
const VERIFIED_DELAY = FIELD_DELAYS[FIELD_DELAYS.length - 1] + 0.45;

type Phase = "phoneIn" | "align" | "capture" | "scan" | "hold";

const PHASE_ORDER: Phase[] = ["phoneIn", "align", "capture", "scan", "hold"];
const PHASE_DURATION_MS: Record<Phase, number> = {
  phoneIn: 650,
  align: 1500,
  capture: 400,
  scan: (VERIFIED_DELAY + 0.5) * 1000,
  hold: 2000,
};

export function KycProcessVisual() {
  const reduceMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(0);
  const phase = PHASE_ORDER[phaseIndex];

  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => {
      if (phase === "hold") {
        setRound((r) => r + 1);
        setPhaseIndex(0);
      } else {
        setPhaseIndex((i) => i + 1);
      }
    }, PHASE_DURATION_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, reduceMotion]);

  const showPhone = phase === "phoneIn" || phase === "align" || phase === "capture";

  return (
    <div className="glass-panel glow-hover relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative flex items-center gap-2 pb-5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-xgreen-500/10">
          <ScanLine className="h-4 w-4 text-xgreen-500" />
        </span>
        <p className="text-sm font-semibold text-enterprise-fg">Live document scan</p>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold text-xgreen-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xgreen-500/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-xgreen-500" />
          </span>
          DEMO
        </span>
      </div>

      {reduceMotion ? (
        <StaticResult />
      ) : (
        <div className="relative min-h-[360px]">
          <AnimatePresence mode="wait">
            {showPhone ? (
              <motion.div key={`phone-${round}`} className="flex justify-center py-4">
                <PhoneMockup phase={phase} />
              </motion.div>
            ) : (
              <ScanResult key={`scan-${round}`} />
            )}
          </AnimatePresence>
        </div>
      )}

      <p className="relative mt-4 text-center text-[11px] text-enterprise-fg-subtle/70">
        Sample document for illustration &mdash; not real applicant data.
      </p>
    </div>
  );
}

function PhoneMockup({ phase }: { phase: Phase }) {
  const aligned = phase === "capture";

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-[172px] sm:w-[188px]"
    >
      <div className="relative aspect-[9/19] rounded-[2.1rem] border-[6px] border-enterprise-fg bg-enterprise-fg p-1 shadow-2xl">
        <div className="absolute left-1/2 top-2 z-20 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black" />

        <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-[#0b1220]">
          {/* Viewfinder guide + the ID sliding in and settling. */}
          <div className="absolute inset-x-4 top-9 bottom-14">
            <ViewfinderCorners aligned={aligned} />
            <motion.div
              className="absolute inset-x-1 top-2"
              initial={{ y: 70, opacity: 0, rotate: -5 }}
              animate={
                phase === "align" || phase === "capture"
                  ? { y: [70, 0, 0, -3, 2, 0], opacity: [0, 1, 1, 1, 1, 1], rotate: [-5, -2, -2, 1, -1, 0] }
                  : { y: 70, opacity: 0, rotate: -5 }
              }
              transition={
                phase === "align"
                  ? { duration: 1.3, times: [0, 0.28, 0.55, 0.72, 0.86, 1], ease: "easeOut" }
                  : { duration: 0.01 }
              }
            >
              <MiniIdCard />
            </motion.div>
          </div>

          {/* Shutter flash. */}
          {phase === "capture" && (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.4, times: [0, 0.45, 1] }}
            />
          )}

          {/* Shutter button. */}
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center">
            <motion.div
              animate={phase === "capture" ? { scale: [1, 0.78, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/60"
            >
              <span className="h-5 w-5 rounded-full bg-white" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ViewfinderCorners({ aligned }: { aligned: boolean }) {
  const base = "absolute h-3.5 w-3.5 border-[1.5px] transition-colors duration-300";
  const tone = aligned ? "border-xgreen-500" : "border-white/50";
  return (
    <>
      <span className={base + " left-0 top-0 border-l border-t rounded-tl-sm " + tone} />
      <span className={base + " right-0 top-0 border-r border-t rounded-tr-sm " + tone} />
      <span className={base + " bottom-0 left-0 border-b border-l rounded-bl-sm " + tone} />
      <span className={base + " bottom-0 right-0 border-b border-r rounded-br-sm " + tone} />
    </>
  );
}

// Small skeleton card standing in for a physical ID at phone-screen scale —
// no real text at this size, just the shape of one.
function MiniIdCard() {
  return (
    <div className="flex gap-1.5 rounded-md bg-white/95 p-1.5 shadow-lg">
      <div className="h-8 w-6 shrink-0 rounded-sm bg-slate-300" />
      <div className="flex flex-1 flex-col justify-center gap-1">
        <span className="h-1 w-full rounded-full bg-slate-300" />
        <span className="h-1 w-4/5 rounded-full bg-slate-200" />
        <span className="h-1 w-3/5 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

// The zoomed-in scan: card on the left resolving field by field, a
// structured "Extracted & matched" panel on the right, then the verified
// banner. Mounts fresh each loop (keyed by round in the parent) so every
// transition here is a simple one-shot initial->animate with a delay, no
// keyframe-fraction math needed.
function ScanResult() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: -30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: "top center" }}
    >
      <div className="grid gap-6 sm:grid-cols-[1.15fr_1fr] sm:items-center">
        <div className="relative mx-auto aspect-[8/5] w-full max-w-sm">
          <div className="relative flex h-full gap-4 overflow-hidden rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
            <div className="grid h-full w-14 shrink-0 place-items-center rounded-lg border border-enterprise-border bg-enterprise-bg-low sm:w-16">
              <User className="h-6 w-6 text-enterprise-fg-subtle" />
            </div>
            <div className="flex flex-1 flex-col justify-between py-0.5">
              {FIELDS.map((f, i) => (
                <div key={f.label} className="relative">
                  <p className="label-caps-thin text-enterprise-fg-subtle/70">{f.label}</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: FIELD_DELAYS[i] }}
                    className="text-sm font-semibold tabular-nums text-enterprise-fg"
                  >
                    {f.value}
                  </motion.p>
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-1.5 -inset-y-0.5 rounded-md border border-xgreen-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.9, 0] }}
                    transition={{ duration: 0.5, delay: FIELD_DELAYS[i], times: [0, 0.2, 1] }}
                  />
                </div>
              ))}
            </div>
          </div>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 h-[3px] rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #22c55e 20%, #86efac 50%, #22c55e 80%, transparent)",
              boxShadow: "0 0 18px 2px rgba(34,197,94,0.55)",
            }}
            initial={{ top: "4%", opacity: 0 }}
            animate={{ top: ["4%", "92%"], opacity: [1, 0] }}
            transition={{ duration: SCAN_DURATION, delay: 0.1, ease: "linear" }}
          />
        </div>

        <div className="space-y-2.5">
          <p className="label-caps-thin text-enterprise-fg-subtle">Extracted &amp; matched</p>
          {FIELDS.map((f, i) => {
            const Icon = f.Icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: FIELD_DELAYS[i], ease: "easeOut" }}
                className="flex items-center gap-3 rounded-lg border border-enterprise-border bg-enterprise-bg-lower px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-xgreen-500" />
                <span className="text-xs font-medium text-enterprise-fg-muted">{f.label}</span>
                <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-xgreen-500" />
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: VERIFIED_DELAY, ease: "easeOut" }}
        className="relative mt-6 flex items-center gap-3 rounded-xl border border-xgreen-500/30 bg-xgreen-500/10 px-4 py-3"
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-xgreen-500">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-xgreen-500">Verified against IPRS</p>
          <p className="text-xs text-enterprise-fg-muted">National ID &middot; approved in 1.8s</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// prefers-reduced-motion fallback: the same result, permanently visible, no
// phone sequence and nothing moving.
function StaticResult() {
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[1.15fr_1fr] sm:items-center">
        <div className="relative mx-auto aspect-[8/5] w-full max-w-sm">
          <div className="flex h-full gap-4 overflow-hidden rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
            <div className="grid h-full w-14 shrink-0 place-items-center rounded-lg border border-enterprise-border bg-enterprise-bg-low sm:w-16">
              <User className="h-6 w-6 text-enterprise-fg-subtle" />
            </div>
            <div className="flex flex-1 flex-col justify-between py-0.5">
              {FIELDS.map((f) => (
                <div key={f.label}>
                  <p className="label-caps-thin text-enterprise-fg-subtle/70">{f.label}</p>
                  <p className="text-sm font-semibold tabular-nums text-enterprise-fg">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <p className="label-caps-thin text-enterprise-fg-subtle">Extracted &amp; matched</p>
          {FIELDS.map((f) => {
            const Icon = f.Icon;
            return (
              <div key={f.label} className="flex items-center gap-3 rounded-lg border border-enterprise-border bg-enterprise-bg-lower px-3 py-2">
                <Icon className="h-4 w-4 shrink-0 text-xgreen-500" />
                <span className="text-xs font-medium text-enterprise-fg-muted">{f.label}</span>
                <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-xgreen-500" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative mt-6 flex items-center gap-3 rounded-xl border border-xgreen-500/30 bg-xgreen-500/10 px-4 py-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-xgreen-500">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-xgreen-500">Verified against IPRS</p>
          <p className="text-xs text-enterprise-fg-muted">National ID &middot; approved in 1.8s</p>
        </div>
      </div>
    </div>
  );
}
