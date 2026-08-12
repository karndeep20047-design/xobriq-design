// Single source of truth for the public API base URL shown in docs, code
// samples, and the key manager. There is no api.xobriq.ai subdomain yet —
// that's a DNS/infra decision, not something changed here — so every
// reference to the public API host reads from this one constant instead
// of being hardcoded per-file, making the eventual switch a one-line
// change instead of a docs-wide find-and-replace.
export const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://xobriq.ai";

export const API_VERSION = "v1";
