// Vitest-only stand-in for the "server-only" package (see vitest.config.ts's
// resolve.alias) — the real package intentionally throws when imported
// outside a Next.js Server Component, which is correct in the app but
// would make any tested module that imports it (e.g. lib/api-usage/csv.ts)
// fail to load under plain Node.
export {};
