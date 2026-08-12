import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireKycPermission } from "@/lib/permissions";
import { SupportClient, type SupportRequestRow } from "./SupportClient";

export const metadata: Metadata = {
  title: "Support — XOBRIQ KYC",
  description: "Get help from the Xobriq team.",
};

// No support-ticketing schema exists anywhere in this codebase. Rather than
// invent one, this reuses the real `inquiries` table (same one the public
// contact form and the console's Inquiries page already use) with
// type: "support" — a request submitted here is a real row a real staff
// member sees, not a fake ticket in local state.
export default async function SupportPage() {
  const { user } = await requireKycPermission("kyc_support");

  const admin = createAdminClient();
  const { data } = await admin
    .from("inquiries")
    .select("id, message, status, urgency, created_at, responded_at")
    .eq("type", "support")
    .eq("email", user.email)
    .order("created_at", { ascending: false })
    .limit(20);

  const requestIds = (data || []).map((r) => r.id);
  const repliesByInquiry: Record<string, { message: string; created_at: string }[]> = {};
  if (requestIds.length > 0) {
    const { data: replyRows } = await admin
      .from("inquiry_replies")
      .select("inquiry_id, message, created_at")
      .in("inquiry_id", requestIds)
      .order("created_at", { ascending: true });
    (replyRows || []).forEach((r) => {
      (repliesByInquiry[r.inquiry_id] ||= []).push({ message: r.message, created_at: r.created_at });
    });
  }

  const requests: SupportRequestRow[] = (data || []).map((r) => {
    const [subject] = (r.message || "").split("\n\n");
    return {
      id: r.id,
      subject: subject || "(no subject)",
      status: r.status,
      urgency: r.urgency,
      createdAt: r.created_at,
      respondedAt: r.responded_at,
      replies: repliesByInquiry[r.id] || [],
    };
  });

  return <SupportClient initialRequests={requests} />;
}
