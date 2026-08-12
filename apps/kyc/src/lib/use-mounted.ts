import { useEffect, useState } from "react";

// Returns false on the server and on the client's first render (which must
// match the server's output to avoid a hydration mismatch), then flips to
// true once mounted in the browser. Used to gate client-only data fetching
// (see kyc-queries.ts) instead of a typeof-window check, which would make
// the first client render differ from the server's and trigger exactly the
// mismatch this avoids.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
