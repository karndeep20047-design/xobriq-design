// apps/ai/app/(public)/careers/actions.ts
"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isValidPhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInquiryMails } from "@/lib/email/send-inquiry-mails";
import { classifyDepartment } from "@/lib/email/routing";
import { TEAMS } from "./teams";

const TEAM_NAMES = TEAMS.map((t) => t.name) as [string, ...string[]];
const YEARS_BRACKETS = ["0-2", "3-5", "6-10", "10+"] as const;

const CareerApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number, including country code"),
  current_company: z.string().trim().min(2, "Enter your current company").max(200),
  team: z.enum(TEAM_NAMES, { message: "Select a team" }),
  years: z.enum(YEARS_BRACKETS, { message: "Select your years of experience" }),
  linkedin: z.string().trim().url("Enter a valid LinkedIn URL").max(300),
  portfolio: z.string().trim().url("Enter a valid portfolio/GitHub URL").max(300),
  experience: z.string().trim().min(20, "Briefly describe your relevant experience").max(3000),
  message: z.string().trim().min(1, "This field is required").max(2000),
  website: z.string().optional(), // honeypot
});

function composeMessage(data: z.infer<typeof CareerApplicationSchema>): string {
  return [
    "Careers application — talent network signup.",
    "",
    "INTERESTED TEAM: " + data.team,
    "YEARS OF EXPERIENCE: " + data.years,
    "LINKEDIN: " + data.linkedin,
    "PORTFOLIO / GITHUB: " + data.portfolio,
    "",
    "EXPERIENCE SUMMARY:",
    data.experience,
    "",
    "MESSAGE:",
    data.message,
  ].join("\n");
}

export async function submitCareerApplicationAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const raw = Object.fromEntries(formData.entries());

  // Honeypot: silently succeed for bots
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { ok: true };
  }

  const parsed = CareerApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = hdrs.get("user-agent") || null;

  // composeMessage() deliberately opens with "Careers application — talent
  // network signup" and includes "talent"/"team" wording — that's what makes
  // classifyDepartment() (via HR_KEYWORDS in lib/email/routing.ts) reliably
  // classify this as "hr" despite `type` being the generic "contact" value.
  // Same classifyDepartment() call as app/api/inquiries/route.ts, computed
  // independently here.
  const message = composeMessage(parsed.data);
  const department = classifyDepartment({ type: "contact", message, interested_products: null });
  const normalizedPhone = parsePhoneNumberFromString(parsed.data.phone)?.number || parsed.data.phone;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inquiries")
    .insert({
      type: "contact",
      source_site: "xobriq.ai",
      source_page: "/careers",
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: normalizedPhone,
      company: parsed.data.current_company,
      message,
      department,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[careers] insert error:", error?.message);
    return { ok: false, error: "Failed to submit. Please try again." };
  }

  admin
    .from("audit_logs")
    .insert({
      action: "inquiry.created",
      resource_type: "inquiry",
      resource_id: data.id,
      metadata: { type: "contact", source_site: "xobriq.ai", email: parsed.data.email },
      ip_address: ip,
      user_agent: userAgent,
    })
    .then(() => null, () => null);

  const consoleUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") +
    "/console/inquiries/" +
    data.id;

  try {
    await sendInquiryMails({
      id: data.id,
      type: "contact",
      source_site: "xobriq.ai",
      source_page: "/careers",
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      company: parsed.data.current_company,
      phone: normalizedPhone,
      industry: null,
      message,
      interest: null,
      interested_products: null,
      budget_range: null,
      urgency: null,
      ip_address: ip,
      consoleUrl,
    });
  } catch (err) {
    console.error("[careers] sendInquiryMails failed:", err instanceof Error ? err.message : String(err));
  }

  return { ok: true };
}
