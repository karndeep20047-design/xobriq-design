// ============================================================================
//  Counter — animated number that counts up when in view
// ============================================================================
"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

export function Counter({
  to,
  duration = 1.4,
  prefix = "",
  suffix = "",
  decimals = 0,
}: Props) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrapperRef, { once: true, margin: "-40px" });

  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, to, duration, count]);

  return (
    <span ref={wrapperRef}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}