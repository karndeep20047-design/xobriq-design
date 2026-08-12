"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { createOrgRoleAction, updateOrgRoleAction, deleteOrgRoleAction } from "./actions";
import { ORG_PERMISSION_KEYS, PERMISSION_LABELS, PERMISSION_GROUPS, type OrgPermissions } from "@/lib/permissions-shared";

type Role = {
  id: string;
  name: string;
  permissions: Partial<OrgPermissions>;
};

export function RolesPageClient({ roles }: { roles: Role[] }) {
  const [formOpen, setFormOpen] = useState<"new" | Role | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-8">
      <Link href="/team" className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Team
      </Link>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-enterprise-accent">Your Organization</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Roles</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Create roles to control exactly which sections of the dashboard and KYC product a teammate can see.
          </p>
        </div>
        <button
          onClick={() => setFormOpen("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover"
        >
          <Plus className="h-4 w-4" /> New role
        </button>
      </div>

      {formOpen ? (
        <RoleForm
          role={formOpen === "new" ? null : formOpen}
          onClose={() => setFormOpen(null)}
        />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-subtle">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <ShieldCheck className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium">No custom roles yet</p>
            <p className="text-xs text-fg-muted">Create one to invite teammates with narrower access than Admin.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {roles.map((r) => <RoleRow key={r.id} role={r} onEdit={() => setFormOpen(r)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleRow({ role, onEdit }: { role: Role; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const grantedCount = ORG_PERMISSION_KEYS.filter((k) => role.permissions[k]).length;

  return (
    <div className="flex items-center justify-between gap-4 p-4 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{role.name}</p>
        <p className="mt-0.5 text-xs text-fg-muted">
          {grantedCount} permission{grantedCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
          title="Edit role"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (!confirm('Delete the "' + role.name + '" role? Anyone assigned to it will lose these permissions.')) return;
            startTransition(async () => { await deleteOrgRoleAction(role.id); });
          }}
          disabled={isPending}
          className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition hover:bg-red-500/10 hover:text-red-400"
          title="Delete role"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RoleForm({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="mb-8 rounded-2xl border border-border bg-bg-subtle p-6 sm:p-8">
      <h2 className="mb-5 text-lg font-semibold">{role ? "Edit role" : "New role"}</h2>

      <form
        action={(fd) => {
          setError("");
          startTransition(async () => {
            const result = role ? await updateOrgRoleAction(role.id, fd) : await createOrgRoleAction(fd);
            if (result.ok) {
              onClose();
            } else {
              setError(result.error || "Failed to save role");
            }
          });
        }}
        className="space-y-6"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Role name</label>
          <input
            name="name"
            required
            defaultValue={role?.name || ""}
            placeholder="Billing Only"
            className="w-full max-w-sm rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>

        <div className="space-y-5">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fg-muted">
                {group.label}
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.keys.map((key) => (
                  <label key={key} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm">
                    <input type="checkbox" name={"perm_" + key} defaultChecked={role?.permissions[key] || false} />
                    {PERMISSION_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium hover:bg-bg-elevated"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save role"}
          </button>
        </div>
      </form>
    </div>
  );
}
