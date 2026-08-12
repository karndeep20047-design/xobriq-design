import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { InquiriesListClient } from "../inquiries/InquiriesListClient";

export const metadata = { title: "Support — Xobriq Console" };

// Support requests are ordinary `inquiries` rows (type = "support") — see
// app/(kyc)/dashboard/xobriqKYC/support/actions.ts, which deliberately
// reuses that table/pipeline instead of a dedicated schema. This view is
// gated on the `support` permission specifically, independent of the
// `inquiries` department system entirely (a support-only agent doesn't
// need — and by default won't have — access to regular sales/HR inquiries).
export default async function SupportPage() {
  await requireStaffPermission("support");
  const admin = createAdminClient();

  const { data: inquiries } = await admin
    .from("inquiries")
    .select("id, type, department, source_site, source_page, full_name, email, company, phone, industry, message, urgency, status, assigned_to, created_at")
    .eq("type", "support")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <InquiriesListClient
      inquiries={(inquiries || []) as any}
      eyebrow="Support"
      title="Support Inbox"
      description="Support requests submitted from the KYC client dashboard."
    />
  );
}
