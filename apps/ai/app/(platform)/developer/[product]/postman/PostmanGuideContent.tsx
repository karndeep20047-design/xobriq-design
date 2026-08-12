"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, KeyRound } from "lucide-react";
import { CodeBlock, Field, FieldTable, Section, KindTabs, type VerificationKind } from "../../_shared/docs-components";

export function PostmanGuideContent({ baseUrl }: { baseUrl: string }) {
  const [kind, setKind] = useState<VerificationKind>("identity");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Postman Guide</h2>
        <p className="mt-1 text-sm text-fg-muted">
          A complete walkthrough for testing the Xobriq KYC API in Postman using a real Sandbox key — from getting
          your credentials to sending your first request and checking the response.
        </p>
      </div>

      <div className="space-y-3">
        <Section step={1} title="Get your Sandbox credentials">
          <p className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Go to the{" "}
            <Link href="/developer/kyc/api-keys" className="inline-flex items-center gap-1 font-semibold text-enterprise-primary hover:underline">
              <KeyRound className="h-3.5 w-3.5" /> API Keys
            </Link>{" "}
            tab.
          </p>
          <p className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Under{" "}
            <strong className="text-fg">Environment</strong>, choose <strong className="text-fg">Sandbox</strong>,
            give the key a name (e.g. <code className="font-mono">Postman testing</code>), and click{" "}
            <strong className="text-fg">Generate key</strong>.
          </p>
          <p className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Copy the full key immediately —
            it starts with <code className="font-mono">xob_test_</code> and is only ever shown once. If you lose it,
            generate a new one; there&apos;s no way to reveal an old key again.
          </p>
          <p className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-500">
            Sandbox keys run real, billed verifications against the live provider — there is no free/mocked mode
            today. Use small, deliberate test calls rather than a bulk load test.
          </p>
        </Section>

        <Section step={2} title="Create a Postman Environment">
          <p>
            In Postman: <strong className="text-fg">Environments → +</strong> → name it{" "}
            <code className="font-mono">Xobriq KYC – Sandbox</code>. Add two variables:
          </p>
          <FieldTable>
            <Field name="base_url" type="text" notes={`Current value: ${baseUrl}`} />
            <Field name="api_key" type="text" notes="Paste the xob_test_... key you copied in Step 1." />
          </FieldTable>
          <p>Select this environment from the dropdown in the top-right of Postman.</p>
        </Section>

        <Section step={3} title="Create a Collection">
          <p>
            <strong className="text-fg">Collections → +</strong> → name it <code className="font-mono">Xobriq KYC</code>.
            Under the collection&apos;s <strong className="text-fg">Authorization</strong> tab, set Type to{" "}
            <strong className="text-fg">Bearer Token</strong> and Token to <code className="font-mono">{"{{api_key}}"}</code>{" "}
            — every request you add inherits this, so you only set it once.
          </p>
        </Section>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
          Step 4 onward — pick the endpoint you want to test
        </p>
        <KindTabs kind={kind} onChange={setKind} />
      </div>

      <div>
        {kind === "identity" ? <IdentityPostman /> : null}
        {kind === "phone" ? <PhonePostman baseUrl={baseUrl} /> : null}
        {kind === "business" ? <BusinessPostman /> : null}
      </div>
    </div>
  );
}

function IdentityPostman() {
  return (
    <div className="space-y-3">
      <Section step={4} title="New request — verify-identity">
        <p>
          Add a request to the collection → <strong className="text-fg">POST</strong>{" "}
          <code className="font-mono">{"{{base_url}}/api/v1/kyc/verify-identity"}</code>
        </p>
        <p>
          Body tab → <strong className="text-fg">raw</strong> → type <strong className="text-fg">JSON</strong>:
        </p>
        <CodeBlock code={JSON.stringify({ identifierType: "national_id", identifierNumber: "29184023", lastName: "Kamau" }, null, 2)} />
      </Section>
      <Section step={5} title="Send and check the response">
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Status bar reads{" "}
          <code className="font-mono">200 OK</code>.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Body has{" "}
          <code className="font-mono">status: &quot;completed&quot;</code> and a <code className="font-mono">ref</code>{" "}
          starting with <code className="font-mono">HKY-</code>.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> <code className="font-mono">matched</code>{" "}
          is <code className="font-mono">true</code> or <code className="font-mono">false</code> depending on the
          sandbox test ID you used — either is a passing test, both are valid outcomes.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Open the verification in the KYC
          dashboard&apos;s <strong className="text-fg">Verifications</strong> list by its <code className="font-mono">ref</code>{" "}
          to confirm it was recorded.
        </p>
      </Section>
      <Section step={6} title="Try the error paths">
        <p>
          Re-send with <code className="font-mono">identifierType: &quot;passport&quot;</code> → expect{" "}
          <code className="font-mono">400</code> (not a supported value yet).
        </p>
        <p>
          Temporarily set the Bearer token to a garbage string → expect{" "}
          <code className="font-mono">401 {"{ \"error\": \"invalid api key\" }"}</code>.
        </p>
      </Section>
    </div>
  );
}

function PhonePostman({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-3">
      <Section step={4} title="New request — verify-phone">
        <p>
          Add a request → <strong className="text-fg">POST</strong>{" "}
          <code className="font-mono">{"{{base_url}}/api/v1/kyc/verify-phone"}</code>
        </p>
        <p>Body → raw JSON:</p>
        <CodeBlock code={JSON.stringify({ nationalId: "29184023", mobileNumber: "0723456789" }, null, 2)} />
      </Section>
      <Section step={5} title="Send and check the response">
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> <code className="font-mono">200 OK</code>,{" "}
          <code className="font-mono">verificationType: &quot;phone&quot;</code>.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> <code className="font-mono">result.mobileNumber</code>{" "}
          echoes the number you sent.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Re-send with a 6-digit{" "}
          <code className="font-mono">mobileNumber</code> → expect <code className="font-mono">400</code> (below the
          9-character minimum).
        </p>
      </Section>
      <p className="text-xs text-fg-subtle">Base URL reference: {baseUrl}</p>
    </div>
  );
}

function BusinessPostman() {
  return (
    <div className="space-y-3">
      <Section step={4} title="New request — verify-business">
        <p>
          Add a request → <strong className="text-fg">POST</strong>{" "}
          <code className="font-mono">{"{{base_url}}/api/v1/kyc/verify-business"}</code>
        </p>
        <p>Body → raw JSON:</p>
        <CodeBlock code={JSON.stringify({ registrationNumber: "CPR/2014/475757" }, null, 2)} />
      </Section>
      <Section step={5} title="Send and check the response">
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> <code className="font-mono">200 OK</code>,{" "}
          <code className="font-mono">verificationType: &quot;business&quot;</code>.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> If{" "}
          <code className="font-mono">result.beneficialOwners</code> is non-empty, each entry has{" "}
          <code className="font-mono">name</code>/<code className="font-mono">role</code>/
          <code className="font-mono">idNumber</code>/<code className="font-mono">ownershipPercentage</code>.
        </p>
        <p className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-enterprise-primary" /> Re-send with an empty string →
          expect <code className="font-mono">400</code>.
        </p>
      </Section>
      <Section step={6} title="Hit the rate limit on purpose (optional)">
        <p>
          Use Postman&apos;s <strong className="text-fg">Runner</strong> to fire this request 11 times in a row → the
          11th should come back{" "}
          <code className="font-mono">429 {"{ \"error\": \"Too many verifications — try again in a minute.\" }"}</code>.
          Confirms your retry/backoff logic before you rely on it in production.
        </p>
      </Section>
    </div>
  );
}
