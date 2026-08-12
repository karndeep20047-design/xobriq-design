import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SsoButtons } from "@/components/auth/SsoButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in — Xobriq.AI" };

type SearchParams = Promise<{
  redirectTo?: string;
  passwordReset?: string;
  error?: string;
  verified?: string;
}>;

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;

  // If already logged in, route to proper landing
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("xobriq_staff_role")
      .eq("id", user.id)
      .single();
    redirect(profile?.xobriq_staff_role ? "/console" : "/dashboard");
  }

  const footer = (
    <span>
      New to Xobriq?{" "}
      <Link href="/register" className="font-bold text-enterprise-primary hover:underline">
        Request access
      </Link>
    </span>
  );

  return (
    <div className="w-full max-w-[480px]">
      <AuthCard
        title="Sign in to Xobriq"
        subtitle="Enter your credentials to access the intelligence framework."
        footer={footer}
      >
        {sp.verified ? (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            ✓ Your email is verified! Sign in to continue.
          </div>
        ) : null}

        {sp.passwordReset ? (
          <div className="mb-6 rounded-lg border border-xteal-500/30 bg-xteal-500/10 px-4 py-3 text-sm text-xteal-500">
            Password updated. Sign in with your new password.
          </div>
        ) : null}

        {sp.error ? (
          <div className="mb-6 rounded-lg border border-xred-500/30 bg-xred-500/10 px-4 py-3 text-sm text-xred-500">
            Authentication failed. Please try again.
          </div>
        ) : null}

        <SsoButtons layout="stacked" />

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-enterprise-border" />
          <span className="label-caps text-enterprise-fg-subtle">Or email login</span>
          <span className="h-px flex-1 bg-enterprise-border" />
        </div>

        <LoginForm redirectTo={sp.redirectTo} />
      </AuthCard>
    </div>
  );
}
