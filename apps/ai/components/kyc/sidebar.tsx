"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";

import { LogoutButton } from "@/components/kyc/logout-button";
import { useKycIdentity } from "@/components/kyc/identity-context";
import type { OrgPermissionKey, OrgPermissions } from "@/lib/permissions-shared";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/xobriqKYC";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  badge?: string;
  permission: OrgPermissionKey;
};

// Same pattern as components/dashboard/DashboardShell.tsx's
// filterNavForAccess — a role that doesn't grant a section shouldn't even
// see it listed, not just get bounced if they follow the link.
function filterNavForAccess(nav: NavItem[], permissions: OrgPermissions): NavItem[] {
  return nav.filter((item) => permissions[item.permission]);
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { alertsCount, permissions } = useKycIdentity();

  // Team, Customers, and API & Webhooks were removed — Team is now the
  // org-wide /team page (real role/invite management, not duplicated here),
  // and API & Webhooks overlapped with the real /api-keys page. Billing &
  // Wallet moved to the org-wide /billing page, and Settings was a mock
  // stub with no real logic behind it.
  const navItems: NavItem[] = filterNavForAccess(
    [
      { label: "Dashboard", icon: LayoutDashboard, to: BASE, permission: "kyc_dashboard" },
      { label: "New Verification", icon: ShieldCheck, to: `${BASE}/verify`, badge: "New", permission: "kyc_verify" },
      { label: "Verifications", icon: FileText, to: `${BASE}/verifications`, permission: "kyc_verifications" },
      {
        label: "Fraud Alerts",
        icon: AlertTriangle,
        to: `${BASE}/alerts`,
        badge: alertsCount > 0 ? String(alertsCount) : undefined,
        permission: "kyc_alerts",
      },
      { label: "Support", icon: LifeBuoy, to: `${BASE}/support`, permission: "kyc_support" },
    ],
    permissions
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-elev)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-base font-semibold tracking-tight">XOBRIQ KYC</div>
          <div
            className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            title="AI-Powered Verification"
          >
            AI-Powered Verification
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.to === BASE ? pathname === BASE : pathname.startsWith(item.to);
          const commonClass = cn(
            "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          );
          const inner = (
            <>
              <span className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    item.badge === "New"
                      ? "bg-success/15 text-success"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </>
          );

          return (
            <Link key={item.label} href={item.to} onClick={onNavigate} className={commonClass}>
              {inner}
            </Link>
          );
        })}
      </nav>

      <div className="m-3">
        <LogoutButton className="w-full justify-center gap-2" />
      </div>
    </div>
  );
}
