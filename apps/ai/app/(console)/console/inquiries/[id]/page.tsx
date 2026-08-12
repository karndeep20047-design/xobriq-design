import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { inquiryDepartmentsForRole } from "@/lib/session-types";
import { getStaffAccess } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { InquiryDetailClient } from "./InquiryDetailClient";

export const metadata = { title: "Inquiry — Xobriq Console" };

export default async function InquiryDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  // Support rows are reached through a different permission (support) than
  // regular inquiries (inquiries) — which one applies depends on the row
  // itself, so the permission check happens after the fetch below rather
  // than gating the whole page on a single fixed key up front.
  const staff = await requireStaff();
  const access = await getStaffAccess(staff.id);
  const admin = createAdminClient();

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!inquiry) notFound();

  // 404 rather than 403 so the inquiry's existence isn't confirmed to a
  // caller who shouldn't see it — same reasoning for both branches below.
  if (inquiry.type === "support") {
    if (!access?.isSuperAdmin && !access?.permissions.support) notFound();
  } else {
    if (!access?.isSuperAdmin && !access?.permissions.inquiries) notFound();

    // The list page's department filter alone wouldn't stop someone from
    // opening another department's inquiry by guessing/pasting its URL —
    // this is what actually closes that gap. Doesn't apply to support rows
    // (bypassed above), which aren't part of the department model.
    const departments = inquiryDepartmentsForRole(staff.xobriq_staff_role);
    if (departments !== "all" && !departments.includes(inquiry.department)) {
      notFound();
    }
  }

  const { data: salesTeam } = await admin
    .from("profiles")
    .select("id, full_name, email, xobriq_staff_role")
    .in("xobriq_staff_role", [
      "super_admin", "content_admin", "marketing_head", "finance_hr", "product_manager",
    ]);

  const { data: replyRows } = await admin
    .from("inquiry_replies")
    .select("id, message, sent_by, created_at")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: true });

  const senderIds = Array.from(new Set((replyRows || []).map((r) => r.sent_by).filter(Boolean)));
  const senderNameById: Record<string, string> = {};
  if (senderIds.length > 0) {
    const { data: senders } = await admin.from("profiles").select("id, full_name, email").in("id", senderIds);
    (senders || []).forEach((s) => { senderNameById[s.id] = s.full_name || s.email; });
  }

  const replies = (replyRows || []).map((r) => ({
    id: r.id,
    message: r.message,
    created_at: r.created_at,
    sender_name: r.sent_by ? senderNameById[r.sent_by] || "Staff" : "Staff",
  }));

  return (
    <InquiryDetailClient
      inquiry={inquiry as any}
      salesTeam={(salesTeam || []) as any}
      replies={replies}
    />
  );
}
