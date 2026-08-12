import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AcceptInviteClient } from "./AcceptInviteClient";
import { ROLE_LABELS } from "@/lib/session-types";

export const metadata = { title: "Accept invitation — Xobriq" };

export default async function AcceptInvitePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invitations")
    .select("id, email, xobriq_staff_role, expires_at, accepted_at, organization_id")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return <InvitePlaceholder title="Invitation not found" message="This link is invalid or has been revoked." />;
  }

  if (invite.accepted_at) {
    return <InvitePlaceholder title="Already accepted" message="This invitation has already been used. Please sign in normally." />;
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <InvitePlaceholder title="Invitation expired" message="Ask an administrator to send you a fresh invitation." />;
  }

  const roleLabel = invite.xobriq_staff_role ? ROLE_LABELS[invite.xobriq_staff_role as keyof typeof ROLE_LABELS] : "Team member";

  return (
    <AcceptInviteClient
      token={token}
      email={invite.email}
      roleLabel={roleLabel}
    />
  );
}

function InvitePlaceholder({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-subtle p-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-fg-muted">{message}</p>
        <a href="/login" className="mt-6 inline-block rounded-md bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary">
          Go to login
        </a>
      </div>
    </div>
  );
}