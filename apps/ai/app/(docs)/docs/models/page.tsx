import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Models — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Reference" title="Models" intro="Foundation models, specialised agents, and detection models hosted on Xobriq." prev={{ href: "/docs/api", label: "API reference" }} next={{ href: "/docs/release-notes", label: "Release notes" }}>
      <H2>Detection models</H2>
      <List items={[
        "guard-fraud-2 — 120-signal transaction risk model.",
        "guard-deepfake-vision-2 — video and image liveness.",
        "guard-voice-1 — audio impersonation detection.",
        "guard-behaviour-1 — behavioural biometrics.",
      ]} />
      <H2>Agent models</H2>
      <List items={[
        "xobriq-agent-2 — general reasoning + tool use.",
        "xobriq-agent-financial — specialised for banking / mobile money.",
        "xobriq-agent-secops — specialised for SIEM triage.",
      ]} />
      <H2>Foundation models available for hosting</H2>
      <P>On Xobriq Cloud you can host any HuggingFace-compatible model. We publish tuned versions of Mistral, Llama, and Qwen with sovereign-region weights.</P>
    </DocShell>
  );
}