import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Set new password — Xobriq" };
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

function ErrorState(props: { title: string; message: string }) {
  return (
    <div className="w-full max-w-[480px]">
      <AuthCard title={props.title} subtitle={props.message}>
        <div className="text-center">
          <Link
            href="/reset-password"
            className="inline-block rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
          >
            Request a new reset link
          </Link>
          <p className="mt-4 text-xs text-enterprise-fg-subtle">
            <Link href="/login" className="text-enterprise-primary hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    </div>
  );
}

export default async function ResetPasswordTokenPage(props: { params: Params }) {
  const { token } = await props.params;

  console.log("[reset-password] token requested:", token.substring(0, 12) + "...");

  const admin = createAdminClient();

  const { data: tokenRow, error } = await admin
    .from("password_reset_tokens")
    .select("id, user_id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[reset-password] DB error:", error.message);
  }

  if (!tokenRow) {
    return (
      <ErrorState
        title="Invalid reset link"
        message="This reset link is not recognized. It may have been mistyped or already used."
      />
    );
  }

  if (tokenRow.used_at) {
    return (
      <ErrorState
        title="Link already used"
        message="This reset link has already been used. Please request a new one if needed."
      />
    );
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <ErrorState
        title="Link expired"
        message="For your security, reset links expire after 1 hour. Please request a new one."
      />
    );
  }

  const footer = (
    <Link href="/login" className="font-bold text-enterprise-primary hover:underline">
      ← Back to sign in
    </Link>
  );

  return (
    <div className="w-full max-w-[480px]">
      <AuthCard
        title="Set a new password"
        subtitle={"Choose a strong password for " + tokenRow.email + "."}
        footer={footer}
      >
        <ResetPasswordForm token={token} />
      </AuthCard>
    </div>
  );
}
