"use client";

import * as React from "react";
// framer-motion v12 dropped the `AnimationProps` export the upstream snippet
// used; MotionProps covers the same initial/animate/whileTap/transition shape.
import { motion, useReducedMotion, type HTMLMotionProps, type MotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Shimmer button, adapted from the 21st.dev ShinyButton.
 *
 * Two changes from the original, both required here:
 *
 * 1. COLOUR SPACE. The original writes `hsl(var(--primary))`, which assumes
 *    --primary holds a bare HSL triplet (`155 60% 45%`). This app stores it as
 *    a complete oklch() colour, so wrapping it in hsl() produces
 *    `hsl(oklch(...))` — invalid, silently dropped, and the shimmer just never
 *    appears. Tokens are referenced directly, and opacity comes from
 *    color-mix() instead of hsl()'s slash syntax.
 *
 * 2. GRADIENTS MOVED TO `style`. color-mix() inside a Tailwind arbitrary value
 *    needs every space escaped as an underscore, which makes these unreadable
 *    and easy to break. Inline style keeps them legible.
 *
 * Also honours prefers-reduced-motion: the shimmer is decorative, so it stops
 * rather than looping forever for someone who asked for less movement.
 */

/** --primary at a given opacity, in a colour space that matches the tokens. */
const tint = (percent: number) =>
  `color-mix(in oklab, var(--primary) ${percent}%, transparent)`;

const shimmer: MotionProps = {
  initial: { "--x": "100%", scale: 0.8 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: { type: "spring", stiffness: 200, damping: 5, mass: 0.5 },
  },
};

// Settled end-state: the sweep sits off-screen so the label renders at full
// opacity with no animation running.
const still: MotionProps = {
  initial: { "--x": "-100%", scale: 1 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.97 },
};

export interface ShinyButtonProps
  extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, ...props }, ref) => {
    const reduceMotion = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        {...(reduceMotion ? still : shimmer)}
        {...props}
        className={cn(
          "relative rounded-lg px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out",
          "hover:shadow dark:hover:shadow-[0_0_20px_var(--shiny-glow)]",
          className,
        )}
        style={{
          // Custom property so the dark: shadow above can reference it without
          // a second color-mix() inline.
          ["--shiny-glow" as string]: tint(18),
          backgroundImage: `radial-gradient(circle at 50% 0%, ${tint(10)} 0%, transparent 60%)`,
          ...props.style,
        }}
      >
        <span
          className="relative block size-full text-sm uppercase tracking-wide text-foreground/70 dark:font-light dark:text-foreground/90"
          style={{
            // The sweep: a moving window of opaque->transparent->opaque that
            // rides across the label as --x animates.
            maskImage: `linear-gradient(-75deg, var(--primary) calc(var(--x) + 20%), transparent calc(var(--x) + 30%), var(--primary) calc(var(--x) + 100%))`,
          }}
        >
          {children}
        </span>

        {/* 1px gradient border: a padding-box/border-box mask difference, so the
            gradient shows only in the 1px ring rather than filling the button. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 block rounded-[inherit] p-px"
          style={{
            backgroundImage: `linear-gradient(-75deg, ${tint(10)} calc(var(--x) + 20%), ${tint(50)} calc(var(--x) + 25%), ${tint(10)} calc(var(--x) + 100%))`,
            mask: "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
          }}
        />
      </motion.button>
    );
  },
);
ShinyButton.displayName = "ShinyButton";
