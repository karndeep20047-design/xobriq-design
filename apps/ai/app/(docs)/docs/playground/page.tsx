import { DocShell, H2, P, Callout, List } from "@/components/docs/DocShell";

export const metadata = { title: "Playground — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Tools" title="Playground" intro="Test Guard scoring, agent runs, and Cloud jobs live from your browser.">
      <Callout title="This page requires authentication" kind="info">
        The playground uses your sandbox key. Anonymous users are redirected to log in first.
      </Callout>

      <H2>What you can do here</H2>
      <List items={[
        "Score sample transactions against Guard.",
        "Upload a selfie or ID for a live deepfake / identity check.",
        "Kick off a pre-built agent (Fraud, KYC, Compliance, SecOps) and watch it reason step-by-step.",
        "Spin up a temporary H200 sandbox instance for 30 minutes.",
      ]} />
      <H2>Where it runs</H2>
      <P>Playground jobs execute in the same sovereign Nairobi region as production, but always against sandbox data. Nothing you paste here reaches your production dataset.</P>
    </DocShell>
  );
}