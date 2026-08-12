import { headers } from "next/headers";
import { MetaPixel } from "@/components/shared/MetaPixel";

// Docs pages had no group-specific layout before — they rendered directly
// under the root layout, which is where the Meta Pixel used to live. This
// preserves that same tracking coverage (public developer docs are still a
// real marketing/interest signal) now that the pixel only loads from each
// route group's own layout instead of the root one.
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <>
      <MetaPixel nonce={nonce} />
      {children}
    </>
  );
}
