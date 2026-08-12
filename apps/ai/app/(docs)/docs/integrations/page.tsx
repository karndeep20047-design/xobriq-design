import { DocShell, H2, P, List, Callout } from "@/components/docs/DocShell";

export const metadata = { title: "Integrations — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Tools" title="Integrations" intro="Connect Xobriq to your data warehouse, CRM, SIEM, and communication tools.">
      <Callout title="This page requires authentication" kind="info">
        You need to be signed in to manage tenant connectors. Anonymous users are redirected to log in first.
      </Callout>

      <H2>Data warehouses</H2>
      <List items={[
        "Snowflake, BigQuery, Databricks, Redshift.",
        "Postgres, MySQL, MongoDB.",
        "Kafka, Pulsar, EventBridge (streaming).",
      ]} />
      <H2>Business systems</H2>
      <List items={[
        "Salesforce, HubSpot (CRM sync + case creation).",
        "Zendesk, Intercom (customer support tickets).",
        "Jira, Linear (engineering incidents).",
        "Slack, Microsoft Teams, WhatsApp Business (notifications).",
      ]} />
      <H2>Security tooling</H2>
      <List items={[
        "Splunk, Datadog, Elastic (SIEM export).",
        "PagerDuty, OpsGenie (alerting).",
        "Okta, Azure AD, Google Workspace (SSO / SCIM).",
      ]} />
      <H2>Managing connectors</H2>
      <P>Open Console → Integrations to install, configure, and monitor connectors. Every integration is scoped to the minimum permissions required.</P>
    </DocShell>
  );
}