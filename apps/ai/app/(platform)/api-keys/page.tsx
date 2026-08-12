import { redirect } from "next/navigation";

// /api-keys is kept as a backward-compatible bookmark — the real page
// (same ApiKeysClient/actions, unchanged) now lives under the Developer
// Portal's per-product workspace at /developer/kyc/api-keys.
export default function ApiKeysPage() {
  redirect("/developer/kyc/api-keys");
}
