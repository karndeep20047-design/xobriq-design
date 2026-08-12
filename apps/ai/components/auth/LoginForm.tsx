"use client";

import { useState, useTransition } from "react";
import { Honeypot } from "@/components/auth/Honeypot";
import { EnterpriseField } from "@/components/auth/EnterpriseField";
import { Toast } from "@/components/auth/Toast";
import { loginAction } from "@/app/(auth)/actions";
import Link from "next/link";

type Props = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: Props) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "error"; message: string } | null>(null);

  // Fixed: proper Link component
  const forgot = (
    <Link href="/reset-password" className="text-enterprise-primary hover:underline">
      Forgot password?
    </Link>
  );

  const handleSubmit = (formData: FormData) => {
    setToast(null);
    startTransition(async () => {
      const result = await loginAction(formData);

      // loginAction only returns a value when it FAILS (on success it redirects).
      // So if we get a result here, it's an error.
      if (result && !result.ok) {
        setToast({
          type: "error",
          message: result.error || "Authentication failed. Please try again.",
        });
      }
    });
  };

  return (
    <>
      {/* Fixed: moved action to form, removed stray {handleSubmit} */}
      <form action={handleSubmit} className="space-y-5">
        <Honeypot />
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <EnterpriseField
          name="email"
          label="Email Address"
          type="email"
          icon="email"
          placeholder="name@enterprise.com"
          required
          autoComplete="email"
        />
        <EnterpriseField
          name="password"
          label="Password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          rightSlot={forgot}
        />

        <button
          type="submit"
          disabled={isPending}
          className="glow-hover mt-2 w-full rounded-lg bg-enterprise-primary px-4 py-3 text-base font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {toast ? (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
