import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Training pipelines — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Cloud" title="Training pipelines" intro="Multi-node distributed training with sovereign checkpointing." prev={{ href: "/docs/cloud/inference", label: "Inference hosting" }} next={{ href: "/docs/agentic", label: "Agentic: Overview" }}>
      <H2>Orchestration</H2>
      <P>Xobriq Cloud provides both Slurm (for research teams) and Kubernetes (for production MLOps). Both are fully managed — you just submit jobs.</P>
      <H2>Submit a training job</H2>
      <Code lang="bash">{"`xobriq train submit \\\n  --nodes 4 \\\n  --gpus-per-node 8 \\\n  --image xobriq/pytorch-2.4 \\\n  --script train.py \\\n  --checkpoint-bucket sov://checkpoints/llama-13b`"}</Code>
      <H2>Features</H2>
      <List items={[
        "NVLink Fabric across nodes for near-linear scaling.",
        "Automatic checkpoint resumption on preemption.",
        "Sovereign object storage (S3-compatible, in-country).",
        "Integrated Weights & Biases and MLflow.",
        "TensorBoard, Grafana, and cost dashboards out of the box.",
      ]} />
    </DocShell>
  );
}