"use client";
import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextHoverEffect = ({
  text,
  className,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  // Scopes the clipPath id so multiple instances of this component on one
  // page (unlikely today, but nothing stops it) don't collide.
  const clipId = "textReveal" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none uppercase", className)}
    >
      {/* The "drawing" effect used to be a stroke-dasharray/dashoffset
          animation directly on the <text> — flickers/twitches, because
          letters with holes (O, B, R, Q) render as multiple disconnected
          sub-contours (outer ring + inner counter), each with its own dash
          pattern that animates slightly out of sync with the others.
          Same left-to-right reveal here via a different, glitch-free
          mechanism instead: the text itself is fully, statically drawn
          from the start (no dasharray at all — completely normal stroke
          rendering, nothing for sub-contours to desync on), and a
          <clipPath> rectangle sweeps left to right to progressively reveal
          it. Clip-path animation is a plain compositor-friendly geometry
          change, not a per-frame stroke-rendering recompute, so there's
          nothing left to flicker. */}
      <defs>
        <clipPath id={clipId}>
          <motion.rect
            x="0"
            y="0"
            height="100"
            initial={{ width: 0 }}
            whileInView={{ width: 300 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.35"
          className="font-[helvetica] text-7xl font-bold"
        >
          {/* "XOBR" is grey in light mode / white in dark mode — a static
              Tailwind class with a dark: variant; only fillOpacity (a plain
              number) is animated, since framer can't interpolate between
              two different colour *values* keyed to a media query the way
              CSS can. "I" and "Q" stay fixed across both themes.
              Each letter's fill fades in once the clip sweep finishes
              (delay: 3s matches its 3s duration) — not filled from the
              start, so the reveal genuinely reads as an outline before the
              letters solidify. */}
          <motion.tspan
            className="fill-slate-400 stroke-slate-400 dark:fill-white dark:stroke-white"
            initial={{ fillOpacity: 0 }}
            whileInView={{ fillOpacity: 0.88 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
          >
            {text.slice(0, 4)}
          </motion.tspan>
          <motion.tspan
            stroke="#3ca2fa"
            initial={{ fill: "rgba(60,162,250,0)" }}
            whileInView={{ fill: "rgba(60,162,250,0.88)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
          >
            {text.slice(4, 5)}
          </motion.tspan>
          <motion.tspan
            stroke="#eab308"
            initial={{ fill: "rgba(234,179,8,0)" }}
            whileInView={{ fill: "rgba(234,179,8,0.88)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
          >
            {text.slice(5, 6)}
          </motion.tspan>
        </text>
      </g>
    </svg>
  );
};
