import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Identity verification — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Identity verification" intro="KYC / KYB across 400+ sanctions lists and 150+ government databases." prev={{ href: "/docs/guard/deepfake", label: "Deepfake detection" }} next={{ href: "/docs/guard/behavioural", label: "Behavioural analytics" }}>
      <H2>What we screen against</H2>
      <List items={[
        "Global sanctions: OFAC, UN, EU, HMT, DFAT and 400+ national lists.",
        "PEP databases with beneficial-ownership graph.",
        "Adverse media across 30+ languages.",
        "150+ government identity registries (East Africa focus).",
      ]} />
      <H2>Endpoint</H2>
      <Code>POST https://api.xobriq.com/v1/guard/identity</Code>
      <H2>Request</H2>
      <Code lang="json">{"`{\n  \"full_name\": \"Jane Doe\",\n  \"date_of_birth\": \"1988-03-14\",\n  \"national_id\": \"12345678\",\n  \"country\": \"KE\"\n}`"}</Code>
    </DocShell>
  );
}