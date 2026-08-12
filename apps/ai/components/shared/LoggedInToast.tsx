"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Toast } from "@/components/auth/Toast";

/**
 * Shows a "Login successful" toast when the URL has ?loggedIn=1
 * Then strips the query param so it doesn't reappear on refresh.
 * Drop this into any layout or page.
 */
export function LoggedInToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("loggedIn") === "1") {
      setShow(true);
      // Strip the query param
      const params = new URLSearchParams(searchParams.toString());
      params.delete("loggedIn");
      const newQuery = params.toString();
      const newUrl = newQuery ? pathname + "?" + newQuery : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  if (!show) return null;

  return (
    <Toast
      type="success"
      message="You have been signed in."
      onDismiss={() => setShow(false)}
      autoDismissMs={4000}
    />
  );
}
