"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  speed?: number; // seconds for full loop
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
};

export function Marquee({
  children,
  speed = 30,
  direction = "left",
  pauseOnHover = true,
  className = "",
}: Props) {
  return (
    <div
      className={"overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] " + className}
    >
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, -1000] : [-1000, 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        {...(pauseOnHover ? { whileHover: { animationPlayState: "paused" } } : {})}
      >
        {/* Duplicate content so marquee loops seamlessly */}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  );
}