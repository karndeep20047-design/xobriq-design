import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "SDKs — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Platform" title="SDKs" intro="Native libraries for every major language." prev={{ href: "/docs/audit-logs", label: "Audit logs" }} next={{ href: "/docs/api", label: "API reference" }}>
      <H2>Official languages</H2>
      <List items={[
        "Python — pip install xobriq",
        "Node.js / TypeScript — npm install xobriq",
        "Go — go get github.com/xobriq-ai/xobriq-go",
        "Java — Maven artifact com.xobriq:xobriq-java",
        "Ruby — gem install xobriq",
        ".NET — dotnet add package Xobriq",
      ]} />
      <H2>Feature parity</H2>
      <P>All SDKs cover Guard, Cloud, Agentic, and Platform APIs. They implement retries with jitter, streaming responses for LLM calls, and typed error unions.</P>
      <H2>Community SDKs</H2>
      <P>Elixir, Rust, and Kotlin SDKs are maintained by the community. See github.com/xobriq-ai/awesome-xobriq.</P>
    </DocShell>
  );
}