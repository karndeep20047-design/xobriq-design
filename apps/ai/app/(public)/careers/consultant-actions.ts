// apps/ai/app/(public)/careers/consultant-actions.ts
"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/session";
import { inquiryDepartmentsForRole } from "@/lib/session-types";
import { extractCVFields, type ExtractCVFieldsResult } from "@/lib/consultant/extract-fields";
import {
  submitConsultantApplication,
  type SubmitConsultantApplicationResult,
} from "@/lib/consultant/submit-application";

const CV_BUCKET = "consultant-cvs";

// Both actions below are thin wrappers over the shared lib/consultant/*
// functions — the actual validation/storage/email logic lives there so it's
// identical for xobriq.ai's own /careers page and the REST routes under
// app/api/careers/* that xobriq.com calls cross-origin. Nothing here should
// re-implement any of that logic — only the headers()/request-context glue
// that a Server Action needs and a Route Handler gets differently.

// ─── Pre-fill: extract best-effort fields from an uploaded CV ──────────────
export async function extractCVFieldsAction(formData: FormData): Promise<ExtractCVFieldsResult> {
  return extractCVFields(formData);
}

// ─── Submit the application ────────────────────────────────────────────────
export async function submitConsultantApplicationAction(
  formData: FormData
): Promise<SubmitConsultantApplicationResult> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = hdrs.get("user-agent") || null;

  return submitConsultantApplication(formData, {
    sourceSite: "xobriq.ai",
    sourcePage: "/careers#expert-roster",
    ip,
    userAgent,
  });
}

// ─── HR-only: generate a short-lived signed URL to view/download a CV ──────
// Never a persistent public link — generated fresh, on demand, only for
// staff whose role already has access to this inquiry's department.
export async function getConsultantCVDownloadUrlAction(
  inquiryId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const staff = await requireRole(["super_admin", "content_admin", "marketing_head", "finance_hr", "product_manager"]);
  const admin = createAdminClient();

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("department, metadata")
    .eq("id", inquiryId)
    .maybeSingle();

  if (!inquiry) return { ok: false, error: "Not found" };

  const departments = inquiryDepartmentsForRole(staff.xobriq_staff_role);
  if (departments !== "all" && !departments.includes(inquiry.department)) {
    return { ok: false, error: "Not authorized" };
  }

  const storagePath = (inquiry.metadata as Record<string, unknown> | null)?.cv_storage_path;
  if (typeof storagePath !== "string") return { ok: false, error: "No CV attached to this application" };

  const { data: signed, error } = await admin.storage.from(CV_BUCKET).createSignedUrl(storagePath, 300); // 5 minutes
  if (error || !signed) return { ok: false, error: "Could not generate download link" };

  return { ok: true, url: signed.signedUrl };
}
