import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Agentic: Overview — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Agentic" title="Overview" intro="Autonomous enterprise agents that reason, plan, and execute." prev={{ href: "/docs/cloud/training", label: "Training pipelines" }} next={{ href: "/docs/agentic/prebuilt", label: "Pre-built agents" }}>
      <H2>What Agentic is</H2>
      <P>Xobriq Agentic is a runtime for LLM-powered agents that observe, reason, and act inside enterprise workflows — with full audit trails and human-in-the-loop hooks where regulators require them.</P>
      <H2>Core building blocks</H2>
      <List items={[
        "Reasoning engine — plan → action → observation loop with structured hierarchies.",
        "Skills — modular capabilities (transaction lookup, KYC screen, case creation, etc.).",
        "Guardrails — policy enforcement, PII redaction, and decision auditability.",
        "Connectors — 250+ native integrations to enterprise systems.",
        "Human handoff — escalate to a human at any threshold you define.",
      ]} />
      <Callout title="Every action is auditable" kind="success">
        Xobriq agents write every thought, tool call, and observation to an append-only ledger so you can replay any decision months later.
      </Callout>
    </DocShell>
  );
}