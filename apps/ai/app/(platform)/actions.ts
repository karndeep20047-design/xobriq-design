"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/session";
import { PRODUCT_SLUGS, type ProductSlug } from "@/lib/product-access";
import { logAudit } from "@/lib/audit";
import { sendProductAccessRequestedEmail } from "@/lib/email/send-product-access-requested";

export async function markNotificationReadAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  // The KYC dashboard reads from the same notifications table via its own
  // layout (app/(kyc)/dashboard/xobriqKYC/layout.tsx), not this route
  // group's — needs its own revalidation or its notification bell would
  // show stale read/unread state after a fresh navigation.
  revalidatePath("/dashboard/xobriqKYC");
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/xobriqKYC");
}

export async function requestProductAccessAction(
  productSlug: ProductSlug
): Promise<{ ok: boolean; error?: string }> {
  if (!PRODUCT_SLUGS.includes(productSlug)) {
    return { ok: false, error: "Unknown product" };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!user.default_org_id) {
    return { ok: false, error: "Set up your organization first — see the card at the top of your dashboard." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("product_access_requests").upsert(
    {
      organization_id: user.default_org_id,
      product_slug: productSlug,
      status: "pending",
      requested_by: user.id,
      requested_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      notes: null,
    },
    { onConflict: "organization_id,product_slug" }
  );

  if (error) {
    console.error("[product-access] request failed:", error.message);
    return { ok: false, error: "Failed to submit request. Please try again." };
  }

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: user.default_org_id,
    action: "product_access.requested",
    resource_type: "product_access_request",
    metadata: { product_slug: productSlug },
  });

  // A follow-up email is the only signal today that a request was even
  // received — sendProductAccessRequestedEmail never throws, so a mail
  // failure can't block the request itself from succeeding.
  await sendProductAccessRequestedEmail({
    organization_id: user.default_org_id,
    product_slug: productSlug,
    email: user.email,
    full_name: user.full_name,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

const CreateOrgSchema = z.object({
  name: z.string().trim().min(2, "Enter your organization name").max(200),
  team_size: z.enum(["solo", "team"], { message: "Select an option" }),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

// Self-serve organization creation — same insert shape staff use in
// console/clients/actions.ts's createClientOrgAction, minus the fields that
// only make sense when staff sets an org up on someone else's behalf
// (billing_email, plan, an invited owner). Solo devs and small teams alike
// just need a name to get going; they can invite teammates later. Sets
// default_org_id and adds an owner row in organization_members
// immediately — no invitation needed since the user is creating their own
// org.
export async function createOrganizationAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (user.default_org_id) {
    return { ok: false, error: "You already belong to an organization" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  let base = slugify(parsed.data.name);
  if (!base) base = "org";
  let slug = base;
  let i = 1;
  while (true) {
    const { data: existing } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = base + "-" + (++i);
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug,
      type: parsed.data.team_size === "solo" ? "client_individual" : "client_company",
      country: "KE",
      plan: "free",
      status: "trial",
      billing_email: user.email,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[onboarding] org creation failed:", orgError?.message);
    return { ok: false, error: "Failed to create organization. Please try again." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ default_org_id: org.id, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (profileError) {
    console.error("[onboarding] profile update failed:", profileError.message);
    // Don't leave an orphaned org with no owner attached to it.
    await admin.from("organizations").delete().eq("id", org.id);
    return { ok: false, error: "Failed to create organization. Please try again." };
  }

  await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
    invited_by: user.id,
  });

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    organization_id: org.id,
    action: "organization.self_serve_created",
    resource_type: "organization",
    resource_id: org.id,
    metadata: { name: parsed.data.name, team_size: parsed.data.team_size },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
