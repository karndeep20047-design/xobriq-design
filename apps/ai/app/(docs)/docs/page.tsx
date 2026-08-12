import Link from "next/link";
import { Copy, KeyRound, Rocket, BookOpen, ShieldCheck, Cloud, Bot } from "lucide-react";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsTopbar } from "@/components/docs/DocsTopbar";

export const metadata: Metadata = {
  title: "Documentation — Xobriq.AI",
  description: "Explore Xobriq guides and references.",
};

type StartCard = { href: string; title: string; body: string; Icon: ComponentType<LucideProps> };

const startCards: StartCard[] = [
  { href: "/docs/quickstart", title: "Quickstart", body: "Create an account, get an API key, and run your first Guard score in under five minutes.", Icon: Rocket },
  { href: "/docs/api-keys", title: "Create an API key", body: "Generate sandbox and production keys to manage your access to Xobriq resources.", Icon: KeyRound },
  { href: "/docs/concepts", title: "Concepts", body: "Learn the key concepts and terminology used across the Xobriq platform.", Icon: BookOpen },
  { href: "/docs/guard", title: "Guard API", body: "Real-time fraud, deepfake, identity, and behavioural detection for financial institutions.", Icon: ShieldCheck },
  { href: "/docs/cloud", title: "Cloud", body: "Spin up DGX H200 GPU instances or reserve capacity with per-second billing.", Icon: Cloud },
  { href: "/docs/agentic", title: "Agentic", body: "Deploy autonomous agents for fraud, KYC, compliance, and security operations.", Icon: Bot },
];

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <DocsTopbar />

      <div className="flex flex-1">
        <DocsSidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
            <p className="text-sm font-medium text-enterprise-primary">Get started</p>

            <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Welcome to Xobriq</h1>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-elevated">
                <Copy className="h-4 w-4" />
                Copy page
              </button>
            </div>

            <p className="mt-4 text-base leading-7 text-fg-muted">
              Explore our guides and examples to deploy intelligence, security, and infrastructure workloads on Xobriq.
            </p>

            <section className="mt-12">
              <h2 className="text-2xl font-bold tracking-tight">Get started instantly</h2>
              <p className="mt-3 text-fg-muted">
                Xobriq is an enterprise intelligence platform built for banks, fintechs, telcos, insurers, and government agencies. Whether integrating fraud APIs, deploying autonomous agents, or training models on sovereign GPU infrastructure — Xobriq gives you scalable, compliant, sub-200ms inference from Nairobi.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {startCards.map((card) => {
                  const Icon = card.Icon;
                  return (
                    <Link key={card.href} href={card.href} className="block rounded-xl border border-border bg-bg-subtle p-5 transition hover:border-border-strong hover:bg-bg-elevated">
                      <Icon className="h-5 w-5 text-enterprise-primary" />
                      <h3 className="mt-4 text-base font-semibold text-fg">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-fg-muted">{card.body}</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-16">
              <h2 className="text-2xl font-bold tracking-tight">Use our public endpoints</h2>
              <p className="mt-3 text-fg-muted">
                Xobriq offers <strong className="text-fg">Public Endpoints</strong> for instant API access to pre-deployed models for fraud, deepfake detection, document verification, and behavioural analysis.
              </p>

              <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-bg-elevated p-5 font-mono text-xs leading-7 text-fg sm:text-sm">
{"`curl -X POST https://api.xobriq.com/v1/guard/score \\\n  -H \"Authorization: Bearer $XOBRIQ_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"transaction_id\": \"txn_12345\",\n    \"amount\": 150000,\n    \"currency\": \"KES\",\n    \"device_fingerprint\": \"fp_xyz\"\n  }'`"}
              </pre>
            </section>

            <div className="mt-16 flex items-center justify-between border-t border-border pt-8 text-sm">
              <span className="text-fg-subtle">Get started</span>
              <Link href="/docs/quickstart" className="font-medium text-enterprise-primary hover:underline">Next: Quickstart →</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}