"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInquiryMails } from "@/lib/email/send-inquiry-mails";
import { classifyDepartment } from "@/lib/email/routing";

const SupportRequestSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(3).max(2000),
  urgency: z.enum(["low", "normal", "high", "critical"]).default("normal"),
});

// Reuses the existing public inquiries pipeline (same table, same email
// infra as app/(public)/contact/actions.ts) rather than a bespoke ticketing
// system — "support" is already a real inquiry `type` the console's
// Inquiries page understands, so a request submitted here shows up there for
// real, with real staff visibility, instead of vanishing into a fake list.
export async function submitKycSupportRequestAction(formData: FormData) {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/support");
  if (!user.default_org_id) {
    return { ok: false, error: "No organization on this account." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = SupportRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", user.default_org_id)
    .single();

  const department = classifyDepartment({ type: "support", message: parsed.data.message });
  const fullMessage = `${parsed.data.subject}\n\n${parsed.data.message}`;

  const { data, error } = await admin
    .from("inquiries")
    .insert({
      type: "support",
      source_site: "xobriq.ai",
      source_page: "/dashboard/xobriqKYC/support",
      full_name: user.full_name || user.email,
      email: user.email,
      company: org?.name || null,
      message: fullMessage,
      urgency: parsed.data.urgency,
      department,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Failed to submit request." };
  }

  const consoleUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app") +
    "/console/inquiries/" +
    data.id;

  await sendInquiryMails({
    id: data.id,
    type: "support",
    source_site: "xobriq.ai",
    source_page: "/dashboard/xobriqKYC/support",
    full_name: user.full_name || user.email,
    email: user.email,
    company: org?.name || null,
    message: fullMessage,
    urgency: parsed.data.urgency,
    consoleUrl,
  });

  revalidatePath("/dashboard/xobriqKYC/support");
  return { ok: true };
}
