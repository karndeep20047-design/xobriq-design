// apps/ai/app/(public)/contact/actions.ts
"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInquiryMails } from "@/lib/email/send-inquiry-mails";
import { classifyDepartment } from "@/lib/email/routing";

// Kept in sync with app/api/inquiries/route.ts's InquirySchema "type" enum
const INQUIRY_TYPES = [
  "contact",
  "demo_request",
  "pricing_inquiry",
  "discovery_call",
  "partnership",
  "press",
  "security_disclosure",
  "support",
] as const;

const ContactSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().min(7, "Enter a valid phone number").max(40),
  interest: z.enum(["guard", "kyc", "agentic", "cloud", "consult", "cyber", "other"]),
  message: z.string().min(3).max(2000),
  // Now a real, visible "reason for contact" dropdown on the form itself
  // (ContactForm.tsx) rather than a hidden field only set from a segmented
  // CTA — always present.
  type: z.enum(INQUIRY_TYPES),
  // Only meaningful (and only rendered) when type === "demo_request" —
  // validated together by isValidSchedule() below.
  preferred_date: z.string().max(20).optional(),
  preferred_time: z.string().max(20).optional(),
  website: z.string().optional(), // honeypot
});

// Demo-scheduling constraints — business days (Mon–Fri), 9am–5pm, and not in
// the past. Mirrors xobriq.com's client-side utils/validation.js exactly,
// re-implemented here since this form has no separate fetch/JSON step to
// validate before — the Server Action itself is the real backend boundary.
const BUSINESS_HOURS_START = "09:00";
const BUSINESS_HOURS_END = "17:00";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Built from explicit numeric parts (not a template string passed to `new
// Date(...)`) so parsing is unambiguous local time regardless of runtime.
function dateFromParts(dateStr: string, timeStr: string): Date | null {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = (timeStr || "0:0").split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
}

function isBusinessDay(dateStr: string): boolean {
  const d = dateFromParts(dateStr, "00:00");
  if (!d) return false;
  const day = d.getDay(); // 0=Sun ... 6=Sat
  return day >= 1 && day <= 5;
}

function isBusinessHour(timeStr: string): boolean {
  const minutes = timeToMinutes(timeStr);
  return minutes >= timeToMinutes(BUSINESS_HOURS_START) && minutes <= timeToMinutes(BUSINESS_HOURS_END);
}

// Date+time are optional as a pair — empty is valid (no preference given,
// staff will follow up to schedule). But one without the other, or either
// failing the weekday/business-hours/future rules, is not.
function isValidSchedule(dateStr?: string, timeStr?: string): boolean {
  const hasDate = !!dateStr;
  const hasTime = !!timeStr;
  if (!hasDate && !hasTime) return true;
  if (!hasDate || !hasTime) return false;
  if (!isBusinessDay(dateStr!)) return false;
  if (!isBusinessHour(timeStr!)) return false;

  const candidate = dateFromParts(dateStr!, timeStr!);
  return !!candidate && candidate.getTime() > Date.now();
}

function interestToProduct(interest: string): string | null {
  switch (interest) {
    case "guard": return "Xobriq Guard";
    case "kyc": return "Xobriq KYC";
    case "agentic": return "Agentic AI";
    case "cloud": return "Xobriq Cloud";
    case "consult": return "Xobriq Consult";
    case "cyber": return "Xobriq Cyber";
    default: return null;
  }
}

export async function sendContactMessage(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  // Honeypot: silently succeed for bots
  if (typeof raw.website === "string" && raw.website.length > 0) {
    redirect("/contact?sent=1");
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/contact?error=invalid");
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = hdrs.get("user-agent") || null;

  if (
    parsed.data.type === "demo_request" &&
    !isValidSchedule(parsed.data.preferred_date, parsed.data.preferred_time)
  ) {
    redirect("/contact?error=invalid_schedule");
  }

  const product = interestToProduct(parsed.data.interest);
  // `type` now comes directly from the form's own visible "reason for
  // contact" dropdown (ContactForm.tsx) — no more deriving it from the
  // product-interest select.
  const type = parsed.data.type;
  // See the department comment in app/api/inquiries/route.ts — same
  // classifyDepartment() call, computed independently at this insert path.
  const department = classifyDepartment({
    type,
    message: parsed.data.message,
    interested_products: product ? [product] : [],
  });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inquiries")
    .insert({
      type,
      source_site: "xobriq.ai",
      source_page: "/contact",
      full_name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      phone: parsed.data.phone,
      message: parsed.data.message,
      interested_products: product ? [product] : [],
      // preferred_date/preferred_time have no dedicated column — ride inside
      // metadata, same as app/api/inquiries/route.ts already does for
      // xobriq.com submissions, so InquiryDetailClient.tsx's existing
      // preferredWhen display picks these up regardless of which site an
      // inquiry came from.
      metadata: {
        interest: parsed.data.interest,
        ...(parsed.data.preferred_date ? { preferred_date: parsed.data.preferred_date } : {}),
        ...(parsed.data.preferred_time ? { preferred_time: parsed.data.preferred_time } : {}),
      },
      department,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[contact] insert error:", error?.message);
    redirect("/contact?error=save_failed");
  }

  // Audit
  admin.from("audit_logs").insert({
    action: "inquiry.created",
    resource_type: "inquiry",
    resource_id: data.id,
    metadata: {
      type,
      source_site: "xobriq.ai",
      email: parsed.data.email,
    },
    ip_address: ip,
    user_agent: userAgent,
  }).then(() => null, () => null);

  // Send emails (blocking here so redirect only fires after mails attempt)
  const consoleUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") +
    "/console/inquiries/" +
    data.id;

  await sendInquiryMails({
    id: data.id,
    type,
    source_site: "xobriq.ai",
    source_page: "/contact",
    full_name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    phone: parsed.data.phone || null,
    industry: null,
    message: parsed.data.message,
    interest: parsed.data.interest,
    interested_products: product ? [product] : null,
    budget_range: null,
    preferred_date: parsed.data.preferred_date || null,
    preferred_time: parsed.data.preferred_time || null,
    urgency: null,
    ip_address: ip,
    consoleUrl,
  });

  redirect("/contact?sent=1");
}