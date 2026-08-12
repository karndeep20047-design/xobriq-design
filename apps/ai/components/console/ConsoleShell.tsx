"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Building2, FileText, Activity, ShieldCheck,
  Newspaper, UserCog, Settings, Menu, X, Sparkles, Inbox, Fingerprint,
  PackageCheck, KeyRound, Key, Bell, Clock, Calendar, UserPlus, LifeBuoy,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { SessionWatcher } from "@/components/shared/SessionWatcher";
import { SignOutConfirm } from "@/components/shared/SignOutConfirm";
import { markConsoleNotificationsSeenAction } from "@/app/(console)/actions";
import { ROLE_LABELS, type StaffProfile } from "@/lib/session-types";
import type { StaffAccess } from "@/lib/staff-permissions-shared";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
  badge?: string;
};

const PRODUCT_LABELS: Record<string, string> = {
  kyc: "Xobriq KYC",
  guard: "Xobriq Guard",
  cloud: "Xobriq Cloud",
  agentic: "Xobriq Agentic",
  consult: "Xobriq Consult",
  cyber: "Xobriq Cyber",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export type PendingProductAccessRequest = {
  id: string;
  orgName: string;
  productSlug: string;
  requestedAt: string;
};

export type RecentSignup = {
  id: string;
  name: string;
  billingEmail: string | null;
  createdAt: string;
};

export function ConsoleShell({
  staff,
  access,
  pendingProductAccessRequests = [],
  recentSignups = [],
  newSinceSeenCount = 0,
  children,
}: {
  staff: StaffProfile;
  access: StaffAccess | null;
  pendingProductAccessRequests?: PendingProductAccessRequest[];
  recentSignups?: RecentSignup[];
  newSinceSeenCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const role = staff.xobriq_staff_role;
  const pendingCount = pendingProductAccessRequests.length;
  const signupCount = recentSignups.length;
  const totalCount = pendingCount + signupCount;
  const has = (key: keyof StaffAccess["permissions"]) => !!access?.isSuperAdmin || !!access?.permissions[key];
  const showBell = has("product_access") || has("clients");

  const nav: NavItem[] = [
    { href: "/console", label: "Overview", Icon: LayoutDashboard, visible: true },
    { href: "/console/team", label: "Team", Icon: UserCog, visible: has("team") },
    { href: "/console/clients", label: "Clients", Icon: Building2, visible: has("clients") },
    { href: "/console/blog", label: "Blog CMS", Icon: Newspaper, visible: has("blog_write") },
    { href: "/console/inquiries", label: "Inquiries", Icon: Inbox, visible: has("inquiries") },
    { href: "/console/support", label: "Support", Icon: LifeBuoy, visible: has("support") },
    {
      href: "/console/product-access",
      label: "Product Access",
      Icon: PackageCheck,
      visible: has("product_access"),
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    { href: "/console/subscriptions", label: "Subscriptions", Icon: Calendar, visible: has("subscriptions") },
    { href: "/console/api-usage", label: "API Usage", Icon: Key, visible: has("api_usage") },
    { href: "/console/metrics", label: "Metrics", Icon: Activity, visible: has("metrics") },
    { href: "/console/guard", label: "Guard Live", Icon: ShieldCheck, visible: has("guard") },
    { href: "/console/kyc", label: "KYC Operations", Icon: Fingerprint, visible: has("kyc_ops") },
    { href: "/console/audit", label: "Audit Log", Icon: FileText, visible: has("audit") },
    { href: "/console/roles", label: "Staff Roles", Icon: KeyRound, visible: has("manage_roles") },
    { href: "/console/settings", label: "Settings", Icon: Settings, visible: true },
  ].filter((item) => item.visible);

  const initials = (staff.full_name || staff.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <SessionWatcher userId={staff.id} />

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-subtle md:flex">
        <div className="border-b border-border px-5 py-5">
          <Link href="/console" className="flex items-center gap-2">
            <Image src="/xobriq-logo-horizontal.png" alt="Xobriq" width={180} height={60} className="h-12 w-auto object-contain" />
          </Link>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-fg-subtle">Internal Console</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/console" && pathname.startsWith(item.href));
            const Icon = item.Icon;
            const cls = active
              ? "flex items-center gap-3 rounded-lg bg-enterprise-primary/10 px-3 py-2 text-sm font-medium text-enterprise-primary"
              : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg";
            return (
              <Link key={item.href} href={item.href} className={cls}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge ? <span className="ml-auto rounded bg-enterprise-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-enterprise-primary">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-enterprise-primary text-xs font-bold text-enterprise-on-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{staff.full_name || staff.email}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-fg-subtle">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <SignOutConfirm
            wrapperClassName="mt-2"
            triggerClassName="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-bg-subtle">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Image src="/xobriq-logo-horizontal.png" alt="Xobriq" width={150} height={50} className="h-10 w-auto object-contain" />
              <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {nav.map((item) => {
                const Icon = item.Icon;
                const active = pathname === item.href;
                const cls = active
                  ? "flex items-center gap-3 rounded-lg bg-enterprise-primary/10 px-3 py-2 text-sm font-medium text-enterprise-primary"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-bg-elevated hover:text-fg";
                return (
                  <Link key={item.href} href={item.href} className={cls} onClick={() => setMobileOpen(false)}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <SignOutConfirm
              triggerClassName="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted hover:bg-bg-elevated"
              iconClassName="h-4 w-4"
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-md border border-border bg-bg-subtle md:hidden">
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Sparkles className="h-3.5 w-3.5 text-enterprise-accent" />
            Xobriq Internal · Development environment
          </div>
          <div className="flex items-center gap-2">
            {showBell ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => {
                      const next = !v;
                      // Opening (not closing) is what counts as "viewed" —
                      // clears the badge without touching the underlying
                      // pending queue, which the dropdown still lists in full.
                      if (next) markConsoleNotificationsSeenAction();
                      return next;
                    });
                  }}
                  className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-bg-subtle text-fg-muted hover:text-fg"
                >
                  <Bell className="h-4 w-4" />
                  {newSinceSeenCount > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-enterprise-primary px-1 text-[10px] font-bold text-enterprise-on-primary">
                      {newSinceSeenCount}
                    </span>
                  ) : null}
                </button>
                {notifOpen ? (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-bg-elevated shadow-2xl">
                      {totalCount === 0 ? (
                        <>
                          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</div>
                          <p className="p-4 text-sm text-fg-muted">Nothing new — you&apos;re all caught up.</p>
                        </>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          {signupCount > 0 ? (
                            <div>
                              <div className="border-b border-border bg-bg-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                                New signups
                              </div>
                              <div className="divide-y divide-border">
                                {recentSignups.map((s) => (
                                  <Link
                                    key={s.id}
                                    href="/console/clients"
                                    onClick={() => setNotifOpen(false)}
                                    className="block px-4 py-3 text-sm hover:bg-bg-subtle"
                                  >
                                    <p className="flex items-center gap-1.5 font-medium">
                                      <UserPlus className="h-3.5 w-3.5 text-enterprise-primary" />
                                      {s.name}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-fg-subtle">{s.billingEmail}</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                                      <Clock className="h-3 w-3" /> {timeAgo(s.createdAt)}
                                    </p>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {pendingCount > 0 ? (
                            <div>
                              <div className="border-b border-border bg-bg-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                                Product access requests
                              </div>
                              <div className="divide-y divide-border">
                                {pendingProductAccessRequests.map((r) => (
                                  <Link
                                    key={r.id}
                                    href="/console/product-access"
                                    onClick={() => setNotifOpen(false)}
                                    className="block px-4 py-3 text-sm hover:bg-bg-subtle"
                                  >
                                    <p className="font-medium">
                                      {r.orgName} requested {PRODUCT_LABELS[r.productSlug] || r.productSlug}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                                      <Clock className="h-3 w-3" /> {timeAgo(r.requestedAt)}
                                    </p>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                      <Link
                        href="/console/clients"
                        onClick={() => setNotifOpen(false)}
                        className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-enterprise-primary hover:bg-bg-subtle"
                      >
                        View all clients
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
            <ThemeToggle />
            <Link href="/" className="hidden rounded-md px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg sm:inline-flex">
              View site →
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
