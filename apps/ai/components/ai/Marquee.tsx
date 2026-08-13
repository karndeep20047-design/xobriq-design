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
        className="flex w-max gap-16 whitespace-nowrap"
        animate={{
          // Percentage, not a fixed pixel distance: -50% always lands
          // exactly at the start of the second copy below, regardless of
          // how wide the actual content is — the old fixed [0, -1000]
          // assumed the tripled content summed to ~1000px, which visibly
          // snapped/jumped for anything shorter or longer than that.
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        {...(pauseOnHover ? { whileHover: { animationPlayState: "paused" } } : {})}
      >
        {/* Exactly two copies — -50% is only the seamless loop point when
            the track is precisely double the single-copy width. */}
        <div className="flex shrink-0 gap-16">{children}</div>
        <div className="flex shrink-0 gap-16" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}