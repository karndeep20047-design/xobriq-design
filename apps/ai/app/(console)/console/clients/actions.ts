"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffPermission } from "@/lib/staff-permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { creditWallet } from "@/lib/kyc/wallet";
import { PLAN_DEFAULT_PRICING, DEFAULT_CURRENCY, type OrgPlan, type VerificationType } from "@/lib/kyc/pricing-defaults";

const CreateClientSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["client_company", "client_individual"]),
  industry: z.string().max(100).optional(),
  country: z.string().max(2).default("KE"),
  plan: z.enum(["free", "sandbox", "growth", "enterprise"]).default("free"),
  billing_email: z.string().email().max(200),
  owner_email: z.string().email().max(200),
  owner_name: z.string().min(2).max(120),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export async function createClientOrgAction(formData: FormData) {
  let ctx;
  try {
    ctx = await requireStaffPermission("clients");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateClientSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const admin = createAdminClient();

  // Generate unique slug
  const base = slugify(parsed.data.name);
  let slug = base;
  let i = 1;
  while (true) {
    const { data: existing } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = base + "-" + (++i);
  }

  const { data: org, error } = await admin.from("organizations").insert({
    name: parsed.data.name,
    slug,
    type: parsed.data.type,
    industry: parsed.data.industry,
    country: parsed.data.country,
    plan: parsed.data.plan,
    status: "trial",
    billing_email: parsed.data.billing_email,
  }).select("id").single();

  if (error) return { ok: false, error: error.message };

  const ownerEmail = parsed.data.owner_email.toLowerCase();

  // If this email already has an account, never route it through the
  // invite/accept flow (that flow used to overwrite an existing account's
  // password when it hit an already-registered email — see the invite
  // accept-action fix). Link the existing profile directly as owner
  // instead, mirroring inviteStaffAction's own "direct promote" branch.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", ownerEmail)
    .maybeSingle();

  let inviteLink: string | undefined;

  if (existingProfile) {
    await admin.from("organization_members").upsert({
      organization_id: org.id,
      user_id: existingProfile.id,
      role: "owner",
    }, { onConflict: "organization_id,user_id" });

    await logAudit({
      actor_id: staff.id,
      actor_email: staff.email,
      organization_id: org.id,
      action: "client.owner_linked",
      resource_type: "organization",
      resource_id: org.id,
      metadata: { owner_email: ownerEmail },
    });
  } else {
    const { data: invite } = await admin.from("invitations").insert({
      organization_id: org.id,
      email: ownerEmail,
      role: "owner",
      invited_by: staff.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id, token").single();

    inviteLink = invite ? `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}` : undefined;
  }

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: org.id,
    action: "client.created",
    resource_type: "organization",
    resource_id: org.id,
    metadata: {
      name: parsed.data.name,
      type: parsed.data.type,
      plan: parsed.data.plan,
      owner_email: ownerEmail,
    },
  });

  revalidatePath("/console/clients");
  return { ok: true, message: parsed.data.name + " created", inviteLink };
}

export async function changeClientPlanAction(orgId: string, newPlan: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("clients");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: before } = await admin.from("organizations").select("name, plan").eq("id", orgId).single();
  await admin.from("organizations").update({ plan: newPlan }).eq("id", orgId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: orgId,
    action: "client.plan_changed",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { name: before?.name, from: before?.plan, to: newPlan },
  });

  revalidatePath("/console/clients");
  return { ok: true };
}

/**
 * Seeds kyc_client_pricing from the plan-tiered defaults in
 * lib/kyc/pricing-defaults.ts — this is what "enabling KYC" for a client
 * actually means today: without an active kyc_client_pricing row,
 * verify-and-record.ts's recordBillingTransaction() silently skips billing
 * (the verification itself still works, it just isn't metered).
 */
export async function enableKycForClientAction(orgId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("kyc_ops");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: org } = await admin.from("organizations").select("name, plan").eq("id", orgId).single();
  if (!org) return { ok: false, error: "Organization not found" };

  const { data: existing } = await admin
    .from("kyc_client_pricing")
    .select("id")
    .eq("organization_id", orgId)
    .is("effective_to", null)
    .limit(1);

  if (existing && existing.length > 0) {
    return { ok: false, error: "KYC is already enabled for this client." };
  }

  const plan: OrgPlan = org.plan in PLAN_DEFAULT_PRICING ? (org.plan as OrgPlan) : "free";
  const defaults = PLAN_DEFAULT_PRICING[plan];

  const rows = (Object.keys(defaults) as VerificationType[]).map((verificationType) => ({
    organization_id: orgId,
    verification_type: verificationType,
    price_amount: defaults[verificationType],
    currency: DEFAULT_CURRENCY,
    created_by: staff.id,
  }));

  const { error } = await admin.from("kyc_client_pricing").insert(rows);
  if (error) return { ok: false, error: error.message };

  // Seed a zero-balance wallet row so the client shows "KES 0.00" instead
  // of a blank state immediately after onboarding — kyc_wallet_apply_transaction
  // would create it lazily on the first real debit/top-up anyway, but a
  // client shouldn't see nothing until then. ignoreDuplicates makes this
  // safe to no-op if a wallet row somehow already exists.
  await admin
    .from("kyc_wallets")
    .upsert({ organization_id: orgId }, { onConflict: "organization_id", ignoreDuplicates: true });

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: orgId,
    action: "kyc.client.onboarded",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { plan, pricing: defaults },
  });

  revalidatePath("/console/clients");
  return { ok: true };
}

/**
 * Manually credits a client's wallet — the only way a balance goes up
 * today, since no payment gateway is wired into this product. Staff use
 * this after confirming a payment arrived out-of-band (bank/M-Pesa
 * reconciliation), either directly or when approving a client-submitted
 * kyc_wallet_topup_requests row (see approveTopupRequestAction below).
 */
export async function topUpWalletAction(orgId: string, amount: number, note?: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("kyc_ops");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid top-up amount." };
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("name").eq("id", orgId).single();
  if (!org) return { ok: false, error: "Organization not found" };

  const balance = await creditWallet(admin, {
    organizationId: orgId,
    amount,
    note: note || null,
    createdBy: staff.id,
  });

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: orgId,
    action: "kyc.wallet.topup",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { amount, note: note || null, balance_after: balance },
  });

  revalidatePath("/console/clients");
  return { ok: true, balance };
}

export async function approveTopupRequestAction(requestId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("kyc_ops");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("kyc_wallet_topup_requests")
    .select("organization_id, amount, method, contact_reference, status")
    .eq("id", requestId)
    .single();

  if (!request) return { ok: false, error: "Top-up request not found" };
  if (request.status !== "pending") return { ok: false, error: "This request has already been reviewed." };

  const balance = await creditWallet(admin, {
    organizationId: request.organization_id,
    amount: Number(request.amount),
    reference: request.contact_reference,
    note: `Approved top-up request via ${request.method}`,
    createdBy: staff.id,
  });

  await admin
    .from("kyc_wallet_topup_requests")
    .update({ status: "approved", reviewed_by: staff.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: request.organization_id,
    action: "kyc.wallet.topup_request_approved",
    resource_type: "kyc_wallet_topup_request",
    resource_id: requestId,
    metadata: { amount: request.amount, method: request.method, balance_after: balance },
  });

  revalidatePath("/console/kyc");
  revalidatePath("/console/clients");
  return { ok: true, balance };
}

export async function rejectTopupRequestAction(requestId: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("kyc_ops");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("kyc_wallet_topup_requests")
    .select("organization_id, amount, method, status")
    .eq("id", requestId)
    .single();

  if (!request) return { ok: false, error: "Top-up request not found" };
  if (request.status !== "pending") return { ok: false, error: "This request has already been reviewed." };

  await admin
    .from("kyc_wallet_topup_requests")
    .update({ status: "rejected", reviewed_by: staff.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: request.organization_id,
    action: "kyc.wallet.topup_request_rejected",
    resource_type: "kyc_wallet_topup_request",
    resource_id: requestId,
    metadata: { amount: request.amount, method: request.method },
  });

  revalidatePath("/console/kyc");
  return { ok: true };
}

export async function changeClientStatusAction(orgId: string, newStatus: string) {
  let ctx;
  try {
    ctx = await requireStaffPermission("clients");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: before } = await admin.from("organizations").select("name, status").eq("id", orgId).single();
  await admin.from("organizations").update({ status: newStatus }).eq("id", orgId);

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: orgId,
    action: "client.status_changed",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { name: before?.name, from: before?.status, to: newStatus },
  });

  revalidatePath("/console/clients");
  return { ok: true };
}

// Grants (or ends, when `until` is null) a bounded KYC pilot window — the
// only way an org can run real Creditinfo checks with a zero wallet
// balance (see lib/kyc/wallet.ts's checkWalletBalance). Deliberately
// separate from "KYC enabled" (kyc_client_pricing) — a trial can run
// before pricing is even configured, or alongside it (a priced org can
// still get a temporary free window without touching its price rows).
export async function setKycTrialAction(orgId: string, until: string | null) {
  let ctx;
  try {
    ctx = await requireStaffPermission("kyc_ops");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized" };
  }
  const staff = ctx.user;
  const admin = createAdminClient();

  const { data: before } = await admin
    .from("organizations")
    .select("name, kyc_trial_until")
    .eq("id", orgId)
    .single();

  const { error } = await admin.from("organizations").update({ kyc_trial_until: until }).eq("id", orgId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor_id: staff.id,
    actor_email: staff.email,
    organization_id: orgId,
    action: until ? "client.kyc_trial_started" : "client.kyc_trial_ended",
    resource_type: "organization",
    resource_id: orgId,
    metadata: { name: before?.name, from: before?.kyc_trial_until, to: until },
  });

  revalidatePath("/console/clients");
  return { ok: true, until };
}