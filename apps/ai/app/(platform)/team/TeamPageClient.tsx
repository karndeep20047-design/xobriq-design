"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { UserPlus, Trash2, X, Clock, Check, AlertCircle, Copy, Settings2 } from "lucide-react";
import {
  inviteTeamMemberAction,
  revokeTeamInviteAction,
  removeTeamMemberAction,
  changeTeamMemberRoleAction,
  updateInviteDomainsAction,
} from "./actions";

export type CustomRoleOption = { id: string; name: string; permissions: Record<string, boolean> };

export type TeamMemberRow = {
  userId: string;
  role: "owner" | "admin" | "member";
  customRoleId: string | null;
  customRoleName: string | null;
  joinedAt: string;
  email: string;
  name: string;
};

export type PendingInviteRow = {
  id: string;
  email: string;
  role: string;
  customRoleName: string | null;
  createdAt: string;
  expiresAt: string;
};

const roleStyles: Record<string, string> = {
  owner: "border-enterprise-primary/30 bg-enterprise-primary/10 text-enterprise-primary",
  admin: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  member: "border-border bg-bg text-fg-muted",
};

export function TeamPageClient({
  currentUserId,
  currentUserRole,
  members: initialMembers,
  pendingInvites: initialInvites,
  customRoles,
  emailDomains,
}: {
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member" | null;
  members: TeamMemberRow[];
  pendingInvites: PendingInviteRow[];
  customRoles: CustomRoleOption[];
  emailDomains: string[] | null;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string; inviteLink?: string } | null>(null);
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-enterprise-accent">Organization</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Team</h1>
          <p className="mt-2 text-sm text-fg-muted">Invite teammates, assign roles, and manage access.</p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Link
              href="/team/roles"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-semibold transition hover:bg-bg-elevated"
            >
              <Settings2 className="h-4 w-4" /> Manage roles
            </Link>
            <button
              onClick={() => { setInviteOpen(true); setBanner(null); }}
              className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover"
            >
              <UserPlus className="h-4 w-4" /> Invite teammate
            </button>
          </div>
        ) : null}
      </div>

      {banner ? (
        <div className={"mb-6 rounded-lg border p-4 " + (banner.type === "success" ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {banner.type === "success" ? <Check className="mt-0.5 h-4 w-4 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />}
              <div>
                <p className={"text-sm font-medium " + (banner.type === "success" ? "text-emerald-300" : "text-red-300")}>{banner.message}</p>
                {banner.inviteLink ? <InviteLinkCopy link={banner.inviteLink} /> : null}
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="text-fg-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <InviteDialog
          customRoles={customRoles}
          onClose={() => setInviteOpen(false)}
          onResult={(result) => {
            setInviteOpen(false);
            setBanner(result);
          }}
        />
      ) : null}

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
          Members · {members.length}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
          <div className="divide-y divide-border">
            {members.map((m) => (
              <MemberRow
                key={m.userId}
                member={m}
                isCurrentUser={m.userId === currentUserId}
                canManage={canManage}
                customRoles={customRoles}
                onRoleChanged={(role, customRoleId, customRoleName) =>
                  setMembers((prev) => prev.map((p) => (p.userId === m.userId ? { ...p, role, customRoleId, customRoleName } : p)))
                }
                onRemoved={() => setMembers((prev) => prev.filter((p) => p.userId !== m.userId))}
              />
            ))}
          </div>
        </div>
      </section>

      {invites.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-subtle">
            Pending invitations · {invites.length}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
            <div className="divide-y divide-border">
              {invites.map((i) => (
                <InviteRow
                  key={i.id}
                  invite={i}
                  canManage={canManage}
                  onRevoked={() => setInvites((prev) => prev.filter((p) => p.id !== i.id))}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {canManage ? <InviteDomainsCard initialDomains={emailDomains} /> : null}
    </div>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  canManage,
  customRoles,
  onRoleChanged,
  onRemoved,
}: {
  member: TeamMemberRow;
  isCurrentUser: boolean;
  canManage: boolean;
  customRoles: CustomRoleOption[];
  onRoleChanged: (role: "admin" | "member", customRoleId: string | null, customRoleName: string | null) => void;
  onRemoved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const initials = member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const canEditRole = canManage && member.role !== "owner" && !isCurrentUser;

  function handleRoleSelect(value: string) {
    startTransition(async () => {
      if (value === "admin") {
        const r = await changeTeamMemberRoleAction(member.userId, "admin", null);
        if (r.ok) onRoleChanged("admin", null, null);
      } else if (value === "member") {
        const r = await changeTeamMemberRoleAction(member.userId, "member", null);
        if (r.ok) onRoleChanged("member", null, null);
      } else {
        const role = customRoles.find((r) => r.id === value);
        const r = await changeTeamMemberRoleAction(member.userId, "member", value);
        if (r.ok) onRoleChanged("member", value, role?.name || null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-enterprise-primary text-xs font-bold text-enterprise-on-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {member.name}
            {isCurrentUser ? <span className="ml-2 text-[10px] uppercase tracking-wider text-enterprise-accent">(You)</span> : null}
          </p>
          <p className="truncate text-xs text-fg-muted">{member.email}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {canEditRole ? (
          <select
            defaultValue={member.customRoleId || member.role}
            disabled={isPending}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            <option value="admin">Admin</option>
            <option value="member">Member (default)</option>
            {customRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <span className={"rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " + (roleStyles[member.role] || roleStyles.member)}>
            {member.role === "member" && member.customRoleName ? member.customRoleName : member.role}
          </span>
        )}

        {canManage && member.role !== "owner" && !isCurrentUser ? (
          <button
            onClick={() => {
              if (!confirm(`Remove ${member.name} from this organization?`)) return;
              startTransition(async () => {
                const r = await removeTeamMemberAction(member.userId);
                if (r.ok) onRemoved();
              });
            }}
            disabled={isPending}
            className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
            title="Remove from organization"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  canManage,
  onRevoked,
}: {
  invite: PendingInviteRow;
  canManage: boolean;
  onRevoked: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 p-4 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invite.email}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
          <Clock className="h-3 w-3" />
          Expires {new Date(invite.expiresAt).toLocaleDateString()}
          <span>·</span>
          <span className="capitalize text-enterprise-accent">{invite.customRoleName || invite.role}</span>
        </div>
      </div>
      {canManage ? (
        <button
          onClick={() => {
            if (!confirm("Revoke this invitation?")) return;
            startTransition(async () => {
              const r = await revokeTeamInviteAction(invite.id);
              if (r.ok) onRevoked();
            });
          }}
          disabled={isPending}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
          title="Revoke invitation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function InviteDialog({
  customRoles,
  onClose,
  onResult,
}: {
  customRoles: CustomRoleOption[];
  onClose: () => void;
  onResult: (r: { type: "success" | "error"; message: string; inviteLink?: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [assignment, setAssignment] = useState<"admin" | "member" | "custom">("member");
  const [customRoleId, setCustomRoleId] = useState(customRoles[0]?.id || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold">Invite a teammate</h2>
        <p className="mb-6 text-sm text-fg-muted">They'll receive a link to set their password and join.</p>

        <form
          action={(fd) => {
            startTransition(async () => {
              const result = await inviteTeamMemberAction(fd);
              if (result.ok) {
                onResult({ type: "success", message: result.message || "Invited", inviteLink: (result as any).inviteLink });
              } else {
                onResult({ type: "error", message: result.error || "Failed to invite" });
              }
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="teammate@company.com"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Role</label>
            <select
              name="assignment"
              value={assignment}
              onChange={(e) => setAssignment(e.target.value as "admin" | "member" | "custom")}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
            >
              <option value="admin">Admin — full access</option>
              <option value="member">Member — Overview only</option>
              {customRoles.length > 0 ? <option value="custom">Custom role…</option> : null}
            </select>
          </div>

          {assignment === "custom" && customRoles.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Custom role</label>
              <select
                name="custom_role_id"
                value={customRoleId}
                onChange={(e) => setCustomRoleId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
              >
                {customRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
            >
              {isPending ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteDomainsCard({ initialDomains }: { initialDomains: string[] | null }) {
  const [value, setValue] = useState((initialDomains || []).join("\n"));
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function save() {
    setNotice(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("domains", value);
      const result = await updateInviteDomainsAction(fd);
      setNotice(result.ok ? "Saved." : result.error || "Failed to save.");
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-bg-subtle p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Invite domain restriction</h2>
      <p className="mt-1 text-xs text-fg-muted">
        Optional — restrict invitations to specific email domains (e.g. yourcompany.com). Leave empty to allow any address.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder={"yourcompany.com\npartner.co.ke"}
        className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {notice ? <span className="text-xs text-fg-muted">{notice}</span> : null}
      </div>
    </section>
  );
}

function InviteLinkCopy({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-md border border-border bg-bg-elevated p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Backup link</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-bg px-2 py-1 text-xs">{link}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-2.5 py-1 text-xs font-medium hover:bg-bg-elevated"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
