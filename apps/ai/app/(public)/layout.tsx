import { headers } from "next/headers";
import { Footer } from "@/components/shared/Footer";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { Chatbot } from "@/components/shared/Chatbot";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { MetaPixel } from "@/components/shared/MetaPixel";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <MetaPixel nonce={nonce} />
      <PublicNavbar />
      <main className="flex-1 relative z-10 bg-white dark:bg-[#030303] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.85)]">{children}</main>
      <Footer />
      <Chatbot />
      <CookieBanner />
    </div>
  );
}