"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { NotificationItem } from "@/components/dashboard/NotificationBell";
import type { OrgPermissions } from "@/lib/permissions-shared";

// Fed once, server-side, by app/(kyc)/dashboard/xobriqKYC/layout.tsx — every
// page under that segment nests inside this provider, so components like
// AppSidebar can read the real org name/plan without each page re-fetching
// or re-threading it through props. Replaces the old apps/kyc setup, where
// the sidebar fetched this itself via a client-side query against
// /api/v1/kyc/me and showed "Loading…" until it resolved (or forever, if it
// didn't) — this is real data on first paint instead.
export type KycIdentity = {
  orgName: string | null;
  orgPlan: string | null;
  alertsCount: number;
  notifications: NotificationItem[];
  // The signed-in member's kyc_* section access — AppSidebar filters its nav
  // items against this the same way DashboardShell filters the main app's.
  permissions: OrgPermissions;
};

const KycIdentityContext = createContext<KycIdentity | null>(null);

export function KycIdentityProvider({
  identity,
  children,
}: {
  identity: KycIdentity;
  children: ReactNode;
}) {
  return (
    <KycIdentityContext.Provider value={identity}>{children}</KycIdentityContext.Provider>
  );
}

export function useKycIdentity(): KycIdentity {
  const ctx = useContext(KycIdentityContext);
  if (!ctx) throw new Error("useKycIdentity must be used within KycIdentityProvider");
  return ctx;
}
