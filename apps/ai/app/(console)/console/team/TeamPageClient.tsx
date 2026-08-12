"use client";

import { useState, useTransition } from "react";
import {
  UserPlus, Trash2, Shield, Mail, Copy, Check, X, RefreshCw, Clock, AlertCircle,
} from "lucide-react";
import {
  inviteStaffAction, revokeInviteAction, changeStaffRoleAction, changeStaffCustomRoleAction, revokeStaffAction,
} from "./actions";
import { ROLE_LABELS, type StaffRole } from "@/lib/session-types";

type StaffRoleOption = { id: string; name: string };

type ActiveStaff = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  xobriq_staff_role: StaffRole;
  custom_staff_role_id: string | null;
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  xobriq_staff_role: StaffRole;
  custom_staff_role_id: string | null;
  custom_staff_role_name: string | null;
  created_at: string;
  expires_at: string;
  token: string;
};

export function TeamPageClient({
  currentUserId,
  activeStaff,
  pendingInvites,
  staffRoles,
}: {
  currentUserId: string;
  activeStaff: ActiveStaff[];
  pendingInvites: PendingInvite[];
  staffRoles: StaffRoleOption[];
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string; inviteLink?: string } | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-enterprise-accent">Xobriq Staff</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Team Management</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Invite team members, assign roles, and manage access.
          </p>
        </div>
        <button
          onClick={() => { setInviteOpen(true); setBanner(null); }}
          className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover"
        >
          <UserPlus className="h-4 w-4" /> Invite staff
        </button>
      </div>

      {/* Banner */}
      {banner ? (
        <div className={"mb-6 rounded-lg border p-4 " + (banner.type === "success" ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {banner.type === "success" ? <Check className="mt-0.5 h-4 w-4 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />}
              <div>
                <p className={"text-sm font-medium " + (banner.type === "success" ? "text-emerald-200" : "text-red-200")}>{banner.message}</p>
                {banner.inviteLink ? <InviteLinkCopy link={banner.inviteLink} /> : null}
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="text-fg-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Invite dialog */}
      {inviteOpen ? (
        <InviteDialog
          staffRoles={staffRoles}
          onClose={() => setInviteOpen(false)}
          onResult={(result) => {
            setInviteOpen(false);
            setBanner(result);
          }}
        />
      ) : null}

      {/* Active staff */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Active staff · {activeStaff.length}</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
          {activeStaff.length === 0 ? (
            <div className="p-10 text-center text-sm text-fg-muted">No active staff yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {activeStaff.map((s) => (
                <StaffRow key={s.id} staff={s} isCurrentUser={s.id === currentUserId} staffRoles={staffRoles} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pending invitations */}
      {pendingInvites.length > 0 ? (
        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Pending invitations · {pendingInvites.length}</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
            <div className="divide-y divide-border">
              {pendingInvites.map((i) => <InviteRow key={i.id} invite={i} onRevoked={(msg) => setBanner(msg)} />)}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ─── Staff row ──────────────────────────────────────────────────────

function StaffRow({ staff, isCurrentUser, staffRoles }: { staff: ActiveStaff; isCurrentUser: boolean; staffRoles: StaffRoleOption[] }) {
  const [isPending, startTransition] = useTransition();
  const initials = (staff.full_name || staff.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-enterprise-primary text-xs font-bold text-enterprise-on-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {staff.full_name || staff.email}
            {isCurrentUser ? <span className="ml-2 text-[10px] uppercase tracking-wider text-enterprise-accent">(You)</span> : null}
          </p>
          <p className="truncate text-xs text-fg-muted">{staff.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <RoleSelect
          value={staff.xobriq_staff_role}
          disabled={isCurrentUser || isPending}
          onChange={(newRole) => {
            startTransition(async () => {
              await changeStaffRoleAction(staff.id, newRole);
            });
          }}
        />

        {staff.xobriq_staff_role !== "super_admin" ? (
          <select
            value={staff.custom_staff_role_id || ""}
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value || null;
              startTransition(async () => {
                await changeStaffCustomRoleAction(staff.id, v);
              });
            }}
            title="Permission role (controls console feature access as it's migrated over)"
            className="rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            <option value="">No permission role</option>
            {staffRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : null}

        {!isCurrentUser ? (
          <button
            onClick={() => {
              if (!confirm("Revoke this person's staff access?")) return;
              startTransition(async () => {
                await revokeStaffAction(staff.id);
              });
            }}
            disabled={isPending}
            className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
            title="Revoke access"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>
    </div>
  );
}

// ─── Invite row ─────────────────────────────────────────────────────

function InviteRow({
  invite,
  onRevoked,
}: {
  invite: PendingInvite;
  onRevoked: (msg: { type: "success" | "error"; message: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.token}` : "";

  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fg-subtle/20 text-fg-muted">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{invite.email}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
            <Clock className="h-3 w-3" />
            Expires {new Date(invite.expires_at).toLocaleDateString()}
            <span> · </span>
            <span className="text-enterprise-accent">{ROLE_LABELS[invite.xobriq_staff_role]}</span>
            {invite.custom_staff_role_name ? (
              <>
                <span> · </span>
                <span>{invite.custom_staff_role_name}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <InviteLinkCopy link={inviteLink} compact />
        <button
          onClick={() => {
            if (!confirm("Revoke this invitation?")) return;
            startTransition(async () => {
              const r = await revokeInviteAction(invite.id);
              onRevoked(r.ok ? { type: "success", message: "Invitation revoked" } : { type: "error", message: "Failed to revoke" });
            });
          }}
          disabled={isPending}
          className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
          title="Revoke invitation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Invite dialog ──────────────────────────────────────────────────

function InviteDialog({
  staffRoles,
  onClose,
  onResult,
}: {
  staffRoles: StaffRoleOption[];
  onClose: () => void;
  onResult: (r: { type: "success" | "error"; message: string; inviteLink?: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<StaffRole>("developer");
  const [customRoleId, setCustomRoleId] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Invite a team member</h2>
          <p className="mt-1 text-sm text-fg-muted">
            They will receive a link to set their password and join Xobriq.
          </p>
        </div>

        <form
          action={(fd) => {
            startTransition(async () => {
              const result = await inviteStaffAction(fd);
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
            <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Full name</label>
            <input
              name="full_name"
              required
              placeholder="Everlyne Mbithuka"
              className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="everlyne.mbithuka@xobriq.com"
              className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Staff role</label>
            <select
              name="xobriq_staff_role"
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <input type="hidden" name="role" value="member" />

          {staffRoles.length > 0 ? (
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Permission role (optional)</label>
              <select
                value={customRoleId}
                onChange={(e) => setCustomRoleId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-enterprise-primary"
              >
                <option value="">No permission role</option>
                {staffRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <input type="hidden" name="custom_staff_role_id" value={customRoleId} />
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-bg-subtle px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Role select ────────────────────────────────────────────────────

function RoleSelect({
  value,
  disabled,
  onChange,
}: {
  value: StaffRole;
  disabled?: boolean;
  onChange: (r: StaffRole) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StaffRole)}
      className="rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"
    >
      {Object.entries(ROLE_LABELS).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}

// ─── Invite link copy ───────────────────────────────────────────────

function InviteLinkCopy({ link, compact }: { link: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (compact) {
    return (
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2.5 py-1 text-xs font-medium hover:bg-bg-elevated"
        title="Copy invite link"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-border bg-bg-elevated p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Backup link (in case the invite email doesn't arrive)</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-bg-subtle px-2 py-1 text-xs">{link}</code>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-subtle px-2.5 py-1 text-xs font-medium hover:bg-bg-elevated"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
