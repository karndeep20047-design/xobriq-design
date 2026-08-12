// apps/ai/lib/consultant/extract-fields.ts
//
// Core "best-effort pre-fill from an uploaded CV" logic, extracted for the
// same reason as submit-application.ts — one implementation shared by the
// Server Action (xobriq.ai's own page) and the REST route (xobriq.com).
// Re-validates and re-parses independently of the final submission — never
// trusts a client-held copy of "what this file contains".
import { validateUploadedCV, FileValidationError } from "./file-validation";
import { extractCVText, extractFieldsFromText } from "./resume-parser";

export type ExtractCVFieldsResult = {
  ok: boolean;
  fields?: Record<string, string>;
  error?: string;
};

export async function extractCVFields(formData: FormData): Promise<ExtractCVFieldsResult> {
  const file = formData.get("cv_file") as File | null;
  if (!file) return { ok: false, error: "No file provided" };

  try {
    const validated = await validateUploadedCV(file);
    const text = await extractCVText(validated.buffer, validated.extension);
    const fields = extractFieldsFromText(text);
    return {
      ok: true,
      fields: {
        name: fields.name || "",
        email: fields.email || "",
        phone: fields.phone || "",
        education: fields.education || "",
        experience_years: fields.experienceYears?.toString() || "",
        job_background: fields.jobBackground || "",
      },
    };
  } catch (err) {
    if (err instanceof FileValidationError) return { ok: false, error: err.message };
    console.error("[consultant-cv] extraction error:", err instanceof Error ? err.message : String(err));
    return { ok: false, error: "Could not read this file" };
  }
}
