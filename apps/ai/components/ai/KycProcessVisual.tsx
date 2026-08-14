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

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  User,
  CreditCard,
  CalendarDays,
  Database,
  CheckCircle2,
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

function TabletMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-xl z-10">
      {/* Outer Tablet Frame Bezel */}
      <div className="relative border-[8px] border-slate-800/90 bg-zinc-900 rounded-3xl p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] shadow-emerald-500/5">
        {/* Front camera lens */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-700/50" />

        {/* Inner Screen Display Surface */}
        <div className="bg-[#030A1A]/95 rounded-2xl border border-slate-800/80 p-5 sm:p-7 relative overflow-hidden min-h-[340px] flex items-center justify-center">
          {/* Dynamic glass glow layer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.01] via-transparent to-teal-500/[0.01] pointer-events-none" />
          {children}
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative mx-auto w-full max-w-xl z-10 flex items-center justify-center min-h-[380px]">
      {reduceMotion ? (
        <TabletMockup>
          <StaticResult />
        </TabletMockup>
      ) : (
        <AnimatePresence mode="wait">
          {showPhone ? (
            <motion.div
              key={`phone-${round}`}
              className="flex justify-center w-full py-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <PhoneMockup phase={phase} />
            </motion.div>
          ) : (
            <motion.div
              key={`scan-${round}`}
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <TabletMockup>
                <ScanResult />
              </TabletMockup>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// Ported from components/kyc/id-scan-dialog.tsx's <PhoneMockup /> — the
// device illustration the actual verify flow uses to show an operator how
// to frame a card, so "what the hero shows" and "what the product shows"
// are the same drawing instead of two unrelated mockups. Adapted for the
// marketing loop: the card group is now a motion.g that slides in and
// settles, the brackets brighten and the shutter fires on a phase prop, and
// the screen background is dropped entirely (see DEVICE.screen below) so
// the card appears to float directly on the section's own backdrop.
//
// Chassis colours (rail/bezel) are deliberately fixed hex, not theme
// tokens — a phone is a physical object in the illustration, not a themed
// surface, and shouldn't invert when the site switches theme. The card
// face stays light for the same reason (ID cards are printed on white
// stock). Only the alignment brackets/shutter ring use the site's own
// --color-xgreen-500 token, since those are UI drawn *by* the product.
const DEVICE = {
  railLight: "#b6bdc9",
  railDark: "#6f7787",
  bezel: "#0a0e15",
  card: "#eef1f6",
  cardEdge: "#c9cfdb",
  cardInk: "#1f2937",
  island: "#05080d",
} as const;

// A dedicated, resized/compressed copy for this decorative hero use —
// components/kyc/id-scan-dialog.tsx and lib/kyc/id-ocr.ts both still use the
// original full-res /images/sample-id.png (the real dialog zooms up to 2.5x,
// so it needs the detail). This SVG only ever renders the image at ~150
// local units (well under 150px on screen even at 3x DPR), so the original
// 729x481 PNG (513KB) was ~18x more data than the hero could ever show —
// this WebP is resized to a still-generous 420px wide and re-encoded
// (~29KB), same picture, previously an unnecessarily heavy image on an
// above-the-fold, eagerly-loaded element.
const SAMPLE_ID_SRC = "/images/sample-id-hero.webp";

function PhoneMockup({ phase }: { phase: Phase }) {
  const clipId = "kycHero" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const aligned = phase === "capture";
  const settled = phase === "align" || phase === "capture";

  // Card geometry — brackets and the flash overlay are derived from this,
  // not hand-positioned separately.
  const card = { x: 26, y: 148, w: 148, h: 93 };
  const pad = 7;
  const arm = 15;
  const l = card.x - pad;
  const r = card.x + card.w + pad;
  const t = card.y - pad;
  const b = card.y + card.h + pad;

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg
        viewBox="0 0 200 400"
        className="h-[260px] w-auto sm:h-[300px]"
        role="img"
        aria-label="Phone camera framing a sample ID card inside alignment brackets"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={card.x} y={card.y} width={card.w} height={card.h} rx="6" />
          </clipPath>
          <linearGradient id={`${clipId}-rail`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={DEVICE.railLight} />
            <stop offset="45%" stopColor={DEVICE.railDark} />
            <stop offset="100%" stopColor={DEVICE.railLight} />
          </linearGradient>
          {/* Subtle glass glare — reads as glass, not as a shape. */}
          <linearGradient id={`${clipId}-glare`} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.015" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Side buttons */}
        <g fill={DEVICE.railDark}>
          <rect x="4" y="104" width="4" height="20" rx="2" />
          <rect x="4" y="136" width="4" height="34" rx="2" />
          <rect x="4" y="180" width="4" height="34" rx="2" />
          <rect x="192" y="150" width="4" height="50" rx="2" />
        </g>

        {/* Titanium rail + bezel. No fill for the screen itself — the card
            sits directly against the section's own backdrop showing through. */}
        <rect x="8" y="4" width="184" height="392" rx="34" fill={`url(#${clipId}-rail)`} />
        <rect x="12" y="8" width="176" height="384" rx="30" fill={DEVICE.bezel} />
        <rect x="17" y="13" width="166" height="374" rx="26" fill="none" />

        {/* The ID card: drawn fallback first, the specimen image layered over
            it (specimen only — see id-scan-dialog.tsx's own note on this
            asset). Slides in and settles once the phone reaches "align". */}
        <motion.g
          initial={{ y: 70, opacity: 0, rotate: -5 }}
          animate={
            settled
              ? { y: [70, -4, 1.5, 0], opacity: [0, 1, 1, 1], rotate: [-5, 1.5, -0.8, 0] }
              : { y: 70, opacity: 0, rotate: -5 }
          }
          transition={
            phase === "align"
              ? { duration: 1.1, times: [0, 0.62, 0.84, 1], ease: "easeOut" }
              : { duration: 0.01 }
          }
          style={{ originX: `${card.x + card.w / 2}px`, originY: `${card.y + card.h}px` }}
        >
          <rect
            x={card.x} y={card.y} width={card.w} height={card.h} rx="6"
            fill={DEVICE.card} stroke={DEVICE.cardEdge} strokeWidth="1"
          />
          <rect x={card.x} y={card.y} width={card.w} height="15" rx="6" fill="var(--color-xgreen-500)" opacity="0.3" />
          <rect x={card.x} y={card.y + 9} width={card.w} height="6" fill="var(--color-xgreen-500)" opacity="0.3" />
          <rect x={card.x + 8} y={card.y + 24} width="32" height="40" rx="3" fill={DEVICE.cardInk} opacity="0.25" />
          <rect x={card.x + 47} y={card.y + 26} width="62" height="6" rx="3" fill={DEVICE.cardInk} opacity="0.3" />
          <rect x={card.x + 47} y={card.y + 38} width="48" height="5" rx="2.5" fill={DEVICE.cardInk} opacity="0.18" />
          <rect x={card.x + 47} y={card.y + 49} width="56" height="5" rx="2.5" fill={DEVICE.cardInk} opacity="0.18" />
          <rect x={card.x + 8} y={card.y + 72} width="120" height="6" rx="3" fill={DEVICE.cardInk} opacity="0.18" />

          <image
            href={SAMPLE_ID_SRC}
            x={card.x}
            y={card.y}
            width={card.w}
            height={card.h}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />
        </motion.g>

        {/* Alignment brackets — dim while settling, bright green once
            "captured". */}
        <motion.g
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          initial={{ stroke: "rgba(255,255,255,0.45)" }}
          animate={{ stroke: aligned ? "var(--color-xgreen-500)" : "rgba(255,255,255,0.45)" }}
          transition={{ duration: 0.25 }}
        >
          <path d={`M${l} ${t + arm} V${t} H${l + arm}`} />
          <path d={`M${r - arm} ${t} H${r} V${t + arm}`} />
          <path d={`M${l} ${b - arm} V${b} H${l + arm}`} />
          <path d={`M${r - arm} ${b} H${r} V${b - arm}`} />
        </motion.g>

        {/* Caption strip, mirroring the live camera's hint text. */}
        <rect x="38" y="292" width="124" height="5" rx="2.5" fill="#fff" opacity="0.35" />
        <rect x="56" y="304" width="88" height="5" rx="2.5" fill="#fff" opacity="0.2" />

        {/* Shutter — the filled dot rises into place first, then the
            outline ring follows it in a beat later. Two independent
            one-shot entrances, not a shared group. No press animation on
            capture; the flash overlay below is the only capture feedback. */}
        <motion.circle
          cx="100" cy="342" r="11" fill="#fff" opacity="0.85"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 0.85 }}
          transition={{ duration: 0.45, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.circle
          cx="100" cy="342" r="15" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Dynamic Island */}
        <rect x="76" y="24" width="48" height="14" rx="7" fill={DEVICE.island} />
        {/* Home indicator */}
        <rect x="72" y="374" width="56" height="4" rx="2" fill="#fff" opacity="0.5" />

        {/* Shutter flash. */}
        {phase === "capture" && (
          <motion.rect
            x="17" y="13" width="166" height="374" rx="26"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.4, times: [0, 0.45, 1] }}
          />
        )}

        {/* Glass glare over everything */}
        <rect x="17" y="13" width="166" height="374" rx="26" fill={`url(#${clipId}-glare)`} pointerEvents="none" />
      </svg>
    </motion.div>
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
