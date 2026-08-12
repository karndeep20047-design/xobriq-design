"use client";

import { useState } from "react";
import { sendContactMessage } from "./actions";

// Same 6 values xobriq.com's own contact form exposes (its VALID_INQUIRY_TYPES)
// — "press"/"security_disclosure" exist in the shared inquiries schema but
// aren't offered as a self-service option on either site's public form.
const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "contact", label: "General inquiry" },
  { value: "demo_request", label: "Request a demo" },
  { value: "pricing_inquiry", label: "Pricing question" },
  { value: "discovery_call", label: "Discovery call" },
  { value: "partnership", label: "Partnership" },
  { value: "support", label: "Support" },
];

const BUSINESS_HOURS_START = "09:00";
const BUSINESS_HOURS_END = "17:00";

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-enterprise-primary";

export function ContactForm({
  initialType,
  interest,
}: {
  initialType: string;
  interest?: string;
}) {
  const [type, setType] = useState(initialType);
  const isDemoRequest = type === "demo_request";

  return (
    <form
      action={sendContactMessage}
      className="space-y-5 rounded-3xl border border-border bg-bg-subtle p-6 sm:p-8"
    >
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0"
        aria-hidden="true"
      />

      <div>
        <label className="text-sm font-semibold">What can we help with?</label>
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Only shown/required for demo requests — a date without a time (or
          vice versa) is rejected server-side, same as an out-of-hours or
          past pick. See actions.ts's isValidSchedule(). */}
      {isDemoRequest ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">Preferred date</label>
            <input type="date" name="preferred_date" min={todayDateString()} className={inputClass} />
            <p className="mt-1 text-xs text-fg-subtle">Business days only (Mon–Fri)</p>
          </div>
          <div>
            <label className="text-sm font-semibold">Preferred time</label>
            <input
              type="time"
              name="preferred_time"
              min={BUSINESS_HOURS_START}
              max={BUSINESS_HOURS_END}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-fg-subtle">9:00 AM – 5:00 PM</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Full name" required />
        <Field name="company" label="Company" required />
        <Field name="email" label="Work email" type="email" required />
        <Field name="phone" label="Phone" required />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Interest</label>
        <select name="interest" required defaultValue={interest || ""} className={inputClass}>
          <option value="">Select…</option>
          <option value="guard">Xobriq Guard</option>
          <option value="kyc">Xobriq KYC</option>
          <option value="agentic">Agentic AI</option>
          <option value="cloud">Xobriq Cloud</option>
          <option value="consult">Xobriq Consult</option>
          <option value="cyber">Xobriq Cyber</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Message</label>
        <textarea
          name="message"
          required
          rows={5}
          maxLength={2000}
          className={inputClass}
          placeholder="Tell us about your problem…"
        />
      </div>

      <button
        type="submit"
        className="glow-hover mt-6 inline-flex w-full items-center justify-center rounded-lg bg-enterprise-primary px-6 py-3 font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
      >
        Send message
      </button>

      <p className="mt-4 text-xs text-fg-subtle">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        . We&apos;ll respond within 1 business day.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input name={name} type={type} required={required} maxLength={200} className={inputClass} />
    </div>
  );
}
