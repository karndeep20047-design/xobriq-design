import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Release notes — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Reference" title="Release notes" intro="Every meaningful platform change, weekly." prev={{ href: "/docs/models", label: "Models" }}>
      <H2>v2.4 · June 2025</H2>
      <List items={[
        "Guard: launched behavioural biometrics API (public beta).",
        "Cloud: NVLink Fabric now available across all 8-node clusters.",
        "Agentic: workflow builder v2 with typed skill inputs.",
        "Platform: 30% faster p95 latency across all APIs.",
      ]} />
      <H2>v2.3 · May 2025</H2>
      <List items={[
        "Announced Nairobi H200 cluster with 1,240 TFLOPS aggregate.",
        "Guard deepfake detection now supports live video streams.",
        "New SDKs: Ruby and .NET reached feature parity.",
        "Audit ledger retention extended to 7 years for regulated tenants.",
      ]} />
      <H2>v2.2 · April 2025</H2>
      <List items={[
        "Sovereign partition GA for government workloads.",
        "Case management workspace redesigned for analyst efficiency.",
        "New rate-limit tier for enterprise customers.",
      ]} />
    </DocShell>
  );
}