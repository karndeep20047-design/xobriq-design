import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Fraud detection API — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Fraud detection API" intro="Real-time transaction risk scoring." prev={{ href: "/docs/guard", label: "Guard: Overview" }} next={{ href: "/docs/guard/deepfake", label: "Deepfake detection" }}>
      <H2>Endpoint</H2>
      <Code>POST https://api.xobriq.com/v1/guard/score</Code>
      <H2>Request body</H2>
      <Code lang="json">{"`{\n  \"transaction_id\": \"txn_12345\",\n  \"customer_id\": \"cust_99x\",\n  \"amount\": 150000,\n  \"currency\": \"KES\",\n  \"channel\": \"mobile_money\",\n  \"device_fingerprint\": \"fp_xyz\",\n  \"ip\": \"41.90.x.x\",\n  \"metadata\": { \"merchant\": \"acme\" }\n}`"}</Code>
      <H2>Response</H2>
      <Code lang="json">{"`{\n  \"risk_score\": 0.87,\n  \"decision\": \"block\",\n  \"latency_ms\": 41,\n  \"signals\": {\n    \"velocity\": \"high\",\n    \"geo\": \"anomalous\",\n    \"device\": \"new\"\n  },\n  \"reason_codes\": [\"V_TXN_1H_HIGH\", \"GEO_MISMATCH\"]\n}`"}</Code>
      <H2>Decision thresholds</H2>
      <List items={[
        "0.00 – 0.19: allow",
        "0.20 – 0.69: review (queue for analyst or 2FA)",
        "0.70 – 1.00: block",
      ]} />
      <H2>Rate limits</H2>
      <P>Default sandbox limit is 60 req/s. Production limits are per your contract; enterprise plans get 5,000+ req/s dedicated capacity.</P>
    </DocShell>
  );
}