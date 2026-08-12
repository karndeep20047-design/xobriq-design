import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Security — Xobriq",
  description: "How Xobriq protects infrastructure, models, and customer data.",
};

const intro = `Xobriq builds fraud detection and identity verification systems that customers trust with sensitive data — so our own infrastructure is held to the same standard we sell. This page summarizes the security practices described in more detail in our Privacy Policy and AI Ethics policy.`;

const sections = [
  {
    title: "Infrastructure & Data Protection",
    body: `Encryption in transit and at rest, role-based access control, least-privilege access, multi-factor authentication for administrative access, and network segmentation across our infrastructure. Our primary processing infrastructure is located in a Tier 3 data centre in Nairobi, Kenya, with sovereign-tier deployments available where designated customer data never leaves Kenya.`,
  },
  {
    title: "Monitoring & Testing",
    body: `24/7 SIEM monitoring and continuous logging across production systems, regular third-party penetration testing, and secure development practices. Our models and detection systems are tested against adversarial attacks, presentation attacks, injection attacks, prompt manipulation, and evolving deepfake techniques — degraded or compromised models are retrained or rolled back.`,
  },
  {
    title: "Biometric & Sensitive Data Handling",
    body: `Biometric data is processed only as strictly necessary for the verification, liveness, or fraud-prevention task requested. It is encrypted, access-restricted, deleted on the shortest schedule consistent with the customer's legal obligations, and never reused across customers or repurposed for training without explicit opt-in.`,
  },
  {
    title: "Incident Response & Breach Notification",
    body: `In the event of a personal data breach posing a real risk of harm, Xobriq notifies the Office of the Data Protection Commissioner of Kenya (ODPC) within 72 hours, notifies affected data subjects where required, and notifies affected customers without undue delay.`,
  },
  {
    title: "Regulatory Compliance",
    body: `Xobriq is registered with the Office of the Data Protection Commissioner of Kenya (ODPC) as a data controller and data processor, and processes personal data in accordance with the Kenya Data Protection Act, 2019 and, where applicable, the GDPR. See our Privacy Policy and AI Ethics policy for the full detail behind these practices.`,
  },
  {
    title: "Responsible Disclosure",
    body: `If you've found a security vulnerability in our systems, we want to know about it. Report it to info@xobriq.com — we operate a responsible disclosure channel and will work with you to understand and address the issue.`,
  },
];

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Trust & Security"
      title="Security"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      callout={{
        icon: ShieldCheck,
        title: "Found a vulnerability?",
        body: (
          <>
            Report it to{" "}
            <a href="mailto:info@xobriq.com" className="text-enterprise-primary hover:underline">info@xobriq.com</a>{" "}
            — we take responsible disclosure seriously.
          </>
        ),
      }}
      footerLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/ai-ethics", label: "AI Ethics" },
        { href: "/dpa", label: "Data Processing Agreement" },
      ]}
    />
  );
}
