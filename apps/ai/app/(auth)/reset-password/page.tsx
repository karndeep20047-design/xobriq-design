"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { EnterpriseField } from "@/components/auth/EnterpriseField";
import { Honeypot } from "@/components/auth/Honeypot";
import { resetPasswordRequestAction } from "../actions";

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const footer = (
    <Link href="/login" className="font-bold text-enterprise-primary hover:underline">
      ← Back to sign in
    </Link>
  );

  const handleSubmit = (formData: FormData) => {
    const email = (formData.get("email") as string) || "";
    startTransition(async () => {
      await resetPasswordRequestAction(formData);
      setSubmittedEmail(email);
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="w-full max-w-[480px]">
        <AuthCard
          title="Check your inbox"
          subtitle={
            "If an account exists for " +
            (submittedEmail || "that email") +
            ", we sent a password reset link. It expires in 1 hour."
          }
          footer={footer}
        >
          <div className="text-center">
            <p className="text-sm text-enterprise-fg-muted mb-4">
              If you don&apos;t see it, check your spam folder.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs font-medium text-enterprise-primary hover:underline"
            >
              Try a different email
            </button>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px]">
      <AuthCard
        title="Reset your password"
        subtitle="Enter your work email and we will send you a reset link."
        footer={footer}
      >
        <form action={handleSubmit} className="space-y-5">
          <Honeypot />
          <EnterpriseField
            name="email"
            label="Work email"
            type="email"
            icon="email"
            placeholder="name@enterprise.com"
            required
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={isPending}
            className="glow-hover w-full rounded-lg bg-enterprise-primary px-4 py-3 text-base font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
