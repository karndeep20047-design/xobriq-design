import { requireStaff, ROLE_LABELS } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings — Xobriq Console" };

export default async function SettingsPage() {
  const staff = await requireStaff();
  return <SettingsClient staff={staff} roleLabel={ROLE_LABELS[staff.xobriq_staff_role]} />;
}