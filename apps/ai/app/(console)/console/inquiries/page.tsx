import { inquiryDepartmentsForRole } from "@/lib/session-types";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { InquiriesListClient } from "./InquiriesListClient";

export const metadata = { title: "Inquiries — Xobriq Console" };

export default async function InquiriesPage() {
  const { user: staff } = await requireStaffPermission("inquiries");
  const admin = createAdminClient();

  const departments = inquiryDepartmentsForRole(staff.xobriq_staff_role);

  let query = admin
    .from("inquiries")
    .select("id, type, department, source_site, source_page, full_name, email, company, phone, industry, message, urgency, status, assigned_to, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  // Server-side filter, not a display-only default — HR and sales/marketing
  // genuinely cannot query each other's inquiries (see inquiryDepartmentsForRole).
  if (departments !== "all") {
    query = query.in("department", departments);
  }

  const { data: inquiries } = await query;

  return <InquiriesListClient inquiries={(inquiries || []) as any} />;
}
