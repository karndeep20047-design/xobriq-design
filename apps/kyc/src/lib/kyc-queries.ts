import { queryOptions } from "@tanstack/react-query";
import {
  getMe,
  getVerification,
  getWallet,
  listVerifications,
  listWalletTransactions,
} from "./xobriq-api";

// `enabled` is passed in by the caller (gated on a post-mount "mounted"
// flag, not a typeof-window check) — these calls rely on the browser's
// existing Supabase session cookie (same-origin via the xobriq.ai reverse
// proxy in production), and TanStack Start's SSR loader has no cookie
// forwarding set up, so this must only run client-side, after mount. Gating
// with typeof window at module scope instead of a mounted flag causes a
// hydration mismatch (server renders disabled/no-data, client immediately
// renders enabled/loading) — see useMounted() at ./use-mounted.
export function verificationsListOptions(enabled: boolean) {
  return queryOptions({
    queryKey: ["kyc-verifications"],
    queryFn: () => listVerifications(),
    staleTime: 10_000,
    enabled,
  });
}

export function verificationDetailOptions(idOrRef: string, enabled: boolean) {
  return queryOptions({
    queryKey: ["kyc-verification", idOrRef],
    queryFn: () => getVerification(idOrRef),
    staleTime: 10_000,
    enabled,
  });
}

export function meOptions(enabled: boolean) {
  return queryOptions({
    queryKey: ["kyc-me"],
    queryFn: () => getMe(),
    staleTime: 60_000,
    enabled,
  });
}

export function walletOptions(enabled: boolean) {
  return queryOptions({
    queryKey: ["kyc-wallet"],
    queryFn: () => getWallet(),
    staleTime: 5_000,
    enabled,
  });
}

export function walletTransactionsOptions(enabled: boolean) {
  return queryOptions({
    queryKey: ["kyc-wallet-transactions"],
    queryFn: () => listWalletTransactions(),
    staleTime: 10_000,
    enabled,
  });
}
