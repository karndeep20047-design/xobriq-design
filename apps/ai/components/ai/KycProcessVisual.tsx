"use client";

// The centerpiece visual for the /kyc marketing page: a tilted, continuously
// animated 5-step verification pipeline (document scan -> liveness match ->
// IPRS match -> risk scoring -> decision). Same "pseudo-3D" convention as
// components/ai/PillarVisuals.tsx — CSS perspective/rotateX + framer-motion,
// no WebGL/three.js dependency.
//
// The connector line is deliberately NOT a separately-positioned SVG overlay
// (an earlier version guessed its top offset in pixels and drifted out of
// alignment with the icon row). Instead each icon and each connector is a
// cell in the same CSS grid row, vertically centered by the grid itself —
// alignment is guaranteed by layout, not by a pixel estimate.

import { motion } from "framer-motion";
import { IdCard, Eye, Database, Gauge, BadgeCheck, type LucideIcon } from "lucide-react";

type Step = {
  label: string;
  sub: string;
  Icon: LucideIcon;
};

const STEPS: Step[] = [
  { label: "Document Scan", sub: "OCR + tamper check", Icon: IdCard },
  { label: "Liveness Match", sub: "Face + deepfake check", Icon: Eye },
  { label: "IPRS Match", sub: "National registry lookup", Icon: Database },
  { label: "Risk Scoring", sub: "120+ signal model", Icon: Gauge },
  { label: "Decision", sub: "Approved in under 2s", Icon: BadgeCheck },
];

const CYCLE = 6; // seconds for one full pass of the travelling pulse
// Grid columns: icon, connector, icon, connector, ... icon (5 icons, 4 connectors)
const ICON_COLUMNS = [1, 3, 5, 7, 9];
const CONNECTOR_COLUMNS = [2, 4, 6, 8];
const GRID_TEMPLATE_COLUMNS =
  "auto minmax(16px,1fr) auto minmax(16px,1fr) auto minmax(16px,1fr) auto minmax(16px,1fr) auto";

export function KycProcessVisual() {
  return (
    <div className="glass-panel glow-hover relative overflow-hidden rounded-3xl p-6 sm:p-10" style={{ perspective: "1400px" }}>
      <div className="tech-grid-light pointer-events-none absolute inset-0 opacity-30" />

      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-xgreen-500/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-dashed border-xgreen-500/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />

      {/* Mobile (<sm): a simple vertical list — 9 cramped grid columns don't
          fit a phone width, so this is a genuinely different layout, not a
          squeezed version of the desktop one. */}
      <div className="relative flex flex-col gap-6 sm:hidden">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-4">
            <StepIcon step={step} index={i} size="sm" />
            <div>
              <p className="text-sm font-semibold text-enterprise-fg">{step.label}</p>
              <p className="mt-0.5 text-xs text-enterprise-fg-muted">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: horizontal pipeline, tilted for the 3D read. */}
      <div
        className="relative hidden sm:grid sm:gap-y-5"
        style={{
          gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
          transform: "rotateX(14deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={`icon-${step.label}`}
            style={{ gridColumn: ICON_COLUMNS[i], gridRow: 1 }}
            className="flex items-center justify-center"
          >
            <StepIcon step={step} index={i} size="lg" />
          </div>
        ))}

        {CONNECTOR_COLUMNS.map((col, i) => (
          <div
            key={`connector-${i}`}
            style={{ gridColumn: col, gridRow: 1 }}
            className="flex items-center px-1.5"
          >
            <Connector index={i} />
          </div>
        ))}

        {STEPS.map((step, i) => (
          <motion.div
            key={`label-${step.label}`}
            style={{ gridColumn: ICON_COLUMNS[i], gridRow: 2 }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="text-center"
          >
            <p className="text-sm font-semibold text-enterprise-fg">{step.label}</p>
            <p className="mt-0.5 text-xs text-enterprise-fg-muted">{step.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepIcon({ step, index, size }: { step: Step; index: number; size: "sm" | "lg" }) {
  const Icon = step.Icon;
  const delay = (index / (STEPS.length - 1)) * CYCLE;
  const boxCls = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const iconCls = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={"relative grid shrink-0 place-items-center " + boxCls}
    >
      <motion.span
        className="absolute inset-0 rounded-2xl bg-xgreen-500/40 blur-md"
        animate={{ opacity: [0, 0.9, 0], scale: [0.8, 1.15, 0.8] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          repeatDelay: CYCLE - 1.2,
          delay,
          ease: "easeInOut",
        }}
      />
      <div className={"relative grid place-items-center rounded-2xl border border-xgreen-500/30 bg-xgreen-500/10 " + boxCls}>
        <Icon className={iconCls + " text-xgreen-500"} />
      </div>
    </motion.div>
  );
}

// One segment of the pipeline track, between two consecutive icons. A small
// pulse travels left->right across ONLY this segment's own width (0%-100%
// of its own box), timed so it hands off to the next segment exactly as
// that segment's icon lights up — no shared global coordinate space to
// drift out of sync with the icon row.
function Connector({ index }: { index: number }) {
  const steps = STEPS.length - 1;
  const t1 = Math.max(0.001, index / steps);
  const t2 = Math.min(0.999, (index + 1) / steps);

  return (
    <div className="relative h-0.5 w-full rounded-full bg-enterprise-border">
      <motion.span
        className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-xgreen-500 shadow-[0_0_10px_rgba(26,125,60,0.8)]"
        style={{ left: 0 }}
        animate={{ left: ["0%", "0%", "100%", "100%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, ease: "linear", times: [0, t1, t2, 1] }}
      />
    </div>
  );
}
