import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Case management — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Case management" intro="Analyst workspace for fraud and compliance cases." prev={{ href: "/docs/guard/behavioural", label: "Behavioural analytics" }} next={{ href: "/docs/guard/webhooks", label: "Webhooks" }}>
      <H2>What analysts get</H2>
      <List items={[
        "Auto-generated case files with evidence and reason codes.",
        "Timeline view of every signal that fired for the customer.",
        "One-click export for regulator submissions (CBK, CMA, etc.).",
        "SLA tracker and workload distribution across the team.",
      ]} />
      <H2>API access</H2>
      <P>The Case API lets you programmatically create, comment on, and resolve cases. Great for embedding into your own back-office tool.</P>
    </DocShell>
  );
}