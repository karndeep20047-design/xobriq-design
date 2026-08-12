import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile — XOBRIQ KYC",
  description: "View your account and update your password.",
};

// Deliberately just the signed-in user's own info (name, email) plus a
// password change — not an organization-wide business profile (trading
// name, KRA PIN, BRS number, compliance officer, etc.). Whoever is looking
// at this page should only ever see their own account, nothing about the
// org's business/compliance details.
export default async function ProfilePage() {
  const user = await requireAuth("/login?redirectTo=/dashboard/xobriqKYC/profile");

  return <ProfileClient profile={{ fullName: user.full_name, email: user.email }} />;
}
