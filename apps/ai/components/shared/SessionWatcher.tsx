"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Watches for auth state changes across tabs. If the current user
// changes (or logs out) in ANY tab, this triggers a hard refresh
// so stale data cannot leak between users.
export function SessionWatcher({ userId }: { userId: string | null }) {
  const router = useRouter();
  const initialUserRef = useRef(userId);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only ever act on an explicit, unambiguous SIGNED_OUT or SIGNED_IN
      // event — never on "session is currently null/different" alone.
      // Supabase also fires background events (TOKEN_REFRESHED,
      // INITIAL_SESSION) whenever the tab regains focus — including the
      // focus/blur cycle every mailto:/tel: link causes when it hands off
      // to the OS's mail/phone app and back. If one of those background
      // refreshes ever raced to a transiently-null/stale session, the old
      // `!currentId` check below would force a hard redirect to /login —
      // and if the user really was still signed in, /login would bounce
      // them straight back to /console, re-mounting this watcher and
      // repeating the exact same race on the next focus event: an
      // infinite login<->console redirect loop, observed in practice after
      // clicking a console "Reply" mailto: link on macOS.
      if (event === "SIGNED_OUT") {
        if (initialUserRef.current) window.location.href = "/login";
        return;
      }

      if (event === "SIGNED_IN") {
        const currentId = session?.user?.id ?? null;
        if (currentId && currentId !== initialUserRef.current) {
          // Different user signed in (e.g. in another tab) — reset to a
          // safe landing so this tab re-renders for the new identity.
          window.location.href = "/console";
        }
      }
    });

    // Also detect Local Storage tampering (rare but possible attack surface)
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("sb-") || e.key?.includes("supabase")) {
        router.refresh();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);

  return null;
}