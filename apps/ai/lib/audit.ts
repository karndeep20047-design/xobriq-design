"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditPayload = {
  actor_id?: string | null;
  actor_email?: string | null;
  organization_id?: string | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit(payload: AuditPayload) {
  // Skip silently if service role key is unset (dev without .env.local hydrated)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[audit] SUPABASE_SERVICE_ROLE_KEY not set; skipping:", payload.action);
    return;
  }

  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
    const userAgent = hdrs.get("user-agent") || null;

    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: payload.actor_id || null,
      actor_email: payload.actor_email || null,
      organization_id: payload.organization_id || null,
      action: payload.action,
      resource_type: payload.resource_type || null,
      resource_id: payload.resource_id || null,
      metadata: payload.metadata || {},
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("[audit] failed:", err instanceof Error ? err.message : err);
  }
}