import { DocShell, H2, P, Code, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Custom agent design — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Agentic" title="Custom agent design" intro="Design multi-step reasoning workflows with the visual builder." prev={{ href: "/docs/agentic/prebuilt", label: "Pre-built agents" }} next={{ href: "/docs/agentic/sdk", label: "Agent SDK" }}>
      <H2>Workflow builder</H2>
      <P>Drag nodes onto the canvas — triggers, LLM reasoning steps, tool calls, human approval gates, and outputs. The builder generates a versioned YAML spec that you can commit to git.</P>
      <H2>Node types</H2>
      <Code lang="yaml">{"`- id: trigger\n  type: webhook.event\n  event: transaction.received\n- id: analyze\n  type: llm.reasoning\n  model: xobriq-agent-2\n  skills: [transaction.lookup, sanctions.screen]\n- id: human_gate\n  type: human.approval\n  when: risk_score > 0.75\n- id: notify\n  type: slack.notify\n  channel: \"#fraud-ops\"`"}</Code>
      <Callout title="Version everything" kind="info">
        Workflow specs are immutable once deployed. New versions are promoted through staging → production with rollback support.
      </Callout>
    </DocShell>
  );
}