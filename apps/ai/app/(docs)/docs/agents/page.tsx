import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Agent skills — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Get started" title="Agent skills" intro="Composable capabilities you can grant to any Xobriq agent." prev={{ href: "/docs/api-keys", label: "Manage API keys" }} next={{ href: "/docs/early-access", label: "Early access" }}>
      <H2>What is a skill?</H2>
      <P>A skill is a modular capability — a set of tools, prompts, and guardrails — that any Xobriq agent can invoke. Skills let you compose complex behaviour from small, testable units.</P>
      <H2>Built-in skills</H2>
      <List items={[
        "transaction.lookup — fetch account and transaction history.",
        "kyc.verify — run Guard identity checks on a customer.",
        "case.create — open a fraud/compliance case with evidence.",
        "sanctions.screen — check against 400+ global sanctions lists.",
        "vector.search — semantic search over your knowledge base.",
        "slack.notify / jira.create — outbound integrations.",
      ]} />
      <H2>Custom skills</H2>
      <P>You can define your own skills via the Agentic SDK. Skills expose typed inputs, tool implementations, and instruction strings that the reasoning engine calls when relevant.</P>
    </DocShell>
  );
}