import { DocShell, H2, P, List, Code } from "@/components/docs/DocShell";

export const metadata = { title: "API reference — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Reference" title="API reference" intro="Complete reference for the Xobriq REST API." prev={{ href: "/docs/sdks", label: "SDKs" }} next={{ href: "/docs/models", label: "Models" }}>
      <H2>Base URL</H2>
      <Code>https://api.xobriq.com/v1</Code>
      <H2>Resource groups</H2>
      <List items={[
        "/guard/* — Fraud, deepfake, identity, behavioural.",
        "/cloud/* — Instances, reservations, endpoints, jobs.",
        "/agentic/* — Agents, skills, workflows, runs.",
        "/audit/* — Query the audit ledger.",
        "/keys/* — Manage API keys and OAuth clients.",
      ]} />
      <H2>Content types</H2>
      <P>All requests and responses use application/json. Multipart form data is only used for media uploads to /guard/deepfake.</P>
      <H2>Versioning</H2>
      <P>Breaking changes are gated behind versioned URLs. We announce deprecations 12 months before removal and keep the old version available.</P>
    </DocShell>
  );
}