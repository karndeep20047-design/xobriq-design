"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { sendVerificationEmail } from "@/lib/email/send-verification";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import { headers } from "next/headers";
import { isAuthActionRateLimited } from "@/lib/rate-limit";

async function clientIp(): Promise<string | null> {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
}

// ─── Schemas ──────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  website: z.string().optional(),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(12).max(200),
  website: z.string().optional(),
});

const ResetSchema = z.object({
  email: z.string().email().max(200),
  website: z.string().optional(),
});

const CompleteResetSchema = z.object({
  token: z.string().min(32).max(200),
  password: z.string().min(12).max(200),
  passwordConfirm: z.string().min(12).max(200),
  website: z.string().optional(),
});

export type ActionResult = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

async function nukeAllAuthCookies() {
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    if (
      c.name.startsWith("sb-") ||
      c.name.includes("supabase") ||
      c.name === "xobriq_session"
    ) {
      cookieStore.delete(c.name);
    }
  }
}

async function landingRoute(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("xobriq_staff_role")
    .eq("id", userId)
    .single();
  return profile?.xobriq_staff_role ? "/console" : "/dashboard";
}

// ─── LOGIN ACTION (AUTHENTICATION) ────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.website === "string" && raw.website.length > 0) return;

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "Please enter a valid email and password.",
    };

  const ip = await clientIp();
  const rateLimitAdmin = createAdminClient();
  if (await isAuthActionRateLimited(rateLimitAdmin, ip, ["auth.login.success", "auth.login.failed"], { windowMs: 5 * 60_000, max: 10 })) {
    return { ok: false, error: "Too many attempts — please wait a few minutes and try again." };
  }

  const supabase = await createClient();

  // Session hardening: if someone else is logged into this browser, revoke
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();
  if (
    existingUser &&
    existingUser.email?.toLowerCase() !== parsed.data.email.toLowerCase()
  ) {
    await supabase.auth.signOut({ scope: "global" });
    await nukeAllAuthCookies();

    await logAudit({
      actor_id: existingUser.id,
      actor_email: existingUser.email,
      action: "auth.forced_logout",
      metadata: {
        reason: "different_user_signed_in",
        new_email: parsed.data.email,
      },
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await logAudit({
      action: "auth.login.failed",
      metadata: { email: parsed.data.email, reason: error.message },
    });

    const msg = error.message.toLowerCase();
    if (
      msg.includes("email not confirmed") ||
      msg.includes("email_not_confirmed")
    ) {
      return {
        ok: false,
        error:
          "Please verify your email address first. Check your inbox (and spam folder) for the verification link.",
      };
    }

    return { ok: false, error: "Invalid email or password." };
  }

  await logAudit({
    actor_id: data.user?.id,
    actor_email: data.user?.email,
    action: "auth.login.success",
  });

  const explicit = formData.get("redirectTo") as string | null;
  const destination =
    explicit && explicit.startsWith("/")
      ? explicit
      : await landingRoute(data.user!.id);

  // Append ?loggedIn=1 so the landing page can show a success toast
  const separator = destination.includes("?") ? "&" : "?";
  redirect(destination + separator + "loggedIn=1");
}

// ─── REGISTER ─────────────────────────────────────────────────────────────

export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.website === "string" && raw.website.length > 0)
    return { ok: true };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      const path = i.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = i.message;
    });
    return {
      ok: false,
      error: "Please fix the errors below",
      fieldErrors,
    };
  }

  console.log("[register] starting for:", parsed.data.email);

  const admin = createAdminClient();

  const ip = await clientIp();
  if (await isAuthActionRateLimited(admin, ip, ["auth.register", "auth.verification.resent"], { windowMs: 60 * 60_000, max: 5 })) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  // Check if email already exists — look up via profiles.email (unique,
  // indexed — see profiles_email_key) instead of scanning listUsers(),
  // which only returns one page of auth users at a time and silently misses
  // matches past that page once the user base grows.
  const normalizedEmail = parsed.data.email.toLowerCase();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let existingUser: Awaited<ReturnType<typeof admin.auth.admin.getUserById>>["data"]["user"] = null;
  if (existingProfile) {
    const { data: userData } = await admin.auth.admin.getUserById(existingProfile.id);
    existingUser = userData.user;
  }

  if (existingUser) {
    if (existingUser.email_confirmed_at) {
      console.log("[register] email already confirmed:", parsed.data.email);
      return {
        ok: false,
        error:
          "An account with this email already exists. Please sign in instead.",
      };
    }

    console.log(
      "[register] resending verification for existing unverified user"
    );
    const sent = await sendVerificationEmail({
      user_id: existingUser.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
    });

    if (!sent.ok) {
      console.error("[register] resend failed:", sent.error);
      return {
        ok: false,
        error: "Could not resend verification email. Please try again later.",
      };
    }

    await logAudit({
      actor_id: existingUser.id,
      actor_email: existingUser.email,
      action: "auth.verification.resent",
    });

    return { ok: true };
  }

  console.log("[register] creating new user with email_confirm: false");

  // CRITICAL: Use admin API with email_confirm: false so Supabase doesn't send
  // its own email and doesn't auto-confirm the user
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: false,
      user_metadata: { full_name: parsed.data.fullName },
    });

  if (createErr || !created.user) {
    console.error("[register] user creation failed:", createErr?.message);
    return {
      ok: false,
      error: "Failed to create account. Please try again.",
    };
  }

  console.log(
    "[register] user created:",
    created.user.id,
    "email_confirmed_at:",
    created.user.email_confirmed_at
  );

  const sent = await sendVerificationEmail({
    user_id: created.user.id,
    email: parsed.data.email,
    full_name: parsed.data.fullName,
  });

  if (!sent.ok) {
    console.error("[register] verification email failed:", sent.error);
  } else {
    console.log(
      "[register] verification email sent, token:",
      sent.token.substring(0, 8) + "..."
    );
  }

  await logAudit({
    actor_id: created.user.id,
    actor_email: created.user.email,
    action: "auth.register",
    metadata: { verification_email_sent: sent.ok },
  });

  // The account was genuinely created either way, so this still returns
  // ok: true rather than "failed to create account" — but when the email
  // send itself failed, say so instead of showing "check your inbox" for
  // an email that never went out. Submitting this same form again with the
  // same email hits the existing-unverified-user branch above, which
  // resends it.
  return sent.ok
    ? { ok: true }
    : {
        ok: true,
        error:
          "Your account was created, but we couldn't send the verification email. Submit this form again with the same email to retry sending it, or contact support@xobriq.com.",
      };
}

// ─── PASSWORD RESET (custom flow) ──────────────────────────────────────

export async function resetPasswordRequestAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.website === "string" && raw.website.length > 0)
    return { ok: true };

  const parsed = ResetSchema.safeParse(raw);
  // Always return "ok: true" to prevent email enumeration
  if (!parsed.success) return { ok: true };

  console.log("[password-reset] request for:", parsed.data.email);

  const admin = createAdminClient();
  const ip = await clientIp();
  // Rate-limited requests still return ok:true — every other branch in
  // this function already does the same regardless of outcome, to avoid
  // revealing whether an account exists.
  if (await isAuthActionRateLimited(admin, ip, ["auth.password_reset.requested"], { windowMs: 60 * 60_000, max: 5 })) {
    return { ok: true };
  }

  // Find user by email — same profiles.email lookup as registerAction, see
  // the comment there for why this replaced scanning listUsers().
  const normalizedEmail = parsed.data.email.toLowerCase();
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let user: Awaited<ReturnType<typeof admin.auth.admin.getUserById>>["data"]["user"] = null;
  if (existingProfile) {
    const { data: userData } = await admin.auth.admin.getUserById(existingProfile.id);
    user = userData.user;
  }

  if (!user) {
    console.log("[password-reset] no user for email:", parsed.data.email);
    // Silent success — don't reveal if account exists
    return { ok: true };
  }

  if (!user.email_confirmed_at) {
    console.log("[password-reset] account not verified:", parsed.data.email);
    return { ok: true }; // Silent success
  }

  // Get full name from profile
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    parsed.data.email.split("@")[0] ||
    "there";

  // Get request metadata
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent") || null;

  const sent = await sendPasswordResetEmail({
    user_id: user.id,
    email: parsed.data.email,
    full_name: fullName,
    ip_address: ip,
    user_agent: userAgent,
  });

  await logAudit({
    actor_id: user.id,
    actor_email: user.email,
    action: "auth.password_reset.requested",
    metadata: { sent: sent.ok, ip_address: ip },
    ip_address: ip,
    user_agent: userAgent,
  });

  return { ok: true }; // Always ok — even if send failed, we don't tell user
}

export async function completePasswordResetAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  if (typeof raw.website === "string" && raw.website.length > 0)
    return { ok: true };

  const parsed = CompleteResetSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      const path = i.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = i.message;
    });
    return {
      ok: false,
      error: "Password must be at least 12 characters.",
      fieldErrors,
    };
  }

  if (parsed.data.password !== parsed.data.passwordConfirm) {
    return {
      ok: false,
      error: "Passwords do not match.",
      fieldErrors: { passwordConfirm: "Does not match password" },
    };
  }

  console.log("[password-reset] completion attempt");

  const admin = createAdminClient();
  const ip = await clientIp();
  if (await isAuthActionRateLimited(admin, ip, ["auth.password_reset.completed"], { windowMs: 60 * 60_000, max: 20 })) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  // Look up token
  const { data: tokenRow } = await admin
    .from("password_reset_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (!tokenRow) {
    return {
      ok: false,
      error: "This reset link is invalid. Please request a new one.",
    };
  }

  if (tokenRow.used_at) {
    return {
      ok: false,
      error: "This reset link has already been used. Please request a new one.",
    };
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return {
      ok: false,
      error: "This reset link has expired. Please request a new one.",
    };
  }

  // Update the user's password
  const { error: updateErr } = await admin.auth.admin.updateUserById(
    tokenRow.user_id,
    { password: parsed.data.password }
  );

  if (updateErr) {
    console.error("[password-reset] failed to update password:", updateErr.message);
    return {
      ok: false,
      error: "Failed to update password. Please try again.",
    };
  }

  // Mark token as used
  await admin
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  // Invalidate all existing sessions for this user (security)
  await admin.auth.admin.signOut(tokenRow.user_id, "global");

  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent") || null;

  await logAudit({
    actor_id: tokenRow.user_id,
    actor_email: tokenRow.email,
    action: "auth.password_reset.completed",
    ip_address: ip,
    user_agent: userAgent,
  });

  return { ok: true };
}

// ─── OAUTH: GOOGLE ──────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.signOut({ scope: "global" });
    await nukeAllAuthCookies();
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app";
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: baseUrl + "/auth/callback" },
  });
  if (data.url) redirect(data.url);
}

// ─── OAUTH: MICROSOFT ──────────────────────────────────────────────────

export async function signInWithMicrosoft() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.signOut({ scope: "global" });
    await nukeAllAuthCookies();
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://xobriq-ai-psi.vercel.app";
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      scopes: "email profile openid",
      redirectTo: baseUrl + "/auth/callback",
    },
  });
  if (data.url) redirect(data.url);
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAudit({
      actor_id: user.id,
      actor_email: user.email,
      action: "auth.logout",
    });
  }

  await supabase.auth.signOut({ scope: "global" });
  await nukeAllAuthCookies();

  revalidatePath("/", "layout");
  redirect("/login");
}
