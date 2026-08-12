"use client";

// Lightweight "pseudo-3D" motifs for the pillar bento grid (PillarsBento.tsx).
// Built entirely from CSS perspective/rotateX tilts + SVG + framer-motion —
// no WebGL/three.js dependency. Each one echoes its card's own icon/theme
// (signal graph, agent orbit, GPU stack, branch diagram, threat radar) and
// sits absolutely positioned + pointer-events-none in a corner the card's
// text never reaches, matching the low-opacity watermark-icon pattern this
// file replaces.

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

// Fraud Intelligence — signals (dots) converging on a shield, on a tilted
// radar disk with a rotating scan sweep. The flagship visual: this card has
// a tall empty top area (content is pinned to the bottom via justify-end).
export function FraudNetworkVisual() {
  const nodes = [
    { x: 50, y: 6 },
    { x: 90, y: 28 },
    { x: 90, y: 72 },
    { x: 50, y: 94 },
    { x: 10, y: 72 },
    { x: 10, y: 28 },
  ];

  return (
    <div
      className="pointer-events-none absolute -right-6 -top-6 h-64 w-64 opacity-80 transition-opacity duration-300 group-hover:opacity-100 sm:h-72 sm:w-72"
      style={{ perspective: "800px" }}
    >
      <div
        className="absolute inset-0"
        style={{ transform: "rotateX(58deg) rotateZ(-8deg)", transformStyle: "preserve-3d" }}
      >
        {[1, 0.72, 0.44].map((scale, i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-enterprise-primary/20"
            style={{ transform: `scale(${scale})` }}
          />
        ))}

        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, color-mix(in srgb, var(--color-enterprise-primary) 45%, transparent), transparent 32%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {nodes.map((n, i) => (
            <line
              key={`l${i}`}
              x1={50}
              y1={50}
              x2={n.x}
              y2={n.y}
              className="stroke-enterprise-primary/40"
              strokeWidth={0.7}
            />
          ))}
          {nodes.map((n, i) => (
            <motion.circle
              key={`n${i}`}
              cx={n.x}
              cy={n.y}
              r={2.4}
              className="fill-enterprise-primary"
              animate={{ r: [1.8, 2.8, 1.8], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
            />
          ))}
        </svg>

        <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-enterprise-primary shadow-[var(--shadow-glow)]">
          <ShieldCheck className="h-5 w-5 text-enterprise-on-primary" />
        </div>
      </div>
    </div>
  );
}

// Autonomous Agents — two counter-rotating rings of particles orbiting on a
// tilted plane, like agents working a task loop around a central process.
export function AgentOrbitVisual() {
  const outer = [0, 60, 120, 180, 240, 300];
  const inner = [30, 150, 270];

  return (
    <div
      className="pointer-events-none absolute -right-3 -top-3 h-28 w-28 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      style={{ perspective: "500px" }}
    >
      <div className="absolute inset-0" style={{ transform: "rotateX(62deg)", transformStyle: "preserve-3d" }}>
        <span className="absolute inset-0 rounded-full border border-enterprise-primary/20" />
        <span className="absolute inset-[18%] rounded-full border border-enterprise-primary/15" />

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        >
          {outer.map((deg, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-enterprise-primary"
              style={{ transform: `rotate(${deg}deg) translateX(13px)` }}
            />
          ))}
        </motion.div>

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          {inner.map((deg, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-enterprise-primary/60"
              style={{ transform: `rotate(${deg}deg) translateX(8px)` }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// Sovereign GPU Compute — a stack of chip layers viewed at an isometric
// angle, glowing amber one at a time to suggest per-second GPU throughput.
export function GpuStackVisual() {
  const layers = [0, 1, 2, 3];

  return (
    <div
      className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 opacity-75 transition-opacity duration-300 group-hover:opacity-100"
      style={{ perspective: "600px" }}
    >
      <div
        className="absolute inset-0"
        style={{ transform: "rotateX(55deg) rotateZ(35deg)", transformStyle: "preserve-3d" }}
      >
        {layers.map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-md border border-enterprise-accent/40 bg-enterprise-accent/10"
            style={{ transform: `translateZ(${i * 9}px)` }}
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.32, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

// Xobriq Consult — a small branching diagram that continuously "draws"
// itself, echoing the GitBranch icon and MLOps/strategy framing.
export function ConsultBranchVisual() {
  return (
    <div
      className="pointer-events-none absolute right-4 top-4 h-16 w-16 opacity-65 transition-opacity duration-300 group-hover:opacity-100"
      style={{ perspective: "300px" }}
    >
      <svg
        viewBox="0 0 60 60"
        className="h-full w-full"
        style={{ transform: "rotateX(24deg) rotateY(-10deg)" }}
      >
        <motion.path
          d="M10 50 L10 30 L30 30 L30 10 M30 30 L50 30 L50 50"
          fill="none"
          className="stroke-enterprise-primary/70"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -40] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <circle cx={10} cy={50} r={2.4} className="fill-enterprise-primary" />
        <circle cx={30} cy={10} r={2.4} className="fill-enterprise-primary" />
        <circle cx={50} cy={50} r={2.4} className="fill-enterprise-primary" />
      </svg>
    </div>
  );
}

// Xobriq Cyber — expanding threat-radar pulses on a tilted disk, echoing the
// ShieldAlert icon's red tone.
export function CyberPulseVisual() {
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 h-20 w-20 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      style={{ perspective: "400px" }}
    >
      <div className="absolute inset-0" style={{ transform: "rotateX(60deg)", transformStyle: "preserve-3d" }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-xred-500/50"
            animate={{ scale: [0.3, 1.15], opacity: [0.85, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-xred-500" />
      </div>
    </div>
  );
}
