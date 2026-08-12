import { DocShell, H2, P, List } from "@/components/docs/DocShell";

export const metadata = { title: "Behavioural analytics — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Behavioural analytics" intro="Device, session, and typing pattern intelligence." prev={{ href: "/docs/guard/identity", label: "Identity verification" }} next={{ href: "/docs/guard/cases", label: "Case management" }}>
      <H2>What it captures</H2>
      <List items={[
        "Keystroke dynamics and mouse behaviour.",
        "Touch pressure and swipe curvature on mobile.",
        "Session anomalies: emulator, remote-desktop, screen sharing.",
        "Device reputation and shared-device graph.",
      ]} />
      <H2>SDK integration</H2>
      <P>Drop the xobriq-behaviour SDK into your web or mobile app. It captures behavioural telemetry passively and streams it to Guard for scoring.</P>
    </DocShell>
  );
}