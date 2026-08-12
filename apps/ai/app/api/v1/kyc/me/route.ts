import { NextResponse } from "next/server";
import { requireKycClientAccess } from "@/lib/kyc/api-auth";
import { getCurrentUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Real identity for the Xobriq KYC dashboard's sidebar/greeting — replaces
 * what used to be hardcoded placeholder copy there. On the API-key auth
 * path there's no Supabase Auth user to name, so displayName falls back to
 * the organization's own name.
 */
export async function GET() {
  const auth = await requireKycClientAccess();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("name, plan")
    .eq("id", auth.organizationId)
    .single();

  const orgName = org?.name ?? null;
  const orgPlan = org?.plan ?? null;

  const user = auth.userId ? await getCurrentUser() : null;
  const displayName = user?.full_name || orgName || "there";

  return NextResponse.json({ displayName, orgName, orgPlan });
}
