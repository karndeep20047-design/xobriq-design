"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useKycIdentity } from "@/components/kyc/identity-context";

const BASE = "/dashboard/xobriqKYC";

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "XK";
  return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

// The workspace-settings entry point used to live only on the Business
// Profile page's header action button — moved here so it's reachable from
// every KYC dashboard page via this shared navbar, not just one of them.
export function NavbarProfileMenu() {
  const { orgName, orgPlan } = useKycIdentity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayName = orgName || "Workspace";
  const displayPlan = orgPlan ? orgPlan[0].toUpperCase() + orgPlan.slice(1) : null;
  const initials = orgName ? initialsFor(orgName) : "XK";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 transition hover:bg-accent"
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown className={"h-3.5 w-3.5 text-muted-foreground transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-popover shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {displayPlan ? <p className="mt-0.5 text-xs text-muted-foreground">{displayPlan} plan</p> : null}
          </div>
          <div className="p-1.5">
            <Link
              href={`${BASE}/settings`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4" /> Workspace settings
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
