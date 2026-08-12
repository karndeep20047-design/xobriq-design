import { DocShell, H2, P, List, Code } from "@/components/docs/DocShell";

export const metadata = { title: "Rate limits — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Platform" title="Rate limits" intro="How Xobriq protects platform stability and how to work with limits." prev={{ href: "/docs/auth", label: "Authentication" }} next={{ href: "/docs/errors", label: "Errors" }}>
      <H2>Default tiers</H2>
      <List items={[
        "Sandbox — 60 req/s per project.",
        "Production Starter — 300 req/s per project.",
        "Enterprise — dedicated pool, contractually guaranteed (5,000+ req/s typical).",
      ]} />
      <H2>Response headers</H2>
      <Code lang="http">{"`X-RateLimit-Limit: 300\nX-RateLimit-Remaining: 273\nX-RateLimit-Reset: 1717413245`"}</Code>
      <H2>Handling 429s</H2>
      <P>Back off exponentially. Our SDKs implement jittered retries automatically. If you need a higher ceiling, contact your account manager.</P>
    </DocShell>
  );
}