import { DocShell, H2, P, Code, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Webhooks — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Webhooks" intro="Receive push events for decisions, escalations, and cases." prev={{ href: "/docs/guard/cases", label: "Case management" }} next={{ href: "/docs/cloud", label: "Cloud: Overview" }}>
      <H2>Configuring endpoints</H2>
      <P>From Console → Webhooks, register a URL and pick the events you want. We sign every payload with your webhook secret.</P>
      <H2>Example payload</H2>
      <Code lang="json">{"`{\n  \"event\": \"guard.decision.block\",\n  \"transaction_id\": \"txn_12345\",\n  \"risk_score\": 0.91,\n  \"delivered_at\": \"2025-06-11T09:24:11Z\"\n}`"}</Code>
      <Callout title="Signature verification" kind="warn">
        Always verify the X-Xobriq-Signature header before trusting a payload. Reject requests older than 5 minutes.
      </Callout>
    </DocShell>
  );
}