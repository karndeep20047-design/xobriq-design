"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "../../_shared/docs-components";

export function QuickStartContent({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Quick Start</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Environments and authentication — generate a key on the API Keys tab first, then follow the Postman Guide
          for a full step-by-step walkthrough.
        </p>
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-fg-subtle">Environments</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-subtle p-4">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
              Sandbox
            </span>
            <p className="mt-2 text-xs text-fg-muted">
              Use for building and testing your integration. Generate a key with environment{" "}
              <strong className="text-fg">Sandbox</strong> on the API Keys tab — it has the prefix{" "}
              <code className="font-mono">xob_test_</code>.
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Base URL: <code className="rounded bg-bg px-1 py-0.5 font-mono text-[11px]">{baseUrl}</code>
            </p>
            <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-500">
              Sandbox calls still debit your wallet at your configured per-check rate — there is no free/unmetered
              mode. Top up before load-testing.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-subtle p-4">
            <span className="rounded-full bg-fg-subtle/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Production
            </span>
            <p className="mt-2 text-xs text-fg-muted">
              Live verifications, billed at your contracted rate. Generate a key with environment{" "}
              <strong className="text-fg">Production</strong> — prefix <code className="font-mono">xob_live_</code>.
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Base URL: <code className="rounded bg-bg px-1 py-0.5 font-mono text-[11px]">{baseUrl}</code>
            </p>
            <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/5 p-2 text-[11px] text-red-400">
              Don&apos;t hardcode a live key in client-side code or a mobile app — call it from your own backend.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-fg-subtle">Authentication</h3>
        <p className="mt-2 text-sm text-fg-muted">
          Every request needs your API key as a Bearer token, plus a JSON content type. No other signing/session is
          required — the key alone identifies your organization.
        </p>
        <div className="mt-3">
          <CodeBlock code={`Authorization: Bearer xob_test_5f2a...\nContent-Type: application/json`} lang="headers" />
        </div>
      </section>

      <div className="rounded-xl border border-enterprise-primary/30 bg-enterprise-primary/5 p-5">
        <p className="text-sm font-semibold text-fg">Ready to send your first request?</p>
        <p className="mt-1 text-xs text-fg-muted">
          The Postman Guide walks through getting your Sandbox key, setting up a Postman environment/collection, and
          testing each endpoint step by step.
        </p>
        <Link
          href="/developer/kyc/postman"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-enterprise-primary hover:underline"
        >
          Open the Postman Guide <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
