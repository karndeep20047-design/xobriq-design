"use client";

import { useState, useTransition, useRef } from "react";
import { CheckCircle2, Upload, Loader2 } from "lucide-react";
import { Honeypot } from "@/components/auth/Honeypot";
import { submitConsultantApplicationAction, extractCVFieldsAction } from "./consultant-actions";
import { CONSULTANT_ROLES } from "@/lib/consultant/roles";

const fieldClass =
  "input-inset w-full rounded-lg px-4 py-2.5 text-sm text-enterprise-fg outline-none placeholder:text-enterprise-fg-subtle";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-enterprise-fg-muted";

type FormFields = {
  full_name: string;
  email: string;
  phone: string;
  degree: string;
  total_years: string;
  job_background: string;
};

const EMPTY_FIELDS: FormFields = {
  full_name: "", email: "", phone: "", degree: "", total_years: "", job_background: "",
};

export function ConsultantApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [selectedRole, setSelectedRole] = useState("");
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField(key: keyof FormFields, value: string) {
    setFields((cur) => ({ ...cur, [key]: value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setExtractNote("");
    if (!file) return;

    setIsExtracting(true);
    try {
      const fd = new FormData();
      fd.append("cv_file", file);
      const result = await extractCVFieldsAction(fd);
      if (result.ok && result.fields) {
        const f = result.fields;
        setFields((cur) => ({
          full_name: cur.full_name || f.name,
          email: cur.email || f.email,
          phone: cur.phone || f.phone,
          degree: cur.degree || f.education,
          total_years: cur.total_years || f.experience_years,
          job_background: cur.job_background || f.job_background,
        }));
        setExtractNote("We've pre-filled what we could read from your CV — please check it over before submitting.");
      } else {
        setExtractNote(result.error || "Could not read this file — no problem, just fill in the fields below.");
      }
    } catch {
      setExtractNote("Could not read this file — no problem, just fill in the fields below.");
    } finally {
      setIsExtracting(false);
    }
  }

  const handleSubmit = (formData: FormData) => {
    setError("");
    if (!selectedRole) {
      setError("Select a role above before submitting.");
      return;
    }
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please attach your CV.");
      return;
    }
    formData.set("role", selectedRole);
    formData.set("cv_file", fileInputRef.current.files[0]);

    startTransition(async () => {
      const result = await submitConsultantApplicationAction(formData);
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
        <h3 className="text-xl font-semibold">Application received!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-enterprise-fg-muted">
          Our People &amp; Culture team will review your submission and reach out if there&apos;s a fit for an
          upcoming engagement.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="grid gap-6 sm:grid-cols-[280px_1fr] sm:items-start sm:gap-8">
      <Honeypot />

      {/* Roles — left column, sticky on larger screens */}
      <div className="glass-panel rounded-2xl p-5 sm:sticky sm:top-24">
        <label className={labelClass}>Role you&apos;re applying for *</label>
        <div className="mt-2 space-y-2">
          {CONSULTANT_ROLES.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => setSelectedRole(r.slug)}
              className={
                "block w-full rounded-lg border px-3.5 py-2.5 text-left text-sm transition " +
                (selectedRole === r.slug
                  ? "border-enterprise-primary bg-enterprise-primary/10 text-enterprise-primary"
                  : "border-enterprise-border bg-enterprise-bg-low text-enterprise-fg hover:border-enterprise-border-strong")
              }
            >
              <span className="font-medium">{r.title}</span>
            </button>
          ))}
        </div>
        {selectedRole ? (
          <p className="mt-3 text-xs leading-relaxed text-enterprise-fg-subtle">
            {CONSULTANT_ROLES.find((r) => r.slug === selectedRole)?.qualifications}
          </p>
        ) : null}
      </div>

      {/* Form fields — right column */}
      <div className="glass-panel space-y-5 rounded-2xl p-6 sm:p-8">
        <div>
          <label className={labelClass}>CV (PDF, DOC, or DOCX — max 5MB) *</label>
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-enterprise-border bg-enterprise-bg-low px-4 py-3">
            <Upload className="h-4 w-4 shrink-0 text-enterprise-fg-subtle" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              required
              className="w-full text-sm text-enterprise-fg file:mr-3 file:rounded-md file:border-0 file:bg-enterprise-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-enterprise-on-primary"
            />
            {isExtracting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-enterprise-primary" /> : null}
          </div>
          {extractNote ? <p className="mt-1.5 text-xs text-enterprise-fg-subtle">{extractNote}</p> : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full name *</label>
            <input
              type="text" name="full_name" required maxLength={150} autoComplete="name"
              value={fields.full_name} onChange={(e) => updateField("full_name", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email" name="email" required maxLength={200} autoComplete="email"
              value={fields.email} onChange={(e) => updateField("email", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Phone (with country code) *</label>
            <input
              type="tel" name="phone" required maxLength={20} placeholder="+254 7XX XXX XXX" autoComplete="tel"
              value={fields.phone} onChange={(e) => updateField("phone", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country of residence *</label>
            <input type="text" name="country" required maxLength={100} placeholder="Kenya" className={fieldClass} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Highest degree &amp; field *</label>
            <input
              type="text" name="degree" required maxLength={200} placeholder="MSc Information Systems"
              value={fields.degree} onChange={(e) => updateField("degree", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Institution &amp; year *</label>
            <input type="text" name="institution" required maxLength={200} placeholder="University of Nairobi, 2011" className={fieldClass} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Total years of ICT experience *</label>
            <input
              type="number" name="total_years" required min={0} max={60} placeholder="15"
              value={fields.total_years} onChange={(e) => updateField("total_years", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Years relevant to this role *</label>
            <input type="number" name="relevant_years" required min={0} max={60} placeholder="8" className={fieldClass} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Certifications held</label>
            <input type="text" name="certifications" maxLength={500} placeholder="PMP, TOGAF 9, CISSP" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Professional / ICTA registration number</label>
            <input type="text" name="registration_number" maxLength={100} placeholder="Leave blank if not applicable" className={fieldClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Portfolio / LinkedIn (optional)</label>
          <input type="text" name="portfolio_url" maxLength={300} placeholder="https://linkedin.com/in/…" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Relevant work background</label>
          <textarea
            name="job_background" rows={4} maxLength={2000}
            placeholder="Briefly describe your relevant project/consulting experience."
            value={fields.job_background} onChange={(e) => updateField("job_background", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Reference 1 — name &amp; contact *</label>
            <input type="text" name="reference_1" required maxLength={300} placeholder="Name, organisation, phone/email" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Reference 2 — name &amp; contact *</label>
            <input type="text" name="reference_2" required maxLength={300} placeholder="Name, organisation, phone/email" className={fieldClass} />
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-enterprise-fg-muted">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          <span>
            I consent to Xobriq Technologies Ltd retaining these details and referencing me as a Key Expert in bid
            submissions if selected. *
          </span>
        </label>

        {error ? <p className="text-sm text-xred-500">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending || !selectedRole}
          className="glow-hover w-full rounded-lg bg-enterprise-primary py-3 text-sm font-bold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Submitting…" : selectedRole ? "Submit application" : "Select a role to continue"}
        </button>

        <p className="text-center text-xs text-enterprise-fg-subtle">
          Applications are accepted on a rolling basis and retained for future opportunities.
        </p>
      </div>
    </form>
  );
}
