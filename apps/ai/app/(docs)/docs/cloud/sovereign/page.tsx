import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Sovereign partition — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Sovereign partition" intro="Hardware-isolated, air-gap-capable pods for critical infrastructure." prev={{ href: "/docs/cloud/reserved", label: "Reserved capacity" }} next={{ href: "/docs/cloud/inference", label: "Inference hosting" }}>
      <H2>What you get</H2>
      <List items={[
        "Dedicated physical H200 nodes — no shared silicon.",
        "Air-gap-capable networking with dedicated VRF.",
        "Hardware Security Module (HSM) integration for at-rest keys.",
        "On-prem hybrid sync for burstable workloads.",
        "Government-grade access control with hardware attestation.",
      ]} />
      <H2>Who this is for</H2>
      <P>Central banks, defense ministries, national identity programs, and regulated financial institutions with strict data-locality mandates.</P>
      <Callout title="Custom pricing" kind="info">
        Sovereign partitions are priced per-pod based on rack count and SLA. Contact sales for a scoped proposal.
      </Callout>
    </DocShell>
  );
}