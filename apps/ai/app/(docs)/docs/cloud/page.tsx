import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Cloud: Overview — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Overview" intro="Sovereign GPU compute engineered for enterprise-scale AI." prev={{ href: "/docs/guard/webhooks", label: "Webhooks" }} next={{ href: "/docs/cloud/instances", label: "Spin up a GPU instance" }}>
      <H2>What Xobriq Cloud provides</H2>
      <P>Xobriq Cloud is a fully-managed sovereign GPU platform hosted in Nairobi with expansions to Addis Ababa and Kigali. Every workload runs on NVIDIA H200 clusters with sub-10ms edge interconnects and 100% Kenya data residency.</P>
      <H2>Product lines</H2>
      <List items={[
        "GPU instances — on-demand H200 slices for interactive workloads.",
        "Reserved capacity — 1, 3, or 12-month contracts at up to 45% off.",
        "Sovereign partition — hardware-isolated, air-gap-capable pods for government workloads.",
        "Inference hosting — managed endpoints for your custom models with autoscaling.",
        "Training pipelines — Slurm + K8s orchestration with checkpointing to sovereign object storage.",
      ]} />
      <H2>Data residency & compliance</H2>
      <P>All storage, compute, and networking stay within Kenya. Compliant with the Kenya Data Protection Act 2019, ISO 27001, and CBK guidelines for regulated workloads.</P>
      <Callout title="Green-powered infrastructure" kind="success">
        Xobriq Cloud runs on geothermal and hydro-electric grids with an industry-leading PUE of 1.15.
      </Callout>
    </DocShell>
  );
}