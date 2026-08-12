import { DocShell, H2, P, Code, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Authentication — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Platform" title="Authentication" intro="Bearer tokens, OAuth clients, and machine-to-machine auth." prev={{ href: "/docs/agentic/sdk", label: "Agent SDK" }} next={{ href: "/docs/rate-limits", label: "Rate limits" }}>
      <H2>Bearer tokens</H2>
      <P>Every request must include an Authorization header with a valid Xobriq key.</P>
      <Code lang="http">Authorization: Bearer sk_live_...</Code>
      <H2>OAuth 2.0 (for third-party apps)</H2>
      <P>If you build a product on top of Xobriq for other tenants, register an OAuth client from Console → Developers. We support the Authorization Code + PKCE flow.</P>
      <H2>Machine-to-machine (JWT)</H2>
      <P>For internal services, use short-lived JWTs signed with your key. Xobriq caches key material so verification adds no latency.</P>
      <Callout title="Rotate on incident" kind="warn">
        If a secret leaks, rotate it in the Console immediately. All previous tokens minted with the old key will be denied within 30 seconds.
      </Callout>
    </DocShell>
  );
}