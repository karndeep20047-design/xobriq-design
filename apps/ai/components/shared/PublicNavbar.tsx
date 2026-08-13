"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Bot, Cloud, GitBranch, ShieldAlert, IdCard,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import RichNavigationMenu from "@/components/ui/navigation-menu-06";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";

// ─── Data ────────────────────────────────────────────────────────────────────

const PRODUCTS = [
  { label: "Xobriq KYC",     href: "/kyc",     Icon: IdCard,      iconColor: "text-emerald-500", status: "live"  as const },
  { label: "Xobriq Guard",   href: "/guard",   Icon: ShieldCheck, iconColor: "text-teal-500",    status: "soon"  as const },
  { label: "Agentic AI",     href: "/agentic", Icon: Bot,         iconColor: "text-purple-500",  status: "soon"  as const },
  { label: "Xobriq Cloud",   href: "/cloud",   Icon: Cloud,       iconColor: "text-blue-500",    status: "soon"  as const },
  { label: "Xobriq Consult", href: "/consult", Icon: GitBranch,   iconColor: "text-amber-500",   status: "soon"  as const },
  { label: "Xobriq Cyber",   href: "/cyber",   Icon: ShieldAlert, iconColor: "text-red-500",     status: "soon"  as const },
];

const RESOURCES = [
  { label: "Case Studies", href: "/case-studies" },
  { label: "Benchmarks",   href: "/benchmarks" },
  { label: "Blog",         href: "/blog" },
  { label: "Developers",   href: "/developers" },
];

const COMPANY = [
  { label: "Pricing",  href: "/pricing" },
  { label: "Docs",     href: "/docs" },
  { label: "About Us", href: "/about" },
  { label: "Careers",  href: "/careers" },
];

// ─── Variants ─────────────────────────────────────────────────────────────────

const menuSlide = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemFade = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const accordion = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:   { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
}

// ─── Accordion section ────────────────────────────────────────────────────────

function AccordionSection({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div variants={itemFade}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3.5 text-base font-semibold text-slate-900 dark:text-white"
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="acc"
            variants={accordion}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const OVERLAY_HERO_ROUTES = new Set(["/"]);

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const pathname = usePathname();
  const hasOverlayHero = OVERLAY_HERO_ROUTES.has(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => {
    const id = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow   = mobileOpen ? "hidden" : "";
    document.body.style.touchAction = mobileOpen ? "none" : "";
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [mobileOpen]);

  const close = () => setMobileOpen(false);
  const overHero = hasOverlayHero && !scrolled && !mobileOpen;

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ willChange: "transform" }}
        className="fixed inset-x-0 top-0 z-50 pointer-events-none"
      >
        <div
          className={
            "pointer-events-auto mx-auto flex items-center justify-between border-x border-b transition-[height,max-width,padding,border-radius,background-color,border-color,box-shadow] duration-300 ease-out " +
            (mobileOpen
              ? "h-14 sm:h-16 w-full max-w-6xl rounded-b-none border-b-transparent border-slate-200/80 bg-white/75 px-4 sm:px-7 text-slate-900 shadow-lg backdrop-blur-2xl dark:border-white/20 dark:bg-[#080a10]/75 dark:text-white"
              : scrolled
              ? "h-14 sm:h-16 w-full max-w-6xl rounded-b-2xl border-slate-200/80 bg-white/70 px-4 sm:px-7 text-slate-900 shadow-xl backdrop-blur-2xl dark:border-white/20 dark:bg-[#080a10]/55 dark:text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
              : "h-20 w-full max-w-full rounded-b-none border-transparent bg-transparent px-5 sm:px-10 lg:px-14 text-slate-900 shadow-none backdrop-blur-none dark:text-white")
          }
        >
          {/* Logo */}
          <Link href="/" aria-label="Xobriq home" className="inline-flex shrink-0 items-center" onClick={close}>
            <Image
              src="/xobriq-logo-horizontal.png"
              alt="Xobriq"
              width={300}
              height={100}
              priority
              className="h-9 sm:h-10 w-auto object-contain transition-all duration-300"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center">
            <RichNavigationMenu overHero={overHero} />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {/* Login hidden on mobile, shown desktop-only */}
            <Link
              href="/login"
              className={
                "hidden rounded-full px-4 py-2 text-sm font-medium transition-colors md:inline-flex " +
                (overHero ? "text-x-muted hover:text-x-fg" : "text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white")
              }
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 bg-slate-900 text-white hover:bg-slate-800 shadow-sm dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200 hover:scale-[1.02]"
            >
              Console
            </Link>
            {/* Hamburger — mobile only */}
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className={
                "grid h-10 w-10 place-items-center rounded-xl border transition-all md:hidden " +
                (overHero
                  ? "border-x-line/40 bg-x-fg/5 text-x-fg hover:bg-x-fg/15"
                  : "border-slate-200/60 bg-transparent text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:text-white dark:hover:bg-white/10")
              }
            >
              <MenuToggleIcon open={mobileOpen} className="h-5 w-5" duration={350} />
            </button>
          </div>
        </div>

        {/* ── Slide-down mobile menu panel (directly below nav) ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              variants={menuSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
              className="pointer-events-auto md:hidden w-full border-b border-slate-200/80 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-[#080a10]/75 overflow-y-auto max-h-[min(calc(100svh-56px),calc(100dvh-56px))]"
            >
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="px-5 pb-6 pt-2 divide-y divide-slate-100 dark:divide-white/[0.07]"
              >
                {/* Products accordion */}
                <AccordionSection label="Products" defaultOpen>
                  <div className="pb-3 space-y-0.5">
                    {PRODUCTS.map((p) => {
                      const Icon = p.Icon;
                      return (
                        <Link
                          key={p.href}
                          href={p.href}
                          onClick={close}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/[0.07] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4.5 w-4.5 ${p.iconColor}`} />
                            <span>{p.label}</span>
                          </div>
                          {p.status === "live" && <LiveBadge />}
                        </Link>
                      );
                    })}
                  </div>
                </AccordionSection>

                {/* Resources accordion */}
                <AccordionSection label="Resources">
                  <div className="pb-3 space-y-0.5">
                    {RESOURCES.map((r) => (
                      <Link
                        key={r.href}
                        href={r.href}
                        onClick={close}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/[0.07] transition-colors"
                      >
                        {r.label}
                      </Link>
                    ))}
                  </div>
                </AccordionSection>

                {/* Company accordion */}
                <AccordionSection label="Company">
                  <div className="pb-3 space-y-0.5">
                    {COMPANY.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={close}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/[0.07] transition-colors"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </AccordionSection>

                {/* CTA */}
                <motion.div variants={itemFade} className="pt-5">
                  <Link
                    href="/contact"
                    onClick={close}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700 transition-all"
                  >
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer for non-overlay pages */}
      <div className={hasOverlayHero ? "hidden" : "h-20"} />
    </>
  );
}
