"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Bot,
  Cpu,
  GitBranch,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { fadeInUp, staggerFast } from "./animations";
import { cn } from "@/lib/utils";

// Only start the reveal once the section is substantially on-screen (not the
// moment its top edge peeks into the viewport) — feels intentional rather
// than pre-emptive.
const revealViewport = { once: true, amount: 0.15 } as const;

/* "What We Provide" — full rebuild of the old bento PillarGrid.
   - Centered header, "What We Provide" is now the headline itself (not just
     an eyebrow above a differently-worded title).
   - Symmetric 5-up card row instead of the old 3/3/2/2/2 bento grid — a
     visibly different shape, not just a re-skin.
   - Each card carries a large translucent index numeral watermark instead
     of a floating brand-colored icon — the icon moves into a small chip in
     the header row. Card titles use the same font-display /
     tracking-[-0.02em] treatment as the headline.
   - Parallax hairline backdrop (five lines drifting at different scroll
     speeds) instead of the flat x-grid-bg dot grid. */

type Pillar = {
  index: string;
  name: string;
  title: string;
  body: string;
  href: string;
  stat: string;
  Icon: LucideIcon;
  iconClass: string;
  brandBorderClass: string;
  brandShadowOffHover: string;
  brandShadowOnHover: string;
  brandBarClass: string;
  desktopHoverClass: string;
  numActiveMobileClass: string;
  numDesktopClass: string;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    name: "Xobriq Guard",
    title: "Fraud Intelligence",
    body: "Real-time fraud scoring, deepfake and liveness detection — sub-200ms.",
    href: "/guard",
    stat: "120+ signals",
    Icon: ShieldCheck,
    iconClass: "text-teal-600 dark:text-teal-400",
    brandBorderClass: "border-teal-500/30 dark:border-teal-400/30",
    brandShadowOffHover: "shadow-[0_12px_30px_-10px_rgba(20,184,166,0.12)] dark:shadow-[0_15px_35px_-12px_rgba(20,184,166,0.25)]",
    brandShadowOnHover: "shadow-[0_25px_50px_-12px_rgba(20,184,166,0.22)] dark:shadow-[0_30px_60px_-12px_rgba(20,184,166,0.45)]",
    brandBarClass: "bg-teal-500",
    desktopHoverClass: "lg:border-x-line lg:dark:border-white/20 lg:bg-x-bg lg:shadow-[0_12px_30px_-10px_rgba(20,184,166,0.12)] lg:dark:shadow-[0_15px_35px_-12px_rgba(20,184,166,0.25)] lg:hover:bg-white lg:dark:hover:bg-x-raised lg:hover:border-teal-500/30 lg:hover:shadow-[0_25px_50px_-12px_rgba(20,184,166,0.22)] lg:dark:hover:shadow-[0_30px_60px_-12px_rgba(20,184,166,0.45)]",
    numActiveMobileClass: "text-teal-500/[0.28] dark:text-teal-400/[0.32]",
    numDesktopClass: "lg:text-x-fg/[0.20] lg:dark:text-white/[0.28] lg:group-hover:text-teal-500/[0.30] lg:dark:group-hover:text-teal-400/[0.35]",
  },
  {
    index: "02",
    name: "Agentic AI",
    title: "Autonomous Agents",
    body: "LLM agents that run fraud, KYC and compliance workflows with audit-grade reasoning.",
    href: "/agentic",
    stat: "24/7 autonomous",
    Icon: Bot,
    iconClass: "text-purple-600 dark:text-purple-400",
    brandBorderClass: "border-purple-500/30 dark:border-purple-400/30",
    brandShadowOffHover: "shadow-[0_12px_30px_-10px_rgba(168,85,247,0.12)] dark:shadow-[0_15px_35px_-12px_rgba(168,85,247,0.25)]",
    brandShadowOnHover: "shadow-[0_25px_50px_-12px_rgba(168,85,247,0.22)] dark:shadow-[0_30px_60px_-12px_rgba(168,85,247,0.45)]",
    brandBarClass: "bg-purple-500",
    desktopHoverClass: "lg:border-x-line lg:dark:border-white/20 lg:bg-x-bg lg:shadow-[0_12px_30px_-10px_rgba(168,85,247,0.12)] lg:dark:shadow-[0_15px_35px_-12px_rgba(168,85,247,0.25)] lg:hover:bg-white lg:dark:hover:bg-x-raised lg:hover:border-purple-500/30 lg:hover:shadow-[0_25px_50px_-12px_rgba(168,85,247,0.22)] lg:dark:hover:shadow-[0_30px_60px_-12px_rgba(168,85,247,0.45)]",
    numActiveMobileClass: "text-purple-500/[0.28] dark:text-purple-400/[0.32]",
    numDesktopClass: "lg:text-x-fg/[0.20] lg:dark:text-white/[0.28] lg:group-hover:text-purple-500/[0.30] lg:dark:group-hover:text-purple-400/[0.35]",
  },
  {
    index: "03",
    name: "Xobriq Cloud",
    title: "Sovereign GPU Compute",
    body: "East Africa's only DGX H200 cluster, with 100% Kenya data residency.",
    href: "/cloud",
    stat: "H200 cluster",
    Icon: Cpu,
    iconClass: "text-blue-600 dark:text-blue-400",
    brandBorderClass: "border-blue-500/30 dark:border-blue-400/30",
    brandShadowOffHover: "shadow-[0_12px_30px_-10px_rgba(59,130,246,0.12)] dark:shadow-[0_15px_35px_-12px_rgba(59,130,246,0.25)]",
    brandShadowOnHover: "shadow-[0_25px_50px_-12px_rgba(59,130,246,0.22)] dark:shadow-[0_30px_60px_-12px_rgba(59,130,246,0.45)]",
    brandBarClass: "bg-blue-500",
    desktopHoverClass: "lg:border-x-line lg:dark:border-white/20 lg:bg-x-bg lg:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.12)] lg:dark:shadow-[0_15px_35px_-12px_rgba(59,130,246,0.25)] lg:hover:bg-white lg:dark:hover:bg-x-raised lg:hover:border-blue-500/30 lg:hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.22)] lg:dark:hover:shadow-[0_30px_60px_-12px_rgba(59,130,246,0.45)]",
    numActiveMobileClass: "text-blue-500/[0.28] dark:text-blue-400/[0.32]",
    numDesktopClass: "lg:text-x-fg/[0.20] lg:dark:text-white/[0.28] lg:group-hover:text-blue-500/[0.30] lg:dark:group-hover:text-blue-400/[0.35]",
  },
  {
    index: "04",
    name: "Xobriq Consult",
    title: "Strategy & MLOps",
    body: "AI strategy and MLOps engagements led by a former Google AI researcher.",
    href: "/consult",
    stat: "Ex-Google AI",
    Icon: GitBranch,
    iconClass: "text-amber-600 dark:text-amber-400",
    brandBorderClass: "border-amber-500/30 dark:border-amber-400/30",
    brandShadowOffHover: "shadow-[0_12px_30px_-10px_rgba(245,158,11,0.12)] dark:shadow-[0_15px_35px_-12px_rgba(245,158,11,0.25)]",
    brandShadowOnHover: "shadow-[0_25px_50px_-12px_rgba(245,158,11,0.22)] dark:shadow-[0_30px_60px_-12px_rgba(245,158,11,0.45)]",
    brandBarClass: "bg-amber-500",
    desktopHoverClass: "lg:border-x-line lg:dark:border-white/20 lg:bg-x-bg lg:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.12)] lg:dark:shadow-[0_15px_35px_-12px_rgba(245,158,11,0.25)] lg:hover:bg-white lg:dark:hover:bg-x-raised lg:hover:border-amber-500/30 lg:hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.22)] lg:dark:hover:shadow-[0_30px_60px_-12px_rgba(245,158,11,0.45)]",
    numActiveMobileClass: "text-amber-500/[0.28] dark:text-amber-400/[0.32]",
    numDesktopClass: "lg:text-x-fg/[0.20] lg:dark:text-white/[0.28] lg:group-hover:text-amber-500/[0.30] lg:dark:group-hover:text-amber-400/[0.35]",
  },
  {
    index: "05",
    name: "Xobriq Cyber",
    title: "Managed Defense",
    body: "Pentesting, managed SIEM and incident response, built toward ISO 27001.",
    href: "/cyber",
    stat: "ISO 27001",
    Icon: Lock,
    iconClass: "text-red-600 dark:text-red-400",
    brandBorderClass: "border-red-500/30 dark:border-red-400/30",
    brandShadowOffHover: "shadow-[0_12px_30px_-10px_rgba(239,68,68,0.12)] dark:shadow-[0_15px_35px_-12px_rgba(239,68,68,0.25)]",
    brandShadowOnHover: "shadow-[0_25px_50px_-12px_rgba(239,68,68,0.22)] dark:shadow-[0_30px_60px_-12px_rgba(239,68,68,0.45)]",
    brandBarClass: "bg-red-500",
    desktopHoverClass: "lg:border-x-line lg:dark:border-white/20 lg:bg-x-bg lg:shadow-[0_12px_30px_-10px_rgba(239,68,68,0.12)] lg:dark:shadow-[0_15px_35px_-12px_rgba(239,68,68,0.25)] lg:hover:bg-white lg:dark:hover:bg-x-raised lg:hover:border-red-500/30 lg:hover:shadow-[0_25px_50px_-12px_rgba(239,68,68,0.22)] lg:dark:hover:shadow-[0_30px_60px_-12px_rgba(239,68,68,0.45)]",
    numActiveMobileClass: "text-red-500/[0.28] dark:text-red-400/[0.32]",
    numDesktopClass: "lg:text-x-fg/[0.20] lg:dark:text-white/[0.28] lg:group-hover:text-red-500/[0.30] lg:dark:group-hover:text-red-400/[0.35]",
  },
];

/* Vertical hairlines that drift at different speeds as the section scrolls
   through the viewport — cheap depth cue (pure transform, one shared
   useScroll listener) instead of a static dot grid. Amplitude collapses to
   0 under prefers-reduced-motion. */
function ParallaxLines() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const amp = prefersReducedMotion ? 0 : 1;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], [-30 * amp, 30 * amp]);
  const yMed = useTransform(scrollYProgress, [0, 1], [-64 * amp, 64 * amp]);
  const yFast = useTransform(scrollYProgress, [0, 1], [-100 * amp, 100 * amp]);

  const lines: { left: string; y: typeof ySlow; accent?: boolean }[] = [
    { left: "6%", y: yMed },
    { left: "24%", y: ySlow },
    { left: "50%", y: yFast, accent: true },
    { left: "76%", y: ySlow },
    { left: "94%", y: yMed },
  ];

  return (
    <div
      ref={sectionRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      {/* Dot grid for texture, feathered at the same edges as the lines. */}
      <div className="x-grid-bg absolute inset-0 opacity-90" />
      {/* Soft static washes for depth — top, bottom, and sides. */}
      <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_srgb,var(--x-accent)_22%,transparent),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(65%_50%_at_85%_100%,color-mix(in_srgb,var(--x-accent-bright)_18%,transparent),transparent_70%)]" />
      
      {/* Side washes for depth — web layout only */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-full bg-[radial-gradient(35%_60%_at_0%_50%,color-mix(in_srgb,var(--x-accent)_16%,transparent),transparent_70%)]" />
      <div className="hidden lg:block absolute inset-y-0 right-0 w-full bg-[radial-gradient(35%_60%_at_100%_50%,color-mix(in_srgb,var(--x-accent-bright)_16%,transparent),transparent_70%)]" />

      {lines.map((l, i) => (
        <motion.div
          key={i}
          style={{ left: l.left, y: l.y }}
          className={
            "absolute top-0 h-[140%] w-px " +
            (l.accent ? "bg-x-accent/20" : "bg-x-line-strong")
          }
        />
      ))}
    </div>
  );
}

const iconAnimation: Variants = {
  initial: { scale: 1, originX: 0, originY: 0.5 },
  hover: {
    scale: 1.12,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  mobileActive: {
    scale: 1.12,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export function PillarGrid() {
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState<number | null>(null);
  const [isGridHovered, setIsGridHovered] = useState(false);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Only run on mobile/tablet viewports (< 1024px)
      if (window.innerWidth >= 1024) {
        setActiveMobileIndex(null);
        return;
      }

      if (!cardsContainerRef.current) return;
      const cardElements = cardsContainerRef.current.children;
      const centerY = window.innerHeight / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      for (let i = 0; i < cardElements.length; i++) {
        const rect = cardElements[i].getBoundingClientRect();
        const cardCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenterY - centerY);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }

      // Check if the card center falls in the middle region of the screen (vertical center 220px boundary)
      if (closestDistance < 220) {
        setActiveMobileIndex(closestIndex);
      } else {
        setActiveMobileIndex(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Only run the hover showcase cycle on desktop viewports (>= 1024px)
    if (window.innerWidth < 1024) return;
    if (isGridHovered) return;

    let i = 0;
    const interval = setInterval(() => {
      setActiveShowcaseIndex(i);
      i = (i + 1) % PILLARS.length;
    }, 1800); // 1.8 seconds per card showcase

    return () => clearInterval(interval);
  }, [isGridHovered]);

  return (
    <section className="relative overflow-hidden bg-x-bg py-24 sm:py-32 transition-colors duration-150">
      <ParallaxLines />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          className="mx-auto mb-16 flex max-w-2xl flex-col items-center text-center sm:mb-20"
        >
          <motion.p
            variants={fadeInUp}
            className="font-mono text-sm font-semibold uppercase tracking-[0.22em] text-x-accent sm:text-base"
          >
            our ecosystem
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-x-fg sm:text-5xl"
          >
            Five pillars, one platform.
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-base sm:text-lg text-x-muted">
            One console, one contract, one sovereign infrastructure.
          </motion.p>
        </motion.div>

        <motion.div
          ref={cardsContainerRef}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={staggerFast}
          onMouseEnter={() => {
            setIsGridHovered(true);
            setActiveShowcaseIndex(null);
          }}
          onMouseLeave={() => setIsGridHovered(false)}
          className="grid grid-cols-1 gap-0 sm:gap-5 md:grid-cols-3 lg:grid-cols-5"
        >
          {PILLARS.map((p, i) => {
            const Icon = p.Icon;
            const isEdge = i === 0 || i === PILLARS.length - 1;
            const isFirst = i === 0;
            const isLast = i === PILLARS.length - 1;
            
            const cardRoundedClass = isFirst
              ? "rounded-t-lg rounded-b-none lg:rounded-lg"
              : isLast
              ? "rounded-b-lg rounded-t-none lg:rounded-lg"
              : "rounded-none lg:rounded-lg";

            const cardBorderClass = isFirst
              ? "border"
              : "border border-t-0 lg:border-t";

            const isActiveOnMobile = activeMobileIndex === i;
            const isActiveOnDesktop = activeShowcaseIndex === i;

            return (
              <motion.div key={p.href} variants={fadeInUp} className="h-full">
                <div className={cn("h-full transition-transform duration-500 ease-out", isEdge && "lg:-translate-y-16")}>
                <motion.div whileHover="hover" className="h-full">
                  <Link
                    href={p.href}
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 lg:hover:-translate-y-1",
                      cardRoundedClass,
                      cardBorderClass,
                      // Mobile layout styling
                      p.brandBorderClass,
                      isActiveOnMobile
                        ? cn(p.brandShadowOnHover, "bg-white dark:bg-x-raised")
                        : cn(p.brandShadowOffHover, "bg-white dark:bg-x-bg"),
                      // Desktop layout hover overrides
                      p.desktopHoverClass,
                      // Desktop layout programmatic showcase cycle overrides
                      isActiveOnDesktop && cn(
                        "lg:-translate-y-1 lg:bg-white lg:dark:bg-x-raised",
                        p.brandBorderClass,
                        p.brandShadowOnHover
                      )
                    )}
                  >
                    {/* Accent hairline that draws itself across the top on hover. */}
                    <span
                      aria-hidden
                      className={cn(
                        "hidden lg:block absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100",
                        isActiveOnDesktop && "scale-x-100",
                        p.brandBarClass
                      )}
                    />

                    {/* Large translucent index numeral watermark — pulled inward so
                        the card's own overflow-hidden/rounded corner doesn't clip it. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute right-1 top-2.5 lg:top-[-6px] select-none font-display text-[4.75rem] font-bold leading-none transition-all duration-500 ease-out",
                        isActiveOnMobile || isActiveOnDesktop
                          ? p.numActiveMobileClass
                          : "text-x-fg/[0.20] dark:text-white/[0.28]",
                        p.numDesktopClass
                      )}
                    >
                      {p.index}
                    </span>

                    <motion.div
                      variants={iconAnimation}
                      animate={isActiveOnMobile || isActiveOnDesktop ? "mobileActive" : undefined}
                      className="relative z-10 w-fit origin-left"
                    >
                      <Icon className={"h-7 w-7 stroke-[1.5] " + p.iconClass} />
                    </motion.div>

                    <div className="relative z-10">
                      <p className="x-label mt-5 text-x-muted">{p.name}</p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold leading-[1.15] tracking-[-0.02em] text-x-fg">
                        {p.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-6 text-x-muted">{p.body}</p>
                    </div>

                    <div className="relative z-10 mt-auto flex items-center justify-between border-t border-x-line dark:border-white/10 pt-4">
                      <p
                        className={cn(
                          "x-label lg:transition-colors lg:group-hover:text-x-fg",
                          isActiveOnMobile || isActiveOnDesktop ? "text-x-fg" : "text-x-dim"
                        )}
                      >
                        {p.stat}
                      </p>
                      <ArrowUpRight
                        className={cn(
                          "h-4 w-4 transition-all duration-300 lg:group-hover:-translate-y-0.5 lg:group-hover:translate-x-0.5 lg:group-hover:text-x-accent",
                          isActiveOnMobile || isActiveOnDesktop ? "text-x-accent lg:-translate-y-0.5 lg:translate-x-0.5" : "text-x-dim"
                        )}
                      />
                    </div>
                  </Link>
                </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
