import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export const metadata = { title: "Verify Email — Xobriq" };
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export default async function VerifyEmailPage(props: { params: Params }) {
  const { token } = await props.params;
  const admin = createAdminClient();

  const { data: tokenRow } = await admin
    .from("email_verification_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) {
    return (
      <ErrorPage
        title="Invalid verification link"
        message="This verification link is not recognized. It may have been mistyped or already used."
      />
    );
  }

  if (tokenRow.used_at) {
    return (
      <ErrorPage
        title="Link already used"
        message="This verification link has already been used. Please sign in, or register again if you do not have access."
      />
    );
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <ErrorPage
        title="Link expired"
        message="This verification link has expired. Please register again to receive a new link."
      />
    );
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(
    tokenRow.user_id,
    { email_confirm: true }
  );

  if (updateErr) {
    console.error("[verify] failed to confirm email:", updateErr.message);
    return (
      <ErrorPage
        title="Verification failed"
        message="Something went wrong on our end. Please try again or contact support."
      />
    );
  }

  await admin
    .from("email_verification_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  await logAudit({
    actor_id: tokenRow.user_id,
    actor_email: tokenRow.email,
    action: "auth.email_verified",
  });

  redirect("/login?verified=1");
}

function ErrorPage(props: { title: string; message: string }) {
  const registerHref = "/register";
  const loginHref = "/login";
  // You can use btnClass if you want button styling, or linkClass for plain links
  const linkClass = "text-xs text-enterprise-primary hover:underline";
  const btnClass =
    "inline-block rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-subtle p-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-xred-500/15 text-xred-500 text-xl font-bold">
          ×
        </div>
        <h1 className="text-xl font-semibold text-fg">{props.title}</h1>
        <p className="mt-3 text-sm text-fg-muted">{props.message}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={registerHref} className={linkClass}>
            Register again
          </Link>
          <Link href={loginHref} className={linkClass}>
            Or sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
