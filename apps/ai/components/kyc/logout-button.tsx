"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setConfirming(true)}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>

      {confirming && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => !pending && setConfirming(false)}
            >
              <div
                className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <LogOut className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-base font-semibold text-foreground">Log out?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to log out of your XOBRIQ KYC account?
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
                    No
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => startTransition(() => logoutAction())}
                  >
                    {pending ? "Logging out…" : "Yes, log out"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
