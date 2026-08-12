"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EnterpriseField } from "@/components/auth/EnterpriseField";
import { Honeypot } from "@/components/auth/Honeypot";
import { Toast } from "@/components/auth/Toast";
import { completePasswordResetAction } from "@/app/(auth)/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "error"; message: string } | null>(null);

  const handleSubmit = (formData: FormData) => {
    setToast(null);
    startTransition(async () => {
      const result = await completePasswordResetAction(formData);
      if (result.ok) {
        router.push("/login?passwordReset=1");
      } else {
        setToast({
          type: "error",
          message: result.error || "Failed to reset password.",
        });
      }
    });
  };

  return (
    <>
      <form action={handleSubmit} className="space-y-5">
        <Honeypot />
        <input type="hidden" name="token" value={token} />

        <EnterpriseField
          name="password"
          label="New password"
          type="password"
          icon="lock"
          placeholder="At least 12 characters"
          required
          autoComplete="new-password"
          hint="12+ characters. Include upper, lower, number, and symbol."
        />

        <EnterpriseField
          name="passwordConfirm"
          label="Confirm new password"
          type="password"
          icon="lock"
          placeholder="Re-enter password"
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={isPending}
          className="glow-hover w-full rounded-lg bg-enterprise-primary px-4 py-3 text-base font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Updating..." : "Update password"}
        </button>

        <p className="text-center text-xs text-enterprise-fg-subtle">
          After updating, you will be signed out of all other devices and prompted to sign in with your new password.
        </p>
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
