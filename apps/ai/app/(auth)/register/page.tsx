"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { ChevronDown } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { SsoButtons } from "@/components/auth/SsoButtons";
import { EnterpriseField } from "@/components/auth/EnterpriseField";
import { Honeypot } from "@/components/auth/Honeypot";
import { registerAction } from "../actions";

const INDUSTRIES = [
  "Banking & Capital Markets",
  "Fintech & Mobile Money",
  "Insurance",
  "Telco",
  "Government / Public Sector",
  "Healthcare",
  "Retail & E-commerce",
  "Manufacturing",
  "Other",
];

type State = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export default function RegisterPage() {
  const [state, setState] = useState<State>({});
  // Controlled so a failed submission never wipes what the user already
  // typed correctly — only the field(s) that actually failed validation
  // need fixing, per the error message shown next to them.
  const [values, setValues] = useState({ fullName: "", email: "", industry: "", password: "" });

  function field(key: keyof typeof values) {
    return {
      value: values[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  async function onSubmit(formData: FormData) {
    const result = await registerAction(formData);
    setState(result);
  }

  if (state.ok) {
    const back = (<Link href="/login" className="font-bold text-enterprise-primary hover:underline">← Back to sign in</Link>);

    // Account created but the verification email itself failed to send —
    // say so, rather than promising an inbox message that never went out.
    if (state.error) {
      return (
        <div className="w-full max-w-[520px]">
          <AuthCard title="Account created" subtitle="We couldn't send the verification email just now." footer={back}>
            <p className="text-center text-sm text-enterprise-fg-muted">{state.error}</p>
          </AuthCard>
        </div>
      );
    }

    return (
      <div className="w-full max-w-[520px]">
        <AuthCard title="Check your inbox" subtitle="We sent a confirmation link to your work email. Click it to activate your account." footer={back}>
          <p className="text-center text-sm text-enterprise-fg-muted">If you don&apos;t see it, check your spam folder.</p>
        </AuthCard>
      </div>
    );
  }

  const footer = (
    <span>
      Already on Xobriq? <Link href="/login" className="font-bold text-enterprise-primary hover:underline">Log In</Link>
    </span>
  );

  return (
    <div className="w-full max-w-[560px]">
      <AuthCard title="Create your Xobriq Account" subtitle="Join the next generation of autonomous enterprise intelligence." footer={footer}>
        <SsoButtons layout="side-by-side" />
        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-enterprise-border" />
          <span className="label-caps text-enterprise-fg-subtle">Or register with work email</span>
          <span className="h-px flex-1 bg-enterprise-border" />
        </div>

        {state.error ? (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{state.error}</div>
        ) : null}

        <form action={onSubmit} className="space-y-5">
          <Honeypot />
          <EnterpriseField name="fullName" label="Full name" icon="user" placeholder="John Doe" required autoComplete="name" error={state.fieldErrors?.fullName} {...field("fullName")} />
          <EnterpriseField name="email" label="Work email" type="email" icon="email" placeholder="john@company.com" required autoComplete="email" hint="Domain must match a registered corporate entity." error={state.fieldErrors?.email} {...field("email")} />

          <div className="space-y-2">
            <label htmlFor="industry" className="label-caps ml-1 text-fg-muted">Industry selection</label>
            <div className="input-inset relative flex items-center rounded-lg px-3.5 py-2.5">
              <select
                id="industry"
                name="industry"
                required
                value={values.industry}
                onChange={(e) => setValues((v) => ({ ...v, industry: e.target.value }))}
                className="w-full appearance-none border-none bg-transparent text-sm text-enterprise-fg focus:outline-none focus:ring-0"
              >
                <option value="" disabled className="bg-enterprise-bg">Select your industry…</option>
                {INDUSTRIES.map((opt) => (<option key={opt} value={opt} className="bg-enterprise-bg">{opt}</option>))}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-enterprise-fg-subtle" />
            </div>
          </div>

          <EnterpriseField name="password" label="Password" type="password" icon="lock" placeholder="••••••••" required autoComplete="new-password" hint="12+ characters with upper, lower, number and symbol." error={state.fieldErrors?.password} {...field("password")} />

          <button type="submit" className="glow-hover mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-4 py-3 text-base font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover">
            Create Account →
          </button>

          <p className="text-center text-xs text-enterprise-fg-subtle">
            By clicking &ldquo;Create Account&rdquo; you agree to our <Link href="/terms" className="text-enterprise-primary hover:underline">User Policy</Link> and <Link href="/privacy" className="text-enterprise-primary hover:underline">Privacy Statement</Link>.
          </p>
        </form>
      </AuthCard>
    </div>
  );
}