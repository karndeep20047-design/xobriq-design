import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Guard: Overview — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Overview" intro="The Xobriq fraud, deepfake, identity, and behavioural intelligence platform." prev={{ href: "/docs/early-access", label: "Early access" }} next={{ href: "/docs/guard/score", label: "Fraud detection API" }}>
      <H2>What Guard does</H2>
      <P>Guard is a unified risk platform combining transaction fraud scoring, biometric verification, identity intelligence, and behavioural analytics into a single API. Purpose-built for African financial ecosystems.</P>
      <H2>Modules</H2>
      <List items={[
        "Fraud detection API — real-time transaction risk scoring on 120+ signals.",
        "Deepfake detection — video, audio, and image liveness against GAN attacks.",
        "Identity verification — KYC/KYB with 400+ sanctions lists and 150+ government DBs.",
        "Behavioural analytics — device, session, and typing pattern intelligence.",
        "Case management — investigator workspace with evidence packages.",
        "Webhooks — push decisions and evidence to your systems asynchronously.",
      ]} />
      <H2>Compliance posture</H2>
      <P>ISO 27001-aligned, KE-DPA compliant, PCI DSS ready. All processing happens in Xobriq Cloud sovereign regions.</P>
      <Callout title="Latency" kind="success">
        Median score latency is 42ms from Nairobi. Every request is logged in an append-only audit ledger for regulator export.
      </Callout>
    </DocShell>
  );
}