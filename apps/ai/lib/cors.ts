// apps/ai/lib/cors.ts
//
// Shared cross-origin config for public REST routes called from xobriq.com
// (and any other first-party origin). Extracted from app/api/inquiries/route.ts
// so the origin allowlist has exactly one copy, not one per route that
// silently drifts from the others over time.

const ALLOWED_ORIGINS = [
  "https://xobriq.com",
  "https://www.xobriq.com",
  "https://xobriq-ai-psi.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

const WILDCARD_PATTERNS = [
  /^https:\/\/xobriq-ai-psi-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/xobriq-com-[a-z0-9-]+\.vercel\.app$/,
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return WILDCARD_PATTERNS.some((p) => p.test(origin));
}

export function corsHeaders(origin: string | null, methods = "POST, OPTIONS"): Record<string, string> {
  const allowed = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "https://xobriq.com",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
