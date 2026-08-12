"use client";

import { useEffect, useState } from "react";

// No debounce utility exists elsewhere in this codebase yet — every other
// console search input (Clients, Inquiries) filters synchronously on each
// keystroke against already-loaded rows, which is fine for a client-side
// filter but not for one that triggers a server round trip per keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
