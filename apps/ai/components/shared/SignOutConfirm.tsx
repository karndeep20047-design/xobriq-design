"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

// Shared by the client dashboard and internal console — both want the same
// "are you sure?" confirmation before a real sign-out, not just a one-click
// form submit. Parameterized by className since the two shells (and the
// console's own desktop-vs-mobile-drawer placements) each style the
// trigger button slightly differently.
export function SignOutConfirm({
  wrapperClassName = "border-t border-border p-3",
  triggerClassName,
  iconClassName = "h-3.5 w-3.5",
  label = "Sign out",
}: {
  wrapperClassName?: string;
  triggerClassName: string;
  iconClassName?: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={triggerClassName}
      >
        <LogOut className={iconClassName} /> {label}
      </button>

      {confirming && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => !pending && setConfirming(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <LogOut className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-base font-semibold text-fg">Sign out?</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Are you sure you want to sign out of your Xobriq account?
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirming(false)}
                    className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-fg transition hover:bg-bg-elevated disabled:opacity-60"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => logoutAction())}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {pending ? "Signing out…" : "Yes, sign out"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
