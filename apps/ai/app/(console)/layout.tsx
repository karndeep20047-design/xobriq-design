import { requireStaff } from "@/lib/session";
import { canManageProductAccess, canManageClients } from "@/lib/session-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffAccess } from "@/lib/staff-permissions";
import { ConsoleShell } from "@/components/console/ConsoleShell";

const RECENT_SIGNUP_WINDOW_DAYS = 7;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const access = await getStaffAccess(staff.id);

  // Computed live from product_access_requests rather than a stored
  // notification row — always correct with zero staleness, no new table,
  // and clears itself the moment the last pending request is actioned.
  let pendingProductAccessRequests: {
    id: string;
    orgName: string;
    productSlug: string;
    requestedAt: string;
  }[] = [];

  if (canManageProductAccess(staff.xobriq_staff_role)) {
    const admin = createAdminClient();
    const { data: requests } = await admin
      .from("product_access_requests")
      .select("id, organization_id, product_slug, requested_at")
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(20);

    const orgIds = Array.from(new Set((requests || []).map((r) => r.organization_id)));
    const orgNameById: Record<string, string> = {};
    if (orgIds.length > 0) {
      const { data: orgs } = await admin.from("organizations").select("id, name").in("id", orgIds);
      (orgs || []).forEach((o) => { orgNameById[o.id] = o.name; });
    }

    pendingProductAccessRequests = (requests || []).map((r) => ({
      id: r.id,
      orgName: orgNameById[r.organization_id] || "Unknown org",
      productSlug: r.product_slug,
      requestedAt: r.requested_at,
    }));
  }

  // Same "computed live, no stored notification row" approach as the
  // product-access requests above — a rolling recency window instead of a
  // read/unread flag, since a new signup doesn't need to be "actioned" the
  // way a pending request does.
  let recentSignups: {
    id: string;
    name: string;
    billingEmail: string | null;
    createdAt: string;
  }[] = [];

  if (canManageClients(staff.xobriq_staff_role)) {
    const admin = createAdminClient();
    const since = daysAgoIso(RECENT_SIGNUP_WINDOW_DAYS);
    const { data: orgs } = await admin
      .from("organizations")
      .select("id, name, billing_email, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    recentSignups = (orgs || []).map((o) => ({
      id: o.id,
      name: o.name,
      billingEmail: o.billing_email,
      createdAt: o.created_at,
    }));
  }

  // The dropdown above still lists everything currently pending/recent —
  // staff need to see the whole un-actioned queue, and /console/product-access
  // and /console/clients are completely unaffected either way. The badge is
  // a separate, narrower number: only items that arrived after this viewer
  // last opened the bell, so it actually clears on view instead of only
  // when an item is individually resolved. A never-opened bell (seenAt
  // null) shows the full current backlog once, rather than a confusing 0.
  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("console_notifications_seen_at")
    .eq("id", staff.id)
    .maybeSingle();
  const seenAt = profileRow?.console_notifications_seen_at ? new Date(profileRow.console_notifications_seen_at) : null;

  const newSinceSeenCount = seenAt
    ? pendingProductAccessRequests.filter((r) => new Date(r.requestedAt) > seenAt).length +
      recentSignups.filter((s) => new Date(s.createdAt) > seenAt).length
    : pendingProductAccessRequests.length + recentSignups.length;

  return (
    <ConsoleShell
      staff={staff}
      access={access}
      pendingProductAccessRequests={pendingProductAccessRequests}
      recentSignups={recentSignups}
      newSinceSeenCount={newSinceSeenCount}
    >
      {children}
    </ConsoleShell>
  );
}
