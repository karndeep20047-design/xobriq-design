import { DocShell, H2, P, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Early access — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Get started" title="Early access programs" intro="Preview features before general availability." prev={{ href: "/docs/agents", label: "Agent skills" }} next={{ href: "/docs/guard", label: "Guard: Overview" }}>
      <H2>Currently in early access</H2>
      <P>Guard Vision (deepfake in video streams), Agentic Voice, and Xobriq Cloud on-premise appliance are available to select design partners.</P>
      <H2>How to join</H2>
      <P>Email design-partners@xobriq.com with your use case, expected volume, and target go-live date. We onboard one cohort per month.</P>
      <Callout title="What to expect" kind="info">
        Weekly office hours with our engineering leads, direct Slack access, and priority feature requests.
      </Callout>
    </DocShell>
  );
}