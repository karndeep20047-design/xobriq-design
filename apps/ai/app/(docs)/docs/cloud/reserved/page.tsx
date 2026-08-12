import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Reserved capacity — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Reserved capacity" intro="Lock in H200 capacity at up to 45% off on-demand pricing." prev={{ href: "/docs/cloud/instances", label: "Spin up a GPU instance" }} next={{ href: "/docs/cloud/sovereign", label: "Sovereign partition" }}>
      <H2>Term options</H2>
      <List items={[
        "1-month commitment — up to 15% off",
        "3-month commitment — up to 25% off",
        "12-month commitment — up to 45% off",
        "Multi-year contracts — custom pricing, priority scheduling",
      ]} />
      <H2>When to reserve</H2>
      <P>Reserved capacity makes sense when your team runs sustained training or inference at more than ~40% utilization, or when you need guaranteed availability during peak periods.</P>
      <Callout title="Burst overage" kind="info">
        Reserved contracts include the ability to burst into on-demand capacity when your reserved pool is saturated. Overage is billed at standard on-demand rates.
      </Callout>
    </DocShell>
  );
}