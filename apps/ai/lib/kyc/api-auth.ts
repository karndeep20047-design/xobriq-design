import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getStaffAccess } from "@/lib/staff-permissions";
import { resolveApiKey } from "@/lib/kyc/api-keys";
import { getMemberAccess } from "@/lib/permissions";
import type { OrgPermissionKey } from "@/lib/permissions-shared";
import { isProductionApproved } from "@/lib/product-access";

/**
 * Auth for the client-facing /api/v1/kyc/* routes. Two paths, checked in
 * order — no route.ts changes needed when either path is added/changed,
 * since every route just calls this one function:
 *
 * 1. `Authorization: Bearer xob_live_...` header — a real external API-key
 *    caller. Resolved via lib/kyc/api-keys.ts against the admin client;
 *    there's no Supabase Auth session behind an API key, so this path is
 *    isolated by the key-hash lookup itself, not by RLS. `requiredPermission`
 *    is NOT enforced on this path — an API key is an org-level credential,
 *    not tied to any one member's role.
 * 2. Supabase session cookie (unchanged from Phase 1) — the Xobriq KYC
 *    dashboard calling in same-origin via the xobriq.ai reverse-proxy. If
 *    `requiredPermission` is passed, the signed-in member must have that
 *    kyc_* permission (see lib/permissions.ts) — this is what stops a member
 *    without "New Verification" access from bypassing the hidden sidebar
 *    link and POSTing straight to the route.
 */
export async function requireKycClientAccess(requiredPermission?: OrgPermissionKey) {
  const hdrs = await headers();
  const authHeader = hdrs.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const resolved = token ? await resolveApiKey(token) : null;
    if (!resolved) {
      return { ok: false as const, response: NextResponse.json({ error: "invalid api key" }, { status: 401 }) };
    }
    if (!resolved.ok) {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error: {
              code: "PRODUCTION_ACCESS_REQUIRED",
              message: "Production access has not been approved for this product.",
              requestId: `req_${randomUUID()}`,
            },
          },
          { status: 403 }
        ),
      };
    }
    return {
      ok: true as const,
      organizationId: resolved.organizationId,
      apiKeyId: resolved.keyId,
      environment: resolved.environment,
      userId: null,
      email: null,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!user.default_org_id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "no organization on this account" }, { status: 400 }),
    };
  }

  if (requiredPermission) {
    const access = await getMemberAccess(user.id, user.default_org_id);
    if (!access || !access.permissions[requiredPermission]) {
      return { ok: false as const, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    }
  }

  // Session-authenticated calls (the KYC dashboard itself) carry no API
  // key to read an environment off of, but they're still real
  // organization traffic — so this checks the exact same per-org
  // production_status the API-key path checks, rather than either
  // hardcoding sandbox forever or blanket-switching every client's
  // dashboard to Production. Only an org that's actually been through the
  // approval workflow (/console/product-access) gets real Production
  // results from its own dashboard; every other org keeps getting
  // sandbox, unchanged from before.
  const dashboardEnvironment: "production" | "sandbox" = (await isProductionApproved(user.default_org_id, "kyc"))
    ? "production"
    : "sandbox";

  return {
    ok: true as const,
    organizationId: user.default_org_id,
    apiKeyId: null,
    environment: dashboardEnvironment,
    userId: user.id,
    email: user.email,
  };
}

/** Auth for the staff-only /api/console/kyc/* polling routes. */
export async function requireKycOpsApiAccess() {
  const user = await getCurrentUser();
  if (!user?.xobriq_staff_role) {
    return { ok: false as const, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  const access = await getStaffAccess(user.id);
  if (!access?.isSuperAdmin && !access?.permissions.kyc_ops) {
    return { ok: false as const, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  const canSeeFinancial = !!access && (access.isSuperAdmin || access.permissions.kyc_ops_financial);
  return { ok: true as const, canSeeFinancial };
}
