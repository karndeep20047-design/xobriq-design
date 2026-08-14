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
          Colour itself is a static Tailwind class with a dark: variant
          (slate in light mode, white in dark — white text on this
          section's white light-mode background was invisible), so only
          fillOpacity/strokeDasharray need animating; framer can't smoothly
          interpolate between two different colour *values* keyed to a
          media query the way CSS can.
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
          className="fill-slate-800 stroke-slate-800 dark:fill-white dark:stroke-white"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 0.88 }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(0, 4)}
        </motion.tspan>
        <motion.tspan
          className="fill-[#3ca2fa] stroke-[#3ca2fa]"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 0.88 }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(4, 5)}
        </motion.tspan>
        <motion.tspan
          className="fill-[#9a6d00] stroke-[#9a6d00] dark:fill-[#eab308] dark:stroke-[#eab308]"
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: 0.88 }}
          transition={{ delay: 3, duration: 0.8, ease: "easeOut" }}
        >
          {text.slice(5, 6)}
        </motion.tspan>
      </motion.text>
    </svg>
  );
};

export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, #070E2266 50%, #3ca2fa22 100%)",
      }}
    />
  );
};
