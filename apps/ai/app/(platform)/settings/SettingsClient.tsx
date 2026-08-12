"use client";

import { useState, useTransition } from "react";
import { User, Lock, Building2, Check, AlertCircle } from "lucide-react";
import { updateMyProfileAction, changeMyPasswordAction, updateOrgSettingsAction } from "./actions";
import { cn } from "@/lib/utils";

type Profile = { full_name: string | null; email: string };
type Org = { name: string; billing_email: string | null } | null;

export function SettingsClient({
  profile,
  org,
  canManageOrgSettings,
}: {
  profile: Profile;
  org: Org;
  canManageOrgSettings: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-enterprise-accent">Preferences</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-fg-muted">Manage your account and organization.</p>
      </div>

      <ProfileSection profile={profile} />
      <PasswordSection />
      {canManageOrgSettings && org ? <OrgSection org={org} /> : null}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-bg-subtle p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-enterprise-primary/10 text-enterprise-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-fg-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileSection({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <SectionCard icon={User} title="My account" subtitle="Update your basic information.">
      {banner ? <Banner banner={banner} onClose={() => setBanner(null)} /> : null}
      <form
        action={(fd) => {
          startTransition(async () => {
            const r = await updateMyProfileAction(fd);
            setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
          });
        }}
        className="mt-4 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Full name</label>
          <input
            name="full_name"
            required
            defaultValue={profile.full_name || ""}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Email</label>
          <input
            value={profile.email}
            readOnly
            disabled
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg-muted"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordSection() {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <SectionCard icon={Lock} title="Change password" subtitle="Choose a strong password. Minimum 12 characters.">
      {banner ? <Banner banner={banner} onClose={() => setBanner(null)} /> : null}
      <form
        id="pwd-form"
        action={(fd) => {
          startTransition(async () => {
            const r = await changeMyPasswordAction(fd);
            setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
            if (r.ok) (document.getElementById("pwd-form") as HTMLFormElement)?.reset();
          });
        }}
        className="mt-4 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Current password</label>
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">New password</label>
          <input
            name="new_password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {isPending ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function OrgSection({ org }: { org: NonNullable<Org> }) {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <SectionCard icon={Building2} title="Organization" subtitle="Name and billing contact for your organization.">
      {banner ? <Banner banner={banner} onClose={() => setBanner(null)} /> : null}
      <form
        action={(fd) => {
          startTransition(async () => {
            const r = await updateOrgSettingsAction(fd);
            setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
          });
        }}
        className="mt-4 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Organization name</label>
          <input
            name="name"
            required
            defaultValue={org.name}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Billing / contact email</label>
          <input
            name="billing_email"
            type="email"
            required
            defaultValue={org.billing_email || ""}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function Banner({
  banner,
  onClose,
}: {
  banner: { type: "success" | "error"; message: string };
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm",
        banner.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400",
      )}
    >
      <div className="flex items-center gap-2">
        {banner.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        {banner.message}
      </div>
      <button onClick={onClose} className="text-current opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
}
