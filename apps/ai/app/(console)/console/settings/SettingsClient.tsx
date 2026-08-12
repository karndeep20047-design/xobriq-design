"use client";

import { useState, useTransition } from "react";
import { User, Lock, Check, AlertCircle } from "lucide-react";
import { ConsolePageHeader, ConsoleCard } from "@/components/console/ConsolePageHeader";
import { updateProfileAction, changePasswordAction } from "./actions";
import type { StaffProfile } from "@/lib/session-types";

export function SettingsClient({ staff, roleLabel }: { staff: StaffProfile; roleLabel: string }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your profile and account security."
      />

      <div className="space-y-6">
        <ProfileSection staff={staff} roleLabel={roleLabel} />
        <PasswordSection />
      </div>
    </div>
  );
}

function ProfileSection({ staff, roleLabel }: { staff: StaffProfile; roleLabel: string }) {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <ConsoleCard className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-enterprise-primary/10">
          <User className="h-4 w-4 text-enterprise-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-xs text-fg-muted">Update your basic information.</p>
        </div>
      </div>

      {banner ? <BannerBox banner={banner} onClose={() => setBanner(null)} /> : null}

      <form
        action={(fd) => {
          startTransition(async () => {
            const r = await updateProfileAction(fd);
            setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
          });
        }}
        className="space-y-4"
      >
        <FieldGroup label="Full name">
          <input
            name="full_name"
            defaultValue={staff.full_name || ""}
            required
            className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
          />
        </FieldGroup>

        <FieldGroup label="Email (read-only)">
          <input value={staff.email} readOnly className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg-muted" />
        </FieldGroup>

        <FieldGroup label="Role (assigned by super admin)">
          <input value={roleLabel} readOnly className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg-muted" />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Phone (optional)">
            <input
              name="phone"
              type="tel"
              placeholder="+254 700 000 000"
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            />
          </FieldGroup>
          <FieldGroup label="Timezone">
            <input
              name="timezone"
              defaultValue="Africa/Nairobi"
              className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            />
          </FieldGroup>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </ConsoleCard>
  );
}

function PasswordSection() {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <ConsoleCard className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-enterprise-primary/10">
          <Lock className="h-4 w-4 text-enterprise-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Change password</h2>
          <p className="text-xs text-fg-muted">Choose a strong password. Minimum 12 characters.</p>
        </div>
      </div>

      {banner ? <BannerBox banner={banner} onClose={() => setBanner(null)} /> : null}

      <form
        action={(fd) => {
          startTransition(async () => {
            const r = await changePasswordAction(fd);
            setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
            if (r.ok) (document.getElementById("pwd-form") as HTMLFormElement)?.reset();
          });
        }}
        id="pwd-form"
        className="space-y-4"
      >
        <FieldGroup label="Current password">
          <input
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
          />
        </FieldGroup>
        <FieldGroup label="New password">
          <input
            name="new_password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
          />
        </FieldGroup>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending} className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary disabled:opacity-50">
            {isPending ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </ConsoleCard>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function BannerBox({ banner, onClose }: { banner: { type: "success" | "error"; message: string }; onClose: () => void }) {
  return (
    <div className={"mb-4 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm " + (banner.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200")}>
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