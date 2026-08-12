import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Inference hosting — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Inference hosting" intro="Deploy your custom models as autoscaling endpoints." prev={{ href: "/docs/cloud/sovereign", label: "Sovereign partition" }} next={{ href: "/docs/cloud/training", label: "Training pipelines" }}>
      <H2>Supported model formats</H2>
      <List items={[
        "HuggingFace transformers (safetensors, pytorch_model.bin)",
        "ONNX",
        "TensorRT engines (for maximum throughput)",
        "Custom Docker images with your own runtime",
      ]} />
      <H2>Deploy an endpoint</H2>
      <Code lang="bash">{"`xobriq deploy \\\n  --name my-llm \\\n  --source hf://mistralai/Mistral-7B-v0.3 \\\n  --gpu h200-1x \\\n  --autoscale 1-8`"}</Code>
      <H2>Autoscaling behaviour</H2>
      <P>Endpoints scale by concurrency and queue depth. Cold-start for common LLMs is ~15s. Set min-replicas to 1 to avoid cold starts entirely.</P>
    </DocShell>
  );
}