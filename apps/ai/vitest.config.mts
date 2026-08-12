import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = import.meta.dirname;

// Minimal config — this repo has no test runner otherwise, so this only
// needs to resolve the same "@/*" alias tsconfig.json already defines and
// point at the *.test.ts files living next to the code they cover.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "."),
      // The real "server-only" package throws when imported outside a
      // Next.js Server Component — exactly what it's for in the app, but
      // it also means any tested module that imports it (e.g. csv.ts)
      // can't load under plain Node/Vitest. Swap in a no-op here only.
      "server-only": path.resolve(rootDir, "test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
