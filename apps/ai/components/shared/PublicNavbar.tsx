"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Bot, Cloud, GitBranch, ShieldAlert, IdCard, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import RichNavigationMenu from "@/components/ui/navigation-menu-06";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";

const PRODUCTS = [
  { label: "Xobriq KYC",     href: "/kyc",     desc: "AI-powered identity verification.",          Icon: IdCard,      iconColor: "text-emerald-600 dark:text-xgreen-400",  status: "live" as const },
  { label: "Xobriq Guard",   href: "/guard",   desc: "Fraud, deepfake, and identity intelligence.", Icon: ShieldCheck, iconColor: "text-teal-600 dark:text-xteal-400",   status: "soon" as const },
  { label: "Agentic AI",     href: "/agentic", desc: "Autonomous enterprise agents.",              Icon: Bot,         iconColor: "text-purple-600 dark:text-xpurple-400", status: "soon" as const },
  { label: "Xobriq Cloud",   href: "/cloud",   desc: "Sovereign GPU compute in Nairobi.",          Icon: Cloud,       iconColor: "text-blue-600 dark:text-xblue-400",   status: "soon" as const },
  { label: "Xobriq Consult", href: "/consult", desc: "Strategic AI advisory and MLOps.",           Icon: GitBranch,   iconColor: "text-amber-600 dark:text-xgold-500",   status: "soon" as const },
  { label: "Xobriq Cyber",   href: "/cyber",   desc: "Autonomous defense and SIEM.",               Icon: ShieldAlert, iconColor: "text-red-600 dark:text-xred-400",    status: "soon" as const },
];

const RESOURCES = [
  { label: "Case Studies", href: "/case-studies", desc: "Real deployments in production." },
  { label: "Benchmarks",   href: "/benchmarks",   desc: "Verified performance data." },
  { label: "Blog",         href: "/blog",         desc: "Engineering + research perspectives." },
  { label: "Developers",   href: "/developers",   desc: "SDKs, CLI, and integrations." },
];

function ProductStatusBadge({ status }: { status: "live" | "soon" }) {
  return status === "live" ? (
    <span className="inline-flex items-center justify-center h-5 shrink-0 px-2 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center justify-center h-5 shrink-0 px-2 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/50">
      Soon
    </span>
  );
}

const OVERLAY_HERO_ROUTES = new Set(["/"]);

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const hasOverlayHero = OVERLAY_HERO_ROUTES.has(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 25);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll and touch gestures when mobile menu drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  const overHero = hasOverlayHero && !scrolled && !mobileOpen;

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50 pointer-events-none"
      >
        <div
          className={
            "pointer-events-auto mx-auto flex items-center justify-between border-x border-b transition-[height,max-width,padding,border-radius,background-color,border-color,box-shadow] duration-300 ease-out " +
            (scrolled
              ? "h-14 sm:h-16 w-full max-w-6xl rounded-b-xl sm:rounded-b-2xl border-slate-200/80 bg-white/90 px-4 sm:px-7 text-slate-900 shadow-md backdrop-blur-lg dark:border-white/15 dark:bg-[#0c0d12]/92 dark:text-white dark:shadow-[0_12px_40px_rgba(200,210,225,0.16),0_2px_12px_rgba(255,255,255,0.09)]"
              : "h-20 w-full max-w-full rounded-b-none border-transparent bg-transparent px-5 sm:px-10 lg:px-14 text-slate-900 shadow-none backdrop-blur-none dark:text-white")
          }
        >
          {/* Logo anchored far left in viewport at rest */}
          <div className="inline-flex shrink-0 items-center">
            <Link href="/" aria-label="Xobriq home" className="inline-flex shrink-0 items-center">
              <Image
                src="/xobriq-logo.png"
                alt="Xobriq"
                width={220}
                height={60}
                priority
                className="h-9 sm:h-11 w-auto object-contain transition-all duration-300"
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center">
            <RichNavigationMenu overHero={overHero} />
          </div>

          {/* Right cluster anchored far right in viewport at rest */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className={
                "hidden rounded-full px-4 py-2 text-sm font-medium transition-colors md:inline-flex " +
                (overHero
                  ? "text-x-muted hover:text-x-fg"
                  : "text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white")
              }
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 bg-slate-900 text-white hover:bg-slate-800 shadow-sm dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200 dark:shadow-md hover:scale-[1.02]"
            >
              Console
            </Link>
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className={
                "grid h-10 w-10 place-items-center rounded-xl border transition-all md:hidden " +
                (overHero
                  ? "border-x-line/40 bg-x-fg/5 text-x-fg hover:bg-x-fg/15 hover:border-x-line-strong"
                  : "border-slate-200/60 bg-transparent text-slate-900 hover:bg-slate-100 hover:border-slate-300 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:bg-white/10 dark:hover:border-white/25")
              }
            >
              <MenuToggleIcon open={mobileOpen} className="h-5 w-5" duration={350} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Side-Drawer Mobile Menu with Back-Drop Blur & Body Scroll Lock */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Dimmed backdrop overlay */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden pointer-events-auto"
            />

            {/* Modern Side-Drawer Sliding in from Right */}
            <motion.div
              key="mobile-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col justify-between overflow-y-auto border-l border-slate-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0c0d12]/95 md:hidden pointer-events-auto"
            >
              <div>
                {/* Header inside Side Drawer */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 dark:border-white/10">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="inline-flex items-center">
                    <Image
                      src="/xobriq-logo.png"
                      alt="Xobriq"
                      width={160}
                      height={44}
                      className="h-8 w-auto object-contain"
                    />
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Staggered Animated Content List */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.04, delayChildren: 0.08 },
                    },
                  }}
                  className="mt-6 space-y-6"
                >
                  {/* Products Group */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Products</p>
                    <div className="grid grid-cols-1 gap-1">
                      {PRODUCTS.map((p) => {
                        const Icon = p.Icon;
                        return (
                          <motion.div
                            key={p.href}
                            variants={{
                              hidden: { opacity: 0, x: 20 },
                              visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                            }}
                          >
                            <Link
                              href={p.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-white/[0.08] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${p.iconColor}`} />
                                <span>{p.label}</span>
                              </div>
                              <ProductStatusBadge status={p.status} />
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resources Group */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Resources</p>
                    <div className="grid grid-cols-1 gap-1">
                      {RESOURCES.map((r) => (
                        <motion.div
                          key={r.href}
                          variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                          }}
                        >
                          <Link
                            href={r.href}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/[0.08] transition-colors"
                          >
                            {r.label}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Company Links */}
                  <div>
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Company</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Pricing", href: "/pricing" },
                        { label: "Docs", href: "/docs" },
                        { label: "About Us", href: "/about" },
                        { label: "Careers", href: "/careers" },
                      ].map((item) => (
                        <motion.div
                          key={item.href}
                          variants={{
                            hidden: { opacity: 0, x: 20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/10 transition-colors"
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 space-y-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-zinc-200 transition-all"
                >
                  <span>Console</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for non-overlay pages to prevent content underlap */}
      <div className={hasOverlayHero ? "hidden" : "h-20"} />
    </>
  );
}