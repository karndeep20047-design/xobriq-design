import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Service Level Agreement — Xobriq",
  description: "How Xobriq structures service level commitments for enterprise customers.",
};

const intro = `Xobriq's Services span fraud detection, agentic AI, GPU compute, consulting, and cybersecurity engagements — each with different operational profiles, so we don't publish a single one-size-fits-all uptime or response-time number here. Instead, specific service level commitments (uptime targets, incident response times, support tiers, and remedies) are defined in your signed order form or Service Level Agreement, scoped to the products and tier you've contracted for.`;

const sections = [
  {
    title: "1. How Our SLAs Work",
    body: `Each customer's SLA is attached to their order form as part of onboarding, and reflects the specific products, deployment model (shared vs. dedicated infrastructure, sovereign-tier vs. standard), and support tier agreed upon. This lets us commit to numbers we can actually stand behind for your specific setup, rather than an average that doesn't fit every deployment.`,
  },
  {
    title: "2. What's Typically Covered",
    body: `A Xobriq SLA typically defines: uptime/availability targets for the contracted Service, incident severity classifications and response time targets per severity, scheduled maintenance windows and advance notice periods, and service credits or remedies if targets are missed.`,
  },
  {
    title: "3. Support Tiers",
    body: `Support is tiered by contract — from standard business-hours support up to 24/7 coverage with dedicated escalation paths for critical/sovereign-tier deployments. Your account contact can confirm which tier applies to your agreement.`,
  },
  {
    title: "4. Maintenance and Planned Downtime",
    body: `Planned maintenance is scheduled with advance notice wherever possible, and is excluded from uptime calculations per the terms of your SLA. Emergency maintenance to address active security incidents may occur with shorter notice, prioritising service integrity.`,
  },
  {
    title: "5. Getting Your SLA",
    body: `To review specific SLA terms for your deployment, or to discuss SLA requirements before signing, contact sales@xobriq.com.`,
  },
];

export default function SLAPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Service Level Agreement"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      callout={{
        icon: Clock,
        title: "Want specific numbers?",
        body: (
          <>
            Uptime targets and response times are scoped per contract. Talk to{" "}
            <a href="mailto:sales@xobriq.com" className="text-enterprise-primary hover:underline">sales@xobriq.com</a>{" "}
            about the commitments that apply to your deployment.
          </>
        ),
      }}
      footerLinks={[
        { href: "/dpa", label: "Data Processing Agreement" },
        { href: "/security", label: "Security" },
        { href: "/terms", label: "Terms of Service" },
      ]}
    />
  );
}
