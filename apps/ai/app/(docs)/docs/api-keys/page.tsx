import { DocShell, H2, P, Code, Callout, List } from "@/components/docs/DocShell";

export const metadata = { title: "Manage API keys — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Get started" title="Manage API keys" intro="Create, rotate, and revoke keys from the Console." prev={{ href: "/docs/concepts", label: "Concepts" }} next={{ href: "/docs/agents", label: "Agent skills" }}>
      <H2>Key types</H2>
      <List items={[
        "sk_test_ — sandbox key, safe for local dev and CI.",
        "sk_live_ — production key, server-side only.",
        "sk_readonly_ — read-only key for observability / dashboards.",
      ]} />
      <H2>Creating a key</H2>
      <P>Open Console → API Keys → New Key. Give it a name, choose the scope, and copy the value. You will only see it once.</P>
      <H2>Using a key</H2>
      <Code lang="bash">{"`curl https://api.xobriq.com/v1/guard/score -H \"Authorization: Bearer $XOBRIQ_KEY\"`"}</Code>
      <H2>Rotation</H2>
      <P>We recommend rotating production keys every 90 days. When you rotate, both the old and new key stay valid for 24h so you can roll out safely.</P>
      <Callout kind="warn" title="Leaked keys">
        If a key is ever exposed (e.g. committed to git), rotate it immediately from the Console. All requests using the old key will be denied.
      </Callout>
    </DocShell>
  );
}