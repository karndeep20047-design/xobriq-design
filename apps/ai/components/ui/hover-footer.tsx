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
  const textVariants = {
    hidden: {
      strokeDashoffset: 1000,
      strokeDasharray: 1000,
      strokeWidth: 0.35,
    },
    visible: {
      strokeDashoffset: 0,
      strokeWidth: 0,
      transition: {
        strokeDashoffset: { duration: 3, ease: "easeInOut" },
        strokeWidth: { delay: 3, duration: 0.8, ease: "easeOut" },
      },
    },
  };

  const tspan1Variants = {
    hidden: {
      fillOpacity: 0,
      stroke: "currentColor",
    },
    visible: {
      fillOpacity: 0.88,
      stroke: "rgba(0, 0, 0, 0)",
      transition: {
        fillOpacity: { delay: 3, duration: 0.8, ease: "easeOut" },
        stroke: { delay: 3, duration: 0.8, ease: "easeOut" },
      },
    },
  };

  const tspan2Variants = {
    hidden: {
      fillOpacity: 0,
      fill: "#3ca2fa",
      stroke: "#3ca2fa",
    },
    visible: {
      fillOpacity: 0.88,
      stroke: "rgba(0, 0, 0, 0)",
      transition: {
        fillOpacity: { delay: 3, duration: 0.8, ease: "easeOut" },
        stroke: { delay: 3, duration: 0.8, ease: "easeOut" },
      },
    },
  };

  const tspan3Variants = {
    hidden: {
      fillOpacity: 0,
      fill: "#eab308",
      stroke: "#eab308",
    },
    visible: {
      fillOpacity: 0.88,
      stroke: "rgba(0, 0, 0, 0)",
      transition: {
        fillOpacity: { delay: 3, duration: 0.8, ease: "easeOut" },
        stroke: { delay: 3, duration: 0.8, ease: "easeOut" },
      },
    },
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none uppercase", className)}
    >
      {/* Animated drawing text with variant orchestration to prevent flickering */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-[helvetica] text-7xl font-bold text-slate-400 dark:text-white"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.tspan
          className="fill-slate-400 dark:fill-white"
          variants={tspan1Variants}
        >
          {text.slice(0, 4)}
        </motion.tspan>
        <motion.tspan
          variants={tspan2Variants}
        >
          {text.slice(4, 5)}
        </motion.tspan>
        <motion.tspan
          variants={tspan3Variants}
        >
          {text.slice(5, 6)}
        </motion.tspan>
      </motion.text>
    </svg>
  );
};
