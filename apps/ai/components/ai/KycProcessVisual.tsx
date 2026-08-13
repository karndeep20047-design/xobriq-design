"use client";

// The centerpiece visual for the /kyc marketing page: a looping "document
// scanner" mockup — a generic ID card sits in a camera-style viewfinder, a
// scan line sweeps down it, and each field it crosses pops into a
// structured "Extracted" panel on the side. Finishes with a "Verified
// against IPRS" banner, holds, then resets. This is the actual product
// story (OCR capture -> field extraction -> registry match -> decision)
// rendered as a scanning UI, rather than the previous abstract 5-icon
// pipeline diagram.
//
// Every animation is a single declarative keyframe/`times` timeline per
// element (same convention as the old Connector component) driven by one
// shared CYCLE length — no JS timers, so there's nothing to drift out of
// sync on a slow tab or a re-render. useReducedMotion swaps the whole thing
// to a static "already verified" end state instead of turning animation off
// mid-cycle.

import { motion, useReducedMotion } from "framer-motion";
import {
  User,
  CreditCard,
  CalendarDays,
  Database,
  CheckCircle2,
  ScanLine,
  type LucideIcon,
} from "lucide-react";

type Field = {
  label: string;
  value: string;
  Icon: LucideIcon;
  /** Fraction of CYCLE at which this field's data resolves. */
  appearT: number;
};

const FIELDS: Field[] = [
  { label: "Full Name", value: "JOHN K. MWANGI", Icon: User, appearT: 0.12 },
  { label: "ID Number", value: "29184023", Icon: CreditCard, appearT: 0.25 },
  { label: "Date of Birth", value: "14 Apr 1990", Icon: CalendarDays, appearT: 0.38 },
  { label: "IPRS Match", value: "Confirmed", Icon: Database, appearT: 0.51 },
];

const CYCLE = 6.4; // seconds for one full scan -> verify -> reset loop
const SCAN_END = 0.58; // fraction of CYCLE where the scan line reaches the bottom
const VERIFIED_OUT = 0.93; // fraction where the verified banner starts fading
const RESET = 0.97; // fraction where everything drops back to hidden before looping

export function KycProcessVisual() {
  const reduceMotion = useReducedMotion();

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

      <div className="relative grid gap-6 sm:grid-cols-[1.15fr_1fr] sm:items-center">
        {/* Left: the scanned card, framed like a camera-capture viewfinder. */}
        <div className="relative mx-auto aspect-[8/5] w-full max-w-sm">
          <Corner className="left-0 top-0 border-l-2 border-t-2 rounded-tl-lg" />
          <Corner className="right-0 top-0 border-r-2 border-t-2 rounded-tr-lg" />
          <Corner className="bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" />
          <Corner className="bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg" />

          <div className="relative flex h-full gap-4 overflow-hidden rounded-xl border border-enterprise-border bg-enterprise-bg-lower p-4">
            <div className="grid h-full w-14 shrink-0 place-items-center rounded-lg border border-enterprise-border bg-enterprise-bg-low sm:w-16">
              <User className="h-6 w-6 text-enterprise-fg-subtle" />
            </div>

            <div className="flex flex-1 flex-col justify-between py-0.5">
              {FIELDS.map((f) => (
                <div key={f.label} className="relative">
                  <p className="label-caps-thin text-enterprise-fg-subtle/70">{f.label}</p>
                  <motion.p
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: [0, 0, 1, 1, 0] }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            duration: CYCLE,
                            repeat: Infinity,
                            times: [0, f.appearT, Math.min(f.appearT + 0.03, 0.99), RESET, 1],
                            ease: "easeOut",
                          }
                    }
                    className="text-sm font-semibold tabular-nums text-enterprise-fg"
                  >
                    {f.value}
                  </motion.p>
                  {/* Bounding-box flash as the scan line crosses this row. */}
                  {!reduceMotion && (
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute -inset-x-1.5 -inset-y-0.5 rounded-md border border-xgreen-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0, 0.9, 0, 0] }}
                      transition={{
                        duration: CYCLE,
                        repeat: Infinity,
                        times: [0, f.appearT, f.appearT + 0.015, f.appearT + 0.11, 1],
                        ease: "easeOut",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {!reduceMotion && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-3 h-[3px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #22c55e 20%, #86efac 50%, #22c55e 80%, transparent)",
                boxShadow: "0 0 18px 2px rgba(34,197,94,0.55)",
              }}
              initial={{ top: "6%", opacity: 0 }}
              animate={{
                top: ["6%", "6%", "88%", "88%", "6%"],
                opacity: [0, 1, 1, 0, 0],
              }}
              transition={{
                duration: CYCLE,
                repeat: Infinity,
                times: [0, 0.03, SCAN_END, SCAN_END + 0.05, 1],
                ease: "linear",
              }}
            />
          )}
        </div>

        {/* Right: the same fields, resolving into a structured "Extracted" list. */}
        <div className="space-y-2.5">
          <p className="label-caps-thin text-enterprise-fg-subtle">Extracted &amp; matched</p>
          {FIELDS.map((f) => {
            const Icon = f.Icon;
            return (
              <motion.div
                key={f.label}
                initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                animate={
                  reduceMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: [0, 0, 1, 1, 0], x: [-8, -8, 0, 0, -8] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: CYCLE,
                        repeat: Infinity,
                        times: [0, f.appearT, Math.min(f.appearT + 0.04, 0.99), RESET, 1],
                        ease: "easeOut",
                      }
                }
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

      {/* Verified banner — appears once every field above has resolved. */}
      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        animate={
          reduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 8] }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: CYCLE,
                repeat: Infinity,
                times: [0, SCAN_END + 0.03, SCAN_END + 0.08, VERIFIED_OUT, RESET],
                ease: "easeOut",
              }
        }
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

      <p className="relative mt-3 text-center text-[11px] text-enterprise-fg-subtle/70">
        Sample document for illustration &mdash; not real applicant data.
      </p>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={"absolute h-5 w-5 border-xgreen-500/50 " + className}
    />
  );
}
