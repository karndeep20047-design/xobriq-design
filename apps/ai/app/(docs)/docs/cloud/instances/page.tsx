import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Spin up a GPU instance — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Spin up a GPU instance" intro="Launch H200 GPU instances via API or Console in seconds." prev={{ href: "/docs/cloud", label: "Cloud: Overview" }} next={{ href: "/docs/cloud/reserved", label: "Reserved capacity" }}>
      <H2>Instance sizes</H2>
      <List items={[
        "h200-1x — 1 GPU, 80GB VRAM, 128GB RAM ($2.40/hour)",
        "h200-2x — 2 GPUs, 160GB VRAM, 256GB RAM ($4.60/hour)",
        "h200-4x — 4 GPUs, 320GB VRAM, 512GB RAM ($8.90/hour)",
        "h200-8x — 8 GPUs, 640GB VRAM, 1TB RAM, NVLink Fabric ($18.50/hour)",
      ]} />
      <H2>Launch via API</H2>
      <Code lang="bash">{"`curl -X POST https://api.xobriq.com/v1/cloud/instances \\\n  -H \"Authorization: Bearer $XOBRIQ_KEY\" \\\n  -d '{\n    \"size\": \"h200-4x\",\n    \"image\": \"pytorch-2.4-cuda-12\",\n    \"region\": \"nairobi-1\",\n    \"name\": \"llama-finetune\"\n  }'`"}</Code>
      <H2>SSH access</H2>
      <P>Add your SSH public key from Console → Compute → SSH Keys. New instances embed the key on first boot for immediate access.</P>
      <H2>Billing model</H2>
      <P>Per-second billing after the first minute. Stopped instances only charge storage. Idle GPUs auto-hibernate after 15 minutes (configurable).</P>
    </DocShell>
  );
}