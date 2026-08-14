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
      strokeOpacity: 1,
    },
    visible: {
      strokeDashoffset: 0,
      strokeOpacity: 0,
      transition: {
        strokeDashoffset: { duration: 3, ease: "easeInOut" },
        strokeOpacity: { delay: 3, duration: 0.8, ease: "easeOut" },
      },
    },
  };

  const tspan1Variants = {
    hidden: { fillOpacity: 0 },
    visible: {
      fillOpacity: 0.88,
      transition: { delay: 3, duration: 0.8, ease: "easeOut" },
    },
  };

  const tspan2Variants = {
    hidden: { fill: "rgba(60,162,250,0)" },
    visible: {
      fill: "rgba(60,162,250,0.88)",
      transition: { delay: 3, duration: 0.8, ease: "easeOut" },
    },
  };

  const tspan3Variants = {
    hidden: { fill: "rgba(234,179,8,0)" },
    visible: {
      fill: "rgba(234,179,8,0.88)",
      transition: { delay: 3, duration: 0.8, ease: "easeOut" },
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
        strokeWidth="0.35"
        className="font-[helvetica] text-7xl font-bold"
        variants={textVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.tspan
          className="fill-slate-400 stroke-slate-400 dark:fill-white dark:stroke-white"
          variants={tspan1Variants}
        >
          {text.slice(0, 4)}
        </motion.tspan>
        <motion.tspan
          stroke="#3ca2fa"
          variants={tspan2Variants}
        >
          {text.slice(4, 5)}
        </motion.tspan>
        <motion.tspan
          stroke="#eab308"
          variants={tspan3Variants}
        >
          {text.slice(5, 6)}
        </motion.tspan>
      </motion.text>
    </svg>
  );
};
