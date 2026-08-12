import { DocShell, H2, P, Code } from "@/components/docs/DocShell";

export const metadata = { title: "Agent SDK — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Agentic" title="Agent SDK" intro="Program agents directly from Python or TypeScript." prev={{ href: "/docs/agentic/custom", label: "Custom agent design" }} next={{ href: "/docs/auth", label: "Authentication" }}>
      <H2>Install</H2>
      <Code lang="bash">pip install xobriq-agentic</Code>
      <H2>Define an agent</H2>
      <Code lang="python">{"`from xobriq.agentic import Agent, skill\n\n@skill\ndef lookup_customer(customer_id: str) -> dict:\n    return db.get(customer_id)\n\nagent = Agent(\n    name=\"triage-agent\",\n    model=\"xobriq-agent-2\",\n    skills=[lookup_customer],\n    system=\"You triage incoming fraud alerts.\",\n)\n\nresult = agent.run({\n    \"alert_id\": \"al_9182\",\n    \"customer_id\": \"cust_9x\"\n})`"}</Code>
      <H2>TypeScript</H2>
      <Code lang="bash">npm install @xobriq/agentic</Code>
      <Code lang="typescript">{"`import { Agent, skill } from \"@xobriq/agentic\";\n\nconst lookup = skill(\"lookupCustomer\", async (id: string) => db.get(id));\n\nconst agent = new Agent({\n  name: \"triage-agent\",\n  skills: [lookup],\n});\n\nconst r = await agent.run({ alert_id: \"al_9182\" });`"}</Code>
    </DocShell>
  );
}