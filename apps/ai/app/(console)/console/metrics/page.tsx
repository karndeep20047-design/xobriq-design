import { ROLE_LABELS } from "@/lib/session";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_SLUGS } from "@/lib/product-access";
import { MetricsClient } from "./MetricsClient";

export const metadata = { title: "Metrics — Xobriq Console" };

export default async function MetricsPage() {
  const { user: staff } = await requireStaffPermission("metrics");
  const admin = createAdminClient();

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch aggregated stats
  const [
    { count: totalEvents },
    { count: events24h },
    { count: events7d },
    { count: failedLogins24h },
    { count: forcedLogouts24h },
    { count: passwordChanges7d },
    { data: recentSecurityEvents },
    { data: last30dTimeline },
    { count: totalOrgs },
    { count: newOrgs7d },
    { count: totalKycVerifications },
    { count: kycVerifications7d },
    { data: approvedProductAccess },
    { data: activeApiKeys },
    { data: emailEvents24h },
    { data: emailEvents7d },
  ] = await Promise.all([
    admin.from("audit_logs").select("*", { count: "exact", head: true }),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", dayAgo.toISOString()),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "auth.login.failed").gte("created_at", dayAgo.toISOString()),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "auth.forced_logout").gte("created_at", dayAgo.toISOString()),
    admin.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "auth.password_changed").gte("created_at", weekAgo.toISOString()),
    admin.from("audit_logs").select("id, actor_email, action, ip_address, created_at, metadata").in("action", ["auth.login.failed", "auth.forced_logout", "auth.password_change.failed", "auth.password_changed"]).order("created_at", { ascending: false }).limit(15),
    admin.from("audit_logs").select("created_at").gte("created_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: true }).limit(10000),
    admin.from("organizations").select("*", { count: "exact", head: true }).in("type", ["client_company", "client_individual"]),
    admin.from("organizations").select("*", { count: "exact", head: true }).in("type", ["client_company", "client_individual"]).gte("created_at", weekAgo.toISOString()),
    admin.from("kyc_verifications").select("*", { count: "exact", head: true }),
    admin.from("kyc_verifications").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    admin.from("product_access_requests").select("product_slug").eq("status", "approved"),
    admin.from("api_keys").select("product_slug, environment").eq("status", "active"),
    admin.from("email_events").select("status").gte("created_at", dayAgo.toISOString()),
    admin.from("email_events").select("status").gte("created_at", weekAgo.toISOString()),
  ]);

  const emailHealth = {
    sent24h: (emailEvents24h || []).filter((e) => e.status === "sent").length,
    failed24h: (emailEvents24h || []).filter((e) => e.status === "failed").length,
    sent7d: (emailEvents7d || []).filter((e) => e.status === "sent").length,
    failed7d: (emailEvents7d || []).filter((e) => e.status === "failed").length,
  };

  const productAdoption = PRODUCT_SLUGS.map((slug) => ({
    slug,
    count: (approvedProductAccess || []).filter((r) => r.product_slug === slug).length,
  }));

  const apiKeysByProduct = PRODUCT_SLUGS.map((slug) => ({
    slug,
    count: (activeApiKeys || []).filter((k) => k.product_slug === slug).length,
  }));
  const apiKeysSandbox = (activeApiKeys || []).filter((k) => k.environment === "sandbox").length;
  const apiKeysProduction = (activeApiKeys || []).filter((k) => k.environment === "production").length;

  // Build a 30-day timeline: bucket by day
  const buckets: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }
  (last30dTimeline || []).forEach((r) => {
    const key = r.created_at.slice(0, 10);
    if (key in buckets) buckets[key]++;
  });
  const timeline = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count }));

  return (
    <MetricsClient
      role={staff.xobriq_staff_role}
      roleLabel={ROLE_LABELS[staff.xobriq_staff_role]}
      stats={{
        totalEvents: totalEvents ?? 0,
        events24h: events24h ?? 0,
        events7d: events7d ?? 0,
        failedLogins24h: failedLogins24h ?? 0,
        forcedLogouts24h: forcedLogouts24h ?? 0,
        passwordChanges7d: passwordChanges7d ?? 0,
      }}
      business={{
        totalOrgs: totalOrgs ?? 0,
        newOrgs7d: newOrgs7d ?? 0,
        totalKycVerifications: totalKycVerifications ?? 0,
        kycVerifications7d: kycVerifications7d ?? 0,
        productAdoption,
        apiKeys: {
          total: (activeApiKeys || []).length,
          sandbox: apiKeysSandbox,
          production: apiKeysProduction,
          byProduct: apiKeysByProduct,
        },
        emailHealth,
      }}
      recentSecurityEvents={(recentSecurityEvents || []) as any}
      timeline={timeline}
    />
  );
}
