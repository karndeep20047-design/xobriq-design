"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Honeypot } from "@/components/auth/Honeypot";
import { submitCareerApplicationAction } from "./actions";
import { TEAMS } from "./teams";

const fieldClass =
  "input-inset w-full rounded-lg px-4 py-2.5 text-sm text-enterprise-fg outline-none placeholder:text-enterprise-fg-subtle";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-enterprise-fg-muted";

export function CareerApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const result = await submitCareerApplicationAction(formData);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error || "Failed to submit. Please try again.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-enterprise-primary/10 text-enterprise-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-semibold">Thanks for reaching out!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-enterprise-fg-muted">
          Our People &amp; Culture team will review your submission and reach out when a role matches your background.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="glass-panel space-y-5 rounded-2xl p-6 sm:p-8">
      <Honeypot />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Full name *</label>
          <input type="text" name="full_name" required autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" name="email" required autoComplete="email" className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone *</label>
          <input type="tel" name="phone" required placeholder="+254 7XX XXX XXX" autoComplete="tel" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Current company *</label>
          <input type="text" name="current_company" required autoComplete="organization" className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Team of interest *</label>
          <select name="team" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select a team…</option>
            {TEAMS.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Years of experience *</label>
          <select name="years" required defaultValue="" className={fieldClass}>
            <option value="" disabled>Select…</option>
            <option value="0-2">0 – 2 years</option>
            <option value="3-5">3 – 5 years</option>
            <option value="6-10">6 – 10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>LinkedIn *</label>
          <input type="url" name="linkedin" required placeholder="https://linkedin.com/in/…" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Portfolio / GitHub *</label>
          <input type="url" name="portfolio" required placeholder="https://github.com/…" className={fieldClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Experience summary *</label>
        <textarea
          name="experience"
          required
          minLength={20}
          rows={4}
          placeholder="Briefly describe your relevant experience, current role, and what you're looking for next."
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass}>Anything else? *</label>
        <textarea name="message" required rows={3} placeholder="Anything else we should know?" className={fieldClass} />
      </div>

      {error ? <p className="text-sm text-xred-500">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="glow-hover w-full rounded-lg bg-enterprise-primary py-3 text-sm font-bold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Submit application"}
      </button>

      <p className="text-center text-xs text-enterprise-fg-subtle">
        Your submission goes directly to our HR team. We respond within 5 business days.
      </p>
    </form>
  );
}
