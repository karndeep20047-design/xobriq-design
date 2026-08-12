"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/session";
import { inquiryDepartmentsForRole, type StaffProfile } from "@/lib/session-types";
import { getStaffAccess, type StaffAccess } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendInquiryReplyEmail } from "@/lib/email/send-inquiry-reply";

// Same permission-resolution split as the detail page: a support-type row
// is gated on the `support` permission, independent of the department
// system entirely; every other inquiry keeps the existing department
// boundary. Throws (rather than returning a boolean) so every call site
// below fails closed the same way requireRole() used to.
async function requireInquiryWriteAccess(
  admin: ReturnType<typeof createAdminClient>,
  id: string
): Promise<{ staff: StaffProfile; access: StaffAccess }> {
  const staff = await requireStaff();
  const access = await getStaffAccess(staff.id);
  if (!access) throw new Error("Not authorized");

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("type, department")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) throw new Error("Inquiry not found");

  if (inquiry.type === "support") {
    if (!access.isSuperAdmin && !access.permissions.support) {
      throw new Error("Not authorized to modify this inquiry");
    }
    return { staff, access };
  }

  if (!access.isSuperAdmin && !access.permissions.inquiries) {
    throw new Error("Not authorized to modify this inquiry");
  }

  const departments = inquiryDepartmentsForRole(staff.xobriq_staff_role);
  if (departments !== "all" && !departments.includes(inquiry.department)) {
    throw new Error("Not authorized to modify this inquiry");
  }

  return { staff, access };
}

export async function updateInquiryStatusAction(id: string, status: string) {
  const admin = createAdminClient();
  let staff: StaffProfile;
  try {
    ({ staff } = await requireInquiryWriteAccess(admin, id));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }

  const updates: any = { status };
  if (status === "contacted") updates.responded_at = new Date().toISOString();

  await admin.from("inquiries").update(updates).eq("id", id);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "inquiry.status_changed",
    resource_type: "inquiry",
    resource_id: id,
    metadata: { new_status: status },
  });

  revalidatePath("/console/inquiries");
  revalidatePath("/console/inquiries/" + id);
  return { ok: true };
}

export async function assignInquiryAction(id: string, userId: string | null) {
  const admin = createAdminClient();
  let staff: StaffProfile;
  try {
    ({ staff } = await requireInquiryWriteAccess(admin, id));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }

  await admin.from("inquiries").update({ assigned_to: userId }).eq("id", id);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "inquiry.assigned",
    resource_type: "inquiry",
    resource_id: id,
    metadata: { assigned_to: userId },
  });

  revalidatePath("/console/inquiries/" + id);
  return { ok: true };
}

export async function sendInquiryReplyAction(id: string, message: string) {
  const admin = createAdminClient();
  let staff: StaffProfile;
  try {
    ({ staff } = await requireInquiryWriteAccess(admin, id));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }

  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Reply cannot be empty" };

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("type, full_name, email, message, status")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) return { ok: false, error: "Inquiry not found" };

  const { error: insertErr } = await admin.from("inquiry_replies").insert({
    inquiry_id: id,
    sent_by: staff.id,
    message: trimmed,
  });
  if (insertErr) return { ok: false, error: "Failed to save reply" };

  // The reply is already persisted above — a failed send here doesn't lose
  // it, and the UI shows it in the thread either way.
  const emailResult = await sendInquiryReplyEmail({
    inquiry_id: id,
    email: inquiry.email,
    full_name: inquiry.full_name,
    original_message: inquiry.message,
    reply_message: trimmed,
  });

  if (inquiry.status === "new") {
    await admin
      .from("inquiries")
      .update({ status: "contacted", responded_at: new Date().toISOString() })
      .eq("id", id);
  }

  // Best-effort in-app notification, only if the inquirer has a real
  // account — most inquiries come from anonymous visitors with no profile.
  const { data: requesterProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", inquiry.email.toLowerCase())
    .maybeSingle();

  if (requesterProfile) {
    await admin.from("notifications").insert({
      user_id: requesterProfile.id,
      title: "Xobriq replied to your message",
      body: trimmed.slice(0, 200),
      link: inquiry.type === "support" ? "/dashboard/xobriqKYC/support" : "/dashboard",
    });
  }

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "inquiry.replied",
    resource_type: "inquiry",
    resource_id: id,
    metadata: { email_sent: emailResult.ok },
  });

  revalidatePath("/console/inquiries/" + id);
  return { ok: true, emailSent: emailResult.ok };
}

export async function saveInquiryNotesAction(id: string, notes: string) {
  const admin = createAdminClient();
  let staff: StaffProfile;
  try {
    ({ staff } = await requireInquiryWriteAccess(admin, id));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }

  await admin.from("inquiries").update({ internal_notes: notes }).eq("id", id);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    action: "inquiry.notes_updated",
    resource_type: "inquiry",
    resource_id: id,
  });

  revalidatePath("/console/inquiries/" + id);
  return { ok: true };
}
