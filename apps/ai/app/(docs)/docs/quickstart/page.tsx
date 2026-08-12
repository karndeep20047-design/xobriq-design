import { DocShell, H2, P, Code, Callout, List } from "@/components/docs/DocShell";

export const metadata = { title: "Quickstart — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell
      section="Get started"
      title="Quickstart"
      intro="Run your first Guard fraud score in under five minutes."
      prev={{ href: "/docs", label: "Welcome" }}
      next={{ href: "/docs/workflow", label: "Choose a workflow" }}
    >
      <H2>1. Create your account</H2>
      <P>Sign up at /register with a work email. You&apos;ll be dropped into the Console with a sandbox environment pre-configured.</P>

      <H2>2. Grab a sandbox API key</H2>
      <P>From the Console → API Keys, generate a sandbox key. Keys prefixed with sk_test_ are safe for local development.</P>
      <Callout title="Never expose production keys client-side" kind="warn">
        Sandbox keys can safely live in your dev environment. Production keys (sk_live_) must only be used server-side.
      </Callout>

      <H2>3. Score your first transaction</H2>
      <Code lang="bash">
{"`curl -X POST https://api.xobriq.com/v1/guard/score \\\n  -H \"Authorization: Bearer sk_test_...\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"transaction_id\": \"txn_demo_001\",\n    \"amount\": 150000,\n    \"currency\": \"KES\",\n    \"customer_id\": \"cust_demo\",\n    \"device_fingerprint\": \"fp_demo\"\n  }'`"}
      </Code>

      <H2>4. Interpret the response</H2>
      <Code lang="json">
{"`{\n  \"risk_score\": 0.03,\n  \"decision\": \"allow\",\n  \"latency_ms\": 42,\n  \"signals\": {\n    \"velocity\": \"normal\",\n    \"geo\": \"verified\",\n    \"device\": \"trusted\"\n  }\n}`"}
      </Code>
      <P>A risk_score under 0.20 is safe to allow, 0.20–0.70 is worth reviewing, above 0.70 should be blocked or step-up authenticated.</P>

      <H2>5. Where to go next</H2>
      <List items={[
        "Read Concepts to understand risk scoring, agents and workflows.",
        "Explore the Guard reference for deepfake, identity, and behavioural APIs.",
        "Provision a GPU instance on Xobriq Cloud.",
        "Deploy a pre-built agent from the Agentic overview.",
      ]} />
    </DocShell>
  );
}