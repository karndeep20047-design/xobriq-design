import Link from "next/link";
import { BookOpen, Code2, KeyRound, Terminal, Package, GitBranch, ArrowRight } from "lucide-react";

export default function DevelopersPage() {
  const cards = [
    { icon: BookOpen, title: "Documentation", body: "Full API reference, guides, and integration walkthroughs.", href: "/docs" },
    { icon: KeyRound, title: "Get API Keys", body: "Generate sandbox and production keys in seconds.", href: "/register" },
    { icon: Package, title: "SDKs & Libraries", body: "Native SDKs for Python, Node.js, Go, Java, Ruby, .NET.", href: "/docs/sdks" },
    { icon: Terminal, title: "CLI", body: "Deploy, monitor and manage resources from your terminal.", href: "/docs/cli" },
    { icon: Code2, title: "Playground", body: "Test Guard scoring, agent workflows, and Cloud jobs live.", href: "/docs/playground" },
    { icon: GitBranch, title: "Release Notes", body: "Stay up to date with the latest platform releases.", href: "/docs/release-notes" },
  ];
  return (
    <div className="bg-enterprise-bg text-enterprise-fg">
      <section className="px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <span className="label-caps-thin text-enterprise-accent">Developer Hub</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Build with Xobriq.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-enterprise-fg-muted">Everything you need to integrate, extend, and ship on the Xobriq platform — from first API call to production deployment.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 text-sm font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/docs" className="inline-flex items-center gap-2 rounded-lg border border-enterprise-border bg-enterprise-bg-low px-6 py-3 text-sm font-semibold hover:border-enterprise-border-strong">Read Docs</Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.title} href={c.href} className="glass-panel group rounded-2xl p-6 transition hover:border-enterprise-primary/50">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/15"><Icon className="h-5 w-5 text-enterprise-primary" /></div>
                <h3 className="mt-5 font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-enterprise-fg-muted">{c.body}</p>
                <span className="label-caps-thin mt-5 inline-flex items-center gap-2 text-enterprise-primary">Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}