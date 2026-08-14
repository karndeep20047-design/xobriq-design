"use client";
import React from "react";
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
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none uppercase", className)}
    >
      {/* Animated drawing text, coloured to match the physical office
          sign/logo (wordmark / blue "I" / gold "Q") rather than the
          previous rainbow gradient stroke — per-letter colour via tspans,
          since a single gradient can't target individual characters.
          Split assumes "XOBRIQ" specifically (chars 0-3 / 4 / 5); this
          component is only ever used for that one word.
          "XOBR" is grey in light mode / white in dark mode — set via a
          static Tailwind class with a dark: variant, animating only
          fillOpacity (a plain number) rather than the fill colour itself,
          since framer can't interpolate between two different colour
          *values* keyed to a media query the way CSS can. "I" and "Q" stay
          fixed across both themes.
          Outline draws in first (0-3s), then each letter's fill fades in
          (delayed until the draw finishes) — not filled from the start, so
          the outline animation actually reads as an outline before the
          letters solidify. */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.35"
        className="font-[helvetica] text-7xl font-bold"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        // @ts-expect-error transition prop type mismatch with motion
        transition={{
          duration: 3,
          ease: "easeInOut",
        }}
      >
        <motion.tspan
          className="fill-slate-400 stroke-slate-400 dark:fill-white dark:stroke-white"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 0.88 }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(0, 4)}
        </motion.tspan>
        <motion.tspan
          stroke="#3ca2fa"
          initial={{ fill: "rgba(60,162,250,0)" }}
          animate={{ fill: "rgba(60,162,250,0.88)" }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(4, 5)}
        </motion.tspan>
        <motion.tspan
          stroke="#eab308"
          initial={{ fill: "rgba(234,179,8,0)" }}
          animate={{ fill: "rgba(234,179,8,0.88)" }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(5, 6)}
        </motion.tspan>
      </motion.text>
    </svg>
  );
};
