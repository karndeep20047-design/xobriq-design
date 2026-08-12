"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { acceptInviteAction } from "./actions";

export function AcceptInviteClient({
  token,
  email,
  roleLabel,
}: {
  token: string;
  email: string;
  roleLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Image src="/xobriq-logo.png" alt="Xobriq" width={140} height={40} className="h-10 w-auto object-contain" />
        </div>

        <div className="rounded-2xl border border-border bg-bg-subtle p-8">
          <p className="text-xs uppercase tracking-widest text-enterprise-accent">Welcome to Xobriq</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Set up your account</h1>
          <p className="mt-2 text-sm text-fg-muted">
            You&apos;ve been invited as <span className="font-semibold text-fg">{roleLabel}</span>. Set a password to activate <span className="text-fg">{email}</span>.
          </p>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
          ) : null}

          <form
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const result = await acceptInviteAction(fd);
                if (result && !result.ok) setError(result.error || "Failed to accept invitation");
              });
            }}
            className="mt-6 space-y-4"
          >
            <input type="hidden" name="token" value={token} />

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Full name</label>
              <input
                name="full_name"
                required
                placeholder="Everlyne Mbithuka"
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={12}
                placeholder="At least 12 characters"
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-enterprise-primary px-4 py-3 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:opacity-50"
            >
              {isPending ? "Creating account..." : "Accept & sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-fg-muted">
            Already have an account? <a href="/login" className="text-enterprise-primary hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}