"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "xobriq-cookie-consent";

type Consent = "accepted" | "declined";

function getStoredConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

function setStoredConsent(choice: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
    document.cookie = `xobriq_cookie_consent=${choice}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore storage errors
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() !== null) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const decide = (choice: Consent) => {
    setStoredConsent(choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 inset-x-4 z-[100] mx-auto max-w-lg pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:max-w-md"
        >
          <div className="flex items-center justify-between gap-3 rounded-xl border border-x-line bg-x-bg/95 p-3.5 shadow-2xl backdrop-blur-xl text-x-fg dark:border-white/20 dark:shadow-[0_12px_40px_rgba(200,210,225,0.14),0_2px_12px_rgba(255,255,255,0.08)] sm:p-4">
            <div className="flex items-center gap-3 min-w-0">
              <Cookie className="h-5 w-5 shrink-0 text-x-accent" aria-hidden="true" />
              <p className="text-xs sm:text-sm leading-normal text-x-muted">
                We use cookies to improve your experience and analyze traffic.{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-x-fg underline underline-offset-2 hover:text-x-accent"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="self-stretch flex items-center justify-center shrink-0 rounded-md bg-[#0072c4] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#005ea2] active:scale-95 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
