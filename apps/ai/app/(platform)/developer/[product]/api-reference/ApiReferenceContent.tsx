"use client";

import { useState } from "react";
import { CodeBlock, Field, FieldTable, EndpointHeading, KindTabs, type VerificationKind } from "../../_shared/docs-components";

export function ApiReferenceContent({ baseUrl }: { baseUrl: string }) {
  const [kind, setKind] = useState<VerificationKind>("identity");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">API Reference</h2>
        <p className="mt-1 text-sm text-fg-muted">Request/response shapes for every real Xobriq KYC endpoint.</p>
      </div>

      <section>
        <KindTabs kind={kind} onChange={setKind} />
        <div className="mt-4">
          {kind === "identity" ? <IdentityReference baseUrl={baseUrl} /> : null}
          {kind === "phone" ? <PhoneReference baseUrl={baseUrl} /> : null}
          {kind === "business" ? <BusinessReference baseUrl={baseUrl} /> : null}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-fg-subtle">Error responses</h3>
        <p className="mt-2 text-sm text-fg-muted">
          These apply to all three endpoints. A verification that ran but found no match, or where the upstream
          provider call itself failed, is still an HTTP <code className="font-mono">200</code> — check{" "}
          <code className="font-mono">status</code>/<code className="font-mono">matched</code> in the body, don&apos;t
          rely on the HTTP status code alone.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg-subtle text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                <th className="py-2 pl-3 pr-4">HTTP status</th>
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-3">Body</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["200", "Verification ran (matched, not matched, or the provider call itself failed)", '{ "status": "completed" | "failed", "matched": true|false|null, ... }'],
                ["400", "Request body failed validation (missing/malformed field)", '{ "error": "invalid request", "issues": [...] }'],
                ["401", "Missing/invalid/revoked API key", '{ "error": "invalid api key" }'],
                ["402", "Wallet balance is below the price of this verification", '{ "error": "Insufficient wallet balance — ..." }'],
                ["429", "More than 10 verifications from your organization in the last 60 seconds", '{ "error": "Too many verifications — try again in a minute." }'],
                ["500", "Unexpected server error (rare)", '{ "error": "..." } or empty'],
              ].map(([status, when, body]) => (
                <tr key={status} className="border-b border-border/60 text-xs last:border-0">
                  <td className="py-2 pl-3 pr-4 align-top font-mono font-semibold text-fg">{status}</td>
                  <td className="py-2 pr-4 align-top text-fg-muted">{when}</td>
                  <td className="py-2 pr-3 align-top font-mono text-[11px] text-fg-subtle">{body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function IdentityReference({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-4">
      <EndpointHeading kind="identity" baseUrl={baseUrl} />
      <p className="text-sm text-fg-muted">
        Verifies a Kenyan National ID, Alien ID, KRA PIN, bank account, driving licence, or number plate against the
        identity registry, with an optional last-name cross-check.
      </p>
      <FieldTable>
        <Field
          name="identifierType"
          type='"national_id" | "krapinalien_id" | "krapin" | "bank" | "plate" | "dl"'
          required
          notes="Which document identifierNumber is. Passport is not currently supported."
        />
        <Field name="identifierNumber" type="string" required notes="The document/account number, 1–50 characters." />
        <Field
          name="lastName"
          type="string"
          notes="Stored on the record and cross-checked client-side against the result — not sent to the provider."
        />
      </FieldTable>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Request body</p>
        <CodeBlock code={JSON.stringify({ identifierType: "national_id", identifierNumber: "29184023", lastName: "Kamau" }, null, 2)} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Response — match found</p>
        <CodeBlock
          code={JSON.stringify(
            {
              id: "3f9c...",
              ref: "HKY-7QJK2P4X",
              verificationType: "identity",
              status: "completed",
              matched: true,
              result: {
                matched: true,
                fullName: "JANE WANJIRU KAMAU",
                firstName: "JANE",
                lastName: "KAMAU",
                gender: "FEMALE",
                dateOfBirth: "1994-03-12",
                citizenship: "KENYAN",
                idNumber: "29184023",
              },
              errorMessage: null,
              createdAt: "2026-07-30T09:12:03.000Z",
              completedAt: "2026-07-30T09:12:03.800Z",
              durationMs: 812,
            },
            null,
            2
          )}
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Response — no match</p>
        <CodeBlock
          code={JSON.stringify(
            {
              id: "3f9c...",
              ref: "HKY-4M8YV2QA",
              verificationType: "identity",
              status: "completed",
              matched: false,
              result: { matched: false, fullName: null, firstName: null, lastName: null, gender: null, dateOfBirth: null, citizenship: null, idNumber: "00000000" },
              errorMessage: null,
              createdAt: "2026-07-30T09:14:11.000Z",
              completedAt: "2026-07-30T09:14:11.600Z",
              durationMs: 604,
            },
            null,
            2
          )}
        />
      </div>
    </div>
  );
}

function PhoneReference({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-4">
      <EndpointHeading kind="phone" baseUrl={baseUrl} />
      <p className="text-sm text-fg-muted">
        Confirms a mobile number is registered against a given National ID — a boolean match/no-match, not a lookup of
        the number&apos;s owner.
      </p>
      <FieldTable>
        <Field name="nationalId" type="string" required notes="1–50 characters." />
        <Field name="mobileNumber" type="string" required notes="9–15 characters, e.g. 0723456789." />
      </FieldTable>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Request body</p>
        <CodeBlock code={JSON.stringify({ nationalId: "29184023", mobileNumber: "0723456789" }, null, 2)} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Response — matched</p>
        <CodeBlock
          code={JSON.stringify(
            {
              id: "8a1d...",
              ref: "HKY-2VD9XJ6R",
              verificationType: "phone",
              status: "completed",
              matched: true,
              result: { matched: true, mobileNumber: "0723456789" },
              errorMessage: null,
              createdAt: "2026-07-30T09:20:00.000Z",
              completedAt: "2026-07-30T09:20:00.500Z",
              durationMs: 498,
            },
            null,
            2
          )}
        />
      </div>
    </div>
  );
}

function BusinessReference({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="space-y-4">
      <EndpointHeading kind="business" baseUrl={baseUrl} />
      <p className="text-sm text-fg-muted">
        Looks up a business registration number and returns its registration status plus any beneficial owners on
        file (BRS/UBO).
      </p>
      <FieldTable>
        <Field name="registrationNumber" type="string" required notes="1–60 characters, e.g. CPR/2014/475757." />
      </FieldTable>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Request body</p>
        <CodeBlock code={JSON.stringify({ registrationNumber: "CPR/2014/475757" }, null, 2)} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Response — match found</p>
        <CodeBlock
          code={JSON.stringify(
            {
              id: "c72e...",
              ref: "HKY-9F3KQZ8T",
              verificationType: "business",
              status: "completed",
              matched: true,
              result: {
                matched: true,
                status: "ACTIVE",
                businessName: "SUNRISE LOGISTICS LIMITED",
                registrationDate: "2014-06-02",
                physicalAddress: "WESTLANDS, NAIROBI",
                postalAddress: "P.O. BOX 12345-00100, NAIROBI",
                beneficialOwners: [
                  { name: "JANE WANJIRU KAMAU", role: "DIRECTOR", idType: "national_id", idNumber: "29184023", ownershipPercentage: 60 },
                ],
              },
              errorMessage: null,
              createdAt: "2026-07-30T09:25:00.000Z",
              completedAt: "2026-07-30T09:25:01.100Z",
              durationMs: 1100,
            },
            null,
            2
          )}
        />
      </div>
    </div>
  );
}
