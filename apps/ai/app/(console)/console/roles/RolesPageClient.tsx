"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { createStaffRoleAction, updateStaffRoleAction, deleteStaffRoleAction } from "./actions";
import { STAFF_PERMISSION_KEYS, STAFF_PERMISSION_LABELS, type StaffPermissions } from "@/lib/staff-permissions-shared";
import { ConsolePageHeader, ConsoleCard, EmptyState } from "@/components/console/ConsolePageHeader";

type Role = {
  id: string;
  name: string;
  permissions: Partial<StaffPermissions>;
};

export function RolesPageClient({ roles }: { roles: Role[] }) {
  const [formOpen, setFormOpen] = useState<"new" | Role | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-8">
      <ConsolePageHeader
        eyebrow="Internal"
        title="Staff Roles"
        description="Create roles to control exactly which console features a staff member can access. The super_admin bootstrap role always has full access regardless of custom roles."
        actions={
          <button
            onClick={() => setFormOpen("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-4 py-2 text-sm font-semibold text-enterprise-on-primary transition hover:bg-enterprise-primary-hover"
          >
            <Plus className="h-4 w-4" /> New role
          </button>
        }
      />

      {formOpen ? (
        <RoleForm
          role={formOpen === "new" ? null : formOpen}
          onClose={() => setFormOpen(null)}
        />
      ) : null}

      <ConsoleCard>
        {roles.length === 0 ? (
          <EmptyState
            Icon={ShieldCheck}
            title="No custom staff roles yet"
            message="Create one to give a staff member access to specific console features instead of relying on the fixed role list."
          />
        ) : (
          <div className="divide-y divide-border">
            {roles.map((r) => <RoleRow key={r.id} role={r} onEdit={() => setFormOpen(r)} />)}
          </div>
        )}
      </ConsoleCard>
    </div>
  );
}

function RoleRow({ role, onEdit }: { role: Role; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();
  const grantedCount = STAFF_PERMISSION_KEYS.filter((k) => role.permissions[k]).length;

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
            startTransition(async () => { await deleteStaffRoleAction(role.id); });
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
            const result = role ? await updateStaffRoleAction(role.id, fd) : await createStaffRoleAction(fd);
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
            placeholder="Support Lead"
            className="w-full max-w-sm rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-enterprise-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-fg-muted">Permissions</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {STAFF_PERMISSION_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2.5 text-sm">
                <input type="checkbox" name={"perm_" + key} defaultChecked={role?.permissions[key] || false} />
                {STAFF_PERMISSION_LABELS[key]}
              </label>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-xred-500">{error}</p> : null}

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
