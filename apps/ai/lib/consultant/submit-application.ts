// apps/ai/lib/consultant/submit-application.ts
//
// Core "submit a Key Expert roster application" logic, extracted out of the
// original Server Action so it can be called identically from:
//   - the Server Action in app/(public)/careers/consultant-actions.ts
//     (xobriq.ai's own /careers page)
//   - the REST route in app/api/careers/consultant-application/route.ts
//     (called cross-origin from xobriq.com)
// One implementation, one place to patch when something needs fixing —
// nothing about validation, storage, or email logic differs by caller.
import { randomUUID } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInquiryMails } from "@/lib/email/send-inquiry-mails";
import { classifyDepartment } from "@/lib/email/routing";
import { ConsultantApplicationSchema, type ConsultantApplicationData } from "./schema";
import { validateUploadedCV, FileValidationError } from "./file-validation";
import { consultantRoleTitle } from "./roles";

const CV_BUCKET = "consultant-cvs";
const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// NOTE: no rate limiting on this endpoint yet — deliberately deferred
// pending Vercel KV/Upstash being set up. Now that both xobriq.ai's own page
// and xobriq.com's page funnel through this single function, this is the
// one chokepoint to add it to when it's ready — not two.

export type SubmitConsultantApplicationResult = { ok: boolean; error?: string };

export type SubmitContext = {
  sourceSite: "xobriq.ai" | "xobriq.com";
  sourcePage: string;
  ip: string | null;
  userAgent: string | null;
};

function composeConsultantMessage(data: ConsultantApplicationData, roleTitle: string): string {
  const lines = [
    "Expert Roster application — apply for: " + roleTitle,
    "",
    "COUNTRY OF RESIDENCE: " + data.country,
    "DEGREE / FIELD: " + data.degree,
    "INSTITUTION / YEAR: " + data.institution,
    "TOTAL ICT EXPERIENCE: " + data.total_years + " years",
    "RELEVANT EXPERIENCE: " + data.relevant_years + " years",
  ];
  if (data.certifications) lines.push("CERTIFICATIONS: " + data.certifications);
  if (data.registration_number) lines.push("REGISTRATION NUMBER: " + data.registration_number);
  if (data.portfolio_url) lines.push("PORTFOLIO / LINKEDIN: " + data.portfolio_url);
  if (data.job_background) lines.push("", "RELEVANT BACKGROUND:", data.job_background);
  lines.push("", "REFERENCE 1: " + data.reference_1);
  lines.push("REFERENCE 2: " + data.reference_2);
  lines.push("", "CV attached — view and download from the console.");
  return lines.join("\n");
}

export async function submitConsultantApplication(
  formData: FormData,
  ctx: SubmitContext
): Promise<SubmitConsultantApplicationResult> {
  const raw = Object.fromEntries(formData.entries());

  // Honeypot: silently succeed for bots
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { ok: true };
  }

  const parsed = ConsultantApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const data = parsed.data;

  const file = formData.get("cv_file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please attach your CV" };
  }

  let validatedFile;
  try {
    validatedFile = await validateUploadedCV(file);
  } catch (err) {
    if (err instanceof FileValidationError) return { ok: false, error: err.message };
    return { ok: false, error: "Could not process the uploaded file" };
  }

  const admin = createAdminClient();

  // Our own generated key — never derived from the client's filename, so
  // path traversal / double-extension tricks in the original name have no
  // effect on where or how this ends up stored.
  const storagePath = "applications/" + randomUUID() + "." + validatedFile.extension;

  const { error: uploadError } = await admin.storage.from(CV_BUCKET).upload(storagePath, validatedFile.buffer, {
    contentType: CONTENT_TYPES[validatedFile.extension],
    upsert: false,
  });

  if (uploadError) {
    console.error("[consultant-application] upload error:", uploadError.message);
    return { ok: false, error: "Failed to upload CV. Please try again." };
  }

  const roleTitle = consultantRoleTitle(data.role);
  const normalizedPhone = parsePhoneNumberFromString(data.phone)?.number || data.phone;
  const message = composeConsultantMessage(data, roleTitle);

  // "consultant_application" is a routing-only signal (see routing.ts) — it
  // steers this to partnerships@xobriq.com instead of HR, but is never
  // written to the inquiries.type column (that stays "contact" below).
  const department = classifyDepartment({ type: "consultant_application", message, interested_products: null });

  const { data: inserted, error: insertError } = await admin
    .from("inquiries")
    .insert({
      type: "contact",
      source_site: ctx.sourceSite,
      source_page: ctx.sourcePage,
      full_name: data.full_name,
      email: data.email,
      phone: normalizedPhone,
      message,
      department,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      metadata: {
        application_kind: "consultant_roster",
        role: data.role,
        role_title: roleTitle,
        country: data.country,
        degree: data.degree,
        institution: data.institution,
        total_years: data.total_years,
        relevant_years: data.relevant_years,
        certifications: data.certifications || null,
        registration_number: data.registration_number || null,
        portfolio_url: data.portfolio_url || null,
        reference_1: data.reference_1,
        reference_2: data.reference_2,
        cv_storage_path: storagePath,
      },
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[consultant-application] insert error:", insertError?.message);
    // Don't leave an orphaned CV in storage with no application record.
    await admin.storage.from(CV_BUCKET).remove([storagePath]);
    return { ok: false, error: "Failed to submit. Please try again." };
  }

  admin
    .from("audit_logs")
    .insert({
      action: "inquiry.created",
      resource_type: "inquiry",
      resource_id: inserted.id,
      metadata: { type: "consultant_roster", role: data.role, email: data.email },
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
    })
    .then(() => null, () => null);

  const consoleUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") + "/console/inquiries/" + inserted.id;

  try {
    await sendInquiryMails({
      id: inserted.id,
      type: "consultant_application",
      source_site: ctx.sourceSite,
      source_page: ctx.sourcePage,
      full_name: data.full_name,
      email: data.email,
      company: null,
      phone: normalizedPhone,
      industry: null,
      message,
      interest: null,
      interested_products: null,
      budget_range: null,
      urgency: null,
      ip_address: ctx.ip,
      consoleUrl,
    });
  } catch (err) {
    console.error(
      "[consultant-application] sendInquiryMails failed:",
      err instanceof Error ? err.message : String(err)
    );
  }

  return { ok: true };
}
