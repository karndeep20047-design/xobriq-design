"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Key, CreditCard, Settings,
  Search, Menu, X, UserCog, FileClock,
} from "lucide-react";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/NotificationBell";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { SignOutConfirm } from "@/components/shared/SignOutConfirm";
import type { MemberAccess, OrgPermissionKey } from "@/lib/permissions";

type DashboardUser = {
  displayName: string;
  firstName: string;
  email: string;
  orgName: string | null;
  memberSince: string;
};

const DashboardContext = createContext<DashboardUser | null>(null);

export function useDashboardUser(): DashboardUser {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardUser must be used within DashboardShell");
  return ctx;
}

const PermissionsContext = createContext<MemberAccess | null | undefined>(undefined);

// Returns undefined only if called outside DashboardShell entirely (a real
// bug); null is a valid, meaningful value — "signed in, but no organization
// yet" — so callers must handle it, not treat it as "not mounted yet".
export function usePermissions(): MemberAccess | null {
  const ctx = useContext(PermissionsContext);
  if (ctx === undefined) throw new Error("usePermissions must be used within DashboardShell");
  return ctx;
}

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  permission?: OrgPermissionKey;
};

// Settings has no `permission` — My Account applies to every member
// regardless of role, so it's deliberately always visible. Everything else
// is a genuinely gated page: owner/admin see it automatically (ALL_TRUE in
// lib/permissions.ts), anyone else needs the permission explicitly granted.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard, permission: "dashboard" },
  { href: "/team", label: "Team", Icon: UserCog, permission: "team" },
  { href: "/audit", label: "Audit Log", Icon: FileClock, permission: "audit_log" },
  { href: "/developer", label: "Developer - API & Integration", Icon: Key, permission: "api_keys" },
  { href: "/billing", label: "Billing", Icon: CreditCard, permission: "billing" },
  { href: "/settings", label: "Settings", Icon: Settings },
];

function filterNavForAccess(nav: NavItem[], access: MemberAccess | null): NavItem[] {
  return nav.filter((item) => !item.permission || (access ? access.permissions[item.permission] : false));
}

export function DashboardShell({
  user,
  access,
  notifications,
  children,
}: {
  user: DashboardUser;
  access: MemberAccess | null;
  notifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const nav = filterNavForAccess(NAV, access);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <DashboardContext.Provider value={user}>
    <PermissionsContext.Provider value={access}>
      <div className="flex min-h-screen bg-bg text-fg">
        <SidebarNav pathname={pathname} nav={nav} />

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-bg-subtle">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <BrandLogo />
                <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-md" aria-label="Close menu">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavList pathname={pathname} nav={nav} onNavigate={() => setMobileOpen(false)} />
              <SignOutConfirm triggerClassName="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg" />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-bg-subtle md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <SearchPill onOpen={() => setPaletteOpen(true)} />
              <NotificationBell initialNotifications={notifications} />
              <UserMenu displayName={user.displayName} email={user.email} orgName={user.orgName} />
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </PermissionsContext.Provider>
    </DashboardContext.Provider>
  );
}

function BrandLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 no-underline transition-opacity hover:opacity-80">
      <Image src="/xobriq-logo.png" alt="Xobriq" width={120} height={32} className="h-7 w-auto" priority />
    </Link>
  );
}

function SidebarNav({ pathname, nav }: { pathname: string; nav: NavItem[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-subtle md:flex">
      <div className="border-b border-border px-5 py-5">
        <BrandLogo />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Client Portal</p>
      </div>
      <NavList pathname={pathname} nav={nav} />
      <SignOutConfirm triggerClassName="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg" />
    </aside>
  );
}

function NavList({ pathname, nav, onNavigate }: { pathname: string; nav: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.Icon;
        const cls = active
          ? "flex items-center gap-3 rounded-lg bg-enterprise-primary/10 px-3 py-2 text-sm font-medium text-enterprise-primary"
          : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg";
        return (
          <Link key={item.href} href={item.href} className={cls} onClick={onNavigate}>
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SearchPill({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-xs text-fg-subtle transition-colors hover:border-enterprise-primary/40 lg:flex"
      aria-label="Search"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search…</span>
      <kbd className="ml-4 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}
