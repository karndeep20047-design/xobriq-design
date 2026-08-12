import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Pre-built agents — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Agentic" title="Pre-built agents" intro="Production-ready agents for common enterprise use cases." prev={{ href: "/docs/agentic", label: "Agentic: Overview" }} next={{ href: "/docs/agentic/custom", label: "Custom agent design" }}>
      <H2>Fraud Investigation Agent</H2>
      <P>Autonomously traces suspicious transactions, hydrates evidence packages, and files SAR-ready reports. Comes tuned for African payment rails including M-Pesa and Airtel Money.</P>
      <H2>KYC Agent</H2>
      <P>Runs identity verification, risk scoring, and document validation end-to-end. Handles East African government registries out of the box.</P>
      <H2>Compliance Agent</H2>
      <P>Monitors regulatory changes across CBK, CMA, FRC, and enforces policy against your transaction stream. Auto-generates regulator packets.</P>
      <H2>SecOps Agent</H2>
      <P>L1–L3 autonomous triage over your SIEM. Investigates alerts, isolates hosts, and files incident tickets — with human sign-off on containment actions.</P>
      <H2>Deployment</H2>
      <List items={[
        "Pick your target agent from the Console.",
        "Connect data sources (core banking, SIEM, case management).",
        "Configure escalation thresholds and human-in-the-loop policies.",
        "Go live — every action is logged to the audit ledger.",
      ]} />
    </DocShell>
  );
}