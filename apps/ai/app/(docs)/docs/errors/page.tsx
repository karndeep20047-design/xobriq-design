import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Errors — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Platform" title="Errors" intro="Every Xobriq error returns a machine-readable JSON body." prev={{ href: "/docs/rate-limits", label: "Rate limits" }} next={{ href: "/docs/audit-logs", label: "Audit logs" }}>
      <H2>Response shape</H2>
      <Code lang="json">{"`{\n  \"error\": {\n    \"code\": \"invalid_signature\",\n    \"message\": \"Webhook signature verification failed.\",\n    \"request_id\": \"req_9182\"\n  }\n}`"}</Code>
      <H2>Common codes</H2>
      <List items={[
        "unauthorized — missing or invalid API key.",
        "forbidden — key does not have scope for this endpoint.",
        "not_found — resource does not exist or is not visible to your tenant.",
        "rate_limited — you hit your rate limit; retry with backoff.",
        "invalid_request — malformed request body or missing fields.",
        "internal_error — transient server error, safe to retry.",
      ]} />
      <H2>Debugging with request_id</H2>
      <P>Every response includes a request_id. Share it with support and we can trace the entire lifecycle of your request end-to-end.</P>
    </DocShell>
  );
}