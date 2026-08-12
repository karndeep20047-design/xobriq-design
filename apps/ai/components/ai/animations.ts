// apps/ai/components/ai/animations.ts
// Reusable Framer Motion variants — Sardine.ai-style scroll reveals

import type { Variants } from "framer-motion";

// Fade + rise on scroll in
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // custom cubic-bezier — Sardine's smooth ease
    },
  },
};

// Fade only (for text)
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Scale + fade (for cards, images)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Slide from left/right
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Stagger children — use as parent variant
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

// Standard viewport for whileInView
export const viewportOnce = {
  once: true,
  amount: 0.2,
};

// Hover lift with shadow — for cards
export const hoverLift = {
  scale: 1.02,
  y: -4,
  transition: { duration: 0.3, ease: "easeOut" },
};

// Gentle rotation for hero orbit
export const orbit = {
  animate: {
    rotate: 360,
    transition: {
      duration: 40,
      repeat: Infinity,
      ease: "linear",
    },
  },
};