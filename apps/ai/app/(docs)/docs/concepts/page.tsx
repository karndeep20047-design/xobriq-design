import { DocShell, H2, P, List, Code, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Concepts — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Get started" title="Concepts" intro="Key terminology used across the Xobriq platform." prev={{ href: "/docs/workflow", label: "Choose a workflow" }} next={{ href: "/docs/api-keys", label: "Manage API keys" }}>
      <H2>Risk score</H2>
      <P>A floating point between 0 and 1 returned by Guard. Represents the estimated probability that an event is fraudulent.</P>
      <H2>Signal</H2>
      <P>A single feature contributing to the risk score — velocity, geolocation, device fingerprint, behavioural biometrics, etc. Xobriq Guard uses 120+ signals.</P>
      <H2>Decision</H2>
      <P>A recommended action: allow, review, block, or step_up. Determined by the risk score and your configured thresholds.</P>
      <H2>Agent</H2>
      <P>An autonomous LLM-powered worker that executes a multi-step workflow. Xobriq ships pre-built agents for Fraud Investigation, KYC, Compliance, and SecOps.</P>
      <H2>Sovereign partition</H2>
      <P>A dedicated slice of H200 GPUs on Xobriq Cloud with hardware-level isolation, guaranteed data residency, and air-gapped deployment options for government workloads.</P>
      <H2>Public endpoint vs. dedicated endpoint</H2>
      <P>Public endpoints are pre-deployed models shared across tenants — perfect for prototyping. Dedicated endpoints give you a private model instance with reserved throughput.</P>
      <Callout title="Environment naming">
        Sandbox keys start with sk_test_ and hit the sandbox environment. Production keys start with sk_live_ and hit the production environment.
      </Callout>
    </DocShell>
  );
}