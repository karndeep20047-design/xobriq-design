import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Choose a workflow — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Get started" title="Choose a workflow" intro="Pick the integration path that fits your team." prev={{ href: "/docs/quickstart", label: "Quickstart" }} next={{ href: "/docs/concepts", label: "Concepts" }}>
      <H2>Real-time fraud scoring</H2>
      <P>Call Guard from your core banking or wallet backend on every transaction and biometric event. Best when you need sub-200ms decisions.</P>
      <H2>Batch KYC & onboarding</H2>
      <P>Submit onboarding cohorts nightly to the Identity Verification and KYC agents. Ideal for regulated onboarding pipelines.</P>
      <H2>Autonomous agent workflows</H2>
      <P>Deploy the Agentic runtime to handle fraud investigations, compliance reporting, SecOps, and customer service without human bottlenecks.</P>
      <H2>Sovereign GPU workloads</H2>
      <P>Reserve H200 capacity on Xobriq Cloud for model training, fine-tuning, and low-latency inference — with 100% Kenya data residency.</P>
      <H2>Managed cybersecurity</H2>
      <P>Combine Xobriq Cyber (SIEM + pentesting) with Guard for a full defensive posture. Best for banks and government agencies.</P>
      <H2>Which one is right for you?</H2>
      <List items={[
        "You are a bank or fintech losing money to card-not-present fraud → Guard + Behavioural analytics.",
        "You are a telco onboarding millions of SIMs / mobile-money wallets → Guard + KYC agent + Deepfake detection.",
        "You are a government agency running critical AI workloads → Cloud sovereign partition + Cyber managed SIEM.",
        "You are building your own AI product on top of GPUs → Cloud reserved capacity + Agentic SDK.",
      ]} />
    </DocShell>
  );
}