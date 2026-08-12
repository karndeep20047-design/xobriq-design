import Link from "next/link";
import { headers } from "next/headers";
import { MetaPixel } from "@/components/shared/MetaPixel";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-csp-nonce") ?? undefined;

  return (
    <div className="relative flex min-h-screen flex-col bg-enterprise-bg text-enterprise-fg">
      <MetaPixel nonce={nonce} />
      <div className="tech-grid pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] z-0 h-[40%] w-[40%] rounded-full bg-enterprise-primary/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] z-0 h-[30%] w-[30%] rounded-full bg-enterprise-primary/15 blur-[100px]" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-6">
        {children}
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-3 px-6 py-8 sm:px-12">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-2">
          <Link href="/privacy" className="label-caps text-enterprise-fg-subtle hover:text-enterprise-fg">Privacy Policy</Link>
          <Link href="/terms" className="label-caps text-enterprise-fg-subtle hover:text-enterprise-fg">Terms of Service</Link>
          <Link href="/security" className="label-caps text-enterprise-fg-subtle hover:text-enterprise-fg">Security Compliance</Link>
        </div>
        <p className="label-caps text-enterprise-fg-subtle/70">
          © {new Date().getFullYear()} Xobriq Technologies · Secured by Enterprise Shield
        </p>
      </footer>
    </div>
  );
}