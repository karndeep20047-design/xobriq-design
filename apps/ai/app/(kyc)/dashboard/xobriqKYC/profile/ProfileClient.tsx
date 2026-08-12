"use client";

import { useState, useTransition } from "react";
import { User, Lock, Check, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/kyc/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateMyProfileAction, changeMyPasswordAction } from "./actions";
import { cn } from "@/lib/utils";

type Profile = { fullName: string | null; email: string };

export function ProfileClient({ profile }: { profile: Profile }) {
  return (
    <PageShell title="Profile" subtitle="Your account details and password">
      <div className="mx-auto max-w-2xl space-y-4">
        <ProfileSection profile={profile} />
        <PasswordSection />
      </div>
    </PageShell>
  );
}

function ProfileSection({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">My account</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {banner ? <Banner banner={banner} onClose={() => setBanner(null)} /> : null}
        <form
          action={(fd) => {
            startTransition(async () => {
              const r = await updateMyProfileAction(fd);
              setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required defaultValue={profile.fullName || ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile.email} readOnly disabled />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Change password</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {banner ? <Banner banner={banner} onClose={() => setBanner(null)} /> : null}
        <form
          id="kyc-pwd-form"
          action={(fd) => {
            startTransition(async () => {
              const r = await changeMyPasswordAction(fd);
              setBanner(r.ok ? { type: "success", message: r.message || "Saved" } : { type: "error", message: r.error || "Failed" });
              if (r.ok) (document.getElementById("kyc-pwd-form") as HTMLFormElement)?.reset();
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="current_password">Current password</Label>
            <Input id="current_password" name="current_password" type="password" required autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" name="new_password" type="password" required minLength={12} autoComplete="new-password" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
        "flex items-center justify-between gap-2 rounded-lg border p-3 text-sm",
        banner.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive",
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
