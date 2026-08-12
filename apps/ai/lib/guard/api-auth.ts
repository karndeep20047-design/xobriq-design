import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canViewMetrics } from "@/lib/session-types";

export async function requireGuardApiAccess() {
  const user = await getCurrentUser();
  if (!user?.xobriq_staff_role || !canViewMetrics(user.xobriq_staff_role)) {
    return { ok: false as const, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}
