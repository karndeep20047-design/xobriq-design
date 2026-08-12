import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Plug,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { meOptions } from "@/lib/kyc-queries";
import { useMounted } from "@/lib/use-mounted";

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "XK";
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "New Verification", icon: ShieldCheck, to: "/verify", badge: "New" },
  { label: "Verifications", icon: FileText, to: "/verifications" },
  { label: "Customers", icon: Users, to: "/customers" },
  { label: "Fraud Alerts", icon: AlertTriangle, to: "/alerts", badge: "3" },
  { label: "API & Webhooks", icon: Plug, to: "/api" },
  { label: "Team", icon: Users, to: "/team" },
  { label: "Billing & Wallet", icon: Wallet, to: "/billing" },
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Support", icon: LifeBuoy, to: "/support" },
];

export function AppSidebar({
  activePath,
  onNavigate,
}: {
  activePath: string;
  onNavigate?: () => void;
}) {
  const mounted = useMounted();
  const { data: me } = useQuery(meOptions(mounted));
  const orgName = me?.orgName || "Loading…";
  const orgPlan = me?.orgPlan ? me.orgPlan[0].toUpperCase() + me.orgPlan.slice(1) : "—";
  const initials = me?.orgName ? initialsFor(me.orgName) : "XK";

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
          const active = activePath === item.to;
          const enabled = true;
          const commonClass = cn(
            "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            !enabled &&
              "cursor-not-allowed opacity-70 hover:bg-transparent hover:text-muted-foreground",
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

          if (!enabled) {
            return (
              <div key={item.label} className={commonClass} aria-disabled>
                {inner}
              </div>
            );
          }

          return (
            <Link key={item.label} to={item.to} onClick={onNavigate} className={commonClass}>
              {inner}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/profile"
        onClick={onNavigate}
        className="m-3 block rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 transition hover:bg-sidebar-accent"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{orgName}</div>
            <div className="truncate text-xs text-muted-foreground">{orgPlan}</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
