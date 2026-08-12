import { DocShell, H2, P, List, Code } from "@/components/docs/DocShell";

export const metadata = { title: "Audit logs — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Platform" title="Audit logs" intro="Append-only ledger of every request, decision, and administrative action." prev={{ href: "/docs/errors", label: "Errors" }} next={{ href: "/docs/sdks", label: "SDKs" }}>
      <H2>What is logged</H2>
      <List items={[
        "Every API request with request_id, tenant, actor, and payload hash.",
        "Every Guard decision with the exact signal contributions.",
        "Every agent action, including LLM prompts and tool results.",
        "Every administrative change (keys, webhooks, RBAC).",
      ]} />
      <H2>Export</H2>
      <P>Streaming export to your S3-compatible bucket or SIEM. Historical retention up to 7 years for regulated tenants.</P>
      <H2>Query API</H2>
      <Code lang="bash">{"`curl https://api.xobriq.com/v1/audit/events \\\n  -H \"Authorization: Bearer $XOBRIQ_KEY\" \\\n  --data-urlencode \"since=2025-06-01T00:00:00Z\" \\\n  --data-urlencode \"actor=user_a91\"`"}</Code>
    </DocShell>
  );
}