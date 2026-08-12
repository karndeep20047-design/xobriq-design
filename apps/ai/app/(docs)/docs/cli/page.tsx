import { DocShell, H2, P, Code, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "CLI — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Tools" title="Xobriq CLI" intro="Deploy, monitor and manage every Xobriq resource from your terminal.">
      <Callout title="This page requires authentication" kind="info">
        You are viewing the CLI docs because you are signed in. Anonymous users are redirected to log in first.
      </Callout>

      <H2>Install</H2>
      <Code lang="bash">{"`# macOS / Linux\ncurl -fsSL https://cli.xobriq.com/install.sh | sh\n\n# Windows (Powershell)\niwr -useb https://cli.xobriq.com/install.ps1 | iex`"}</Code>
      <H2>Login</H2>
      <Code lang="bash">{"`xobriq login # opens browser for OAuth flow`"}</Code>
      <H2>Common commands</H2>
      <Code lang="bash">{"`xobriq guard score --txn txn_demo_001 --amount 150000 --currency KES\nxobriq cloud instances create --size h200-1x --image pytorch-2.4\nxobriq cloud instances list\nxobriq agentic runs tail run_ab12\nxobriq keys create --scope guard:read,guard:write`"}</Code>
      <H2>Configuration</H2>
      <P>The CLI reads XOBRIQ_KEY from the environment or ~/.xobriq/config.toml. Use xobriq context switch to move between sandbox and production.</P>
    </DocShell>
  );
}