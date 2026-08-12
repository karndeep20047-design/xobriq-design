"use client";

import { useEffect, useRef } from "react";

// Hidden from real users but present for bots that fill every field
// indiscriminately — every *Action() in app/(auth)/actions.ts and several
// other forms treat any non-empty value here as a bot and silently no-op
// the whole submission (no error shown, nothing created, nothing sent).
// Browser/password-manager autofill can populate a field literally named
// "website" purely by name-matching, even while it's visually hidden —
// that false positive produces exactly this symptom: a normal signup shows
// the success screen but nothing actually happens. Clearing it once after
// mount (page-load autofill) and again on submit (fill-on-interaction
// autofill) removes that false positive without weakening the trap against
// real bots, which fill the field at submit time regardless.
export function Honeypot() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;

    const clear = () => { input.value = ""; };
    const t = setTimeout(clear, 300);
    const form = input.closest("form");
    form?.addEventListener("submit", clear);

    return () => {
      clearTimeout(t);
      form?.removeEventListener("submit", clear);
    };
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -left-[9999px] h-0 w-0"
    />
  );
}