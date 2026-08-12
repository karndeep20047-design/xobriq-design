import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Data Processing Agreement — Xobriq",
  description: "How Xobriq processes personal data on behalf of customers as a data processor.",
};

const intro = `When you use Xobriq's Services to process your end users' personal data — for example, through the Guard API — Xobriq acts as a data processor on your behalf, and you (the customer) remain the data controller. This page summarizes the Data Processing Agreement ("DPA") that governs that relationship, consistent with the Kenya Data Protection Act, 2019 ("KDPA") and, where applicable, the GDPR. The DPA itself is incorporated into your order form or contract with Xobriq — this page is a plain-language summary, not a substitute for the signed agreement.`;

const sections = [
  {
    title: "1. When This Applies",
    body: `The DPA applies whenever Xobriq processes "End User Data" — personal data belonging to your customers or end users — on your instructions, as opposed to data about you or your own personnel, which is covered by our Privacy Policy instead.`,
  },
  {
    title: "2. Roles and Scope",
    body: `You are the data controller for your End User Data; Xobriq is the data processor. Xobriq processes that data only on your documented instructions, for the purpose of providing the contracted Services (e.g., fraud scoring, identity verification, deepfake detection), and not for any other purpose without your authorization.`,
  },
  {
    title: "3. Processor Obligations",
    body: `Xobriq commits to: processing data only as instructed; ensuring personnel who handle the data are bound by confidentiality; implementing appropriate technical and organisational security measures; assisting you in responding to data subject requests and regulatory inquiries; and deleting or returning End User Data at the end of the engagement, consistent with your instructions and applicable law.`,
  },
  {
    title: "4. Sub-processors",
    body: `Xobriq uses a limited set of sub-processors (e.g., cloud infrastructure, communications providers) under written agreements imposing KDPA/GDPR-equivalent obligations. Customers may request an up-to-date list of sub-processors by contacting info@xobriq.com.`,
  },
  {
    title: "5. Security Measures",
    body: `Encryption in transit and at rest, role-based access control, least-privilege access, multi-factor authentication for administrative access, network segmentation, continuous logging, 24/7 SIEM monitoring, and regular penetration testing — see the Security page for details.`,
  },
  {
    title: "6. International Transfers",
    body: `Our primary infrastructure is in Nairobi, Kenya. For sovereign-tier deployments, designated data does not leave Kenya. Where data is transferred internationally, we rely on contractual safeguards consistent with KDPA Sections 48–49 and, for GDPR transfers, the European Commission's Standard Contractual Clauses where applicable.`,
  },
  {
    title: "7. Breach Notification",
    body: `In the event of a personal data breach affecting End User Data, Xobriq will notify the affected customer without undue delay, so the customer can meet its own notification obligations to regulators and data subjects.`,
  },
  {
    title: "8. Getting Your Signed DPA",
    body: `A full DPA, tailored to your engagement, is executed as part of onboarding. To request a copy or discuss specific terms, contact info@xobriq.com or your Xobriq account contact.`,
  },
];

export default function DPAPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Data Processing Agreement"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      callout={{
        icon: FileText,
        title: "Need the full signed agreement?",
        body: (
          <>
            This page is a summary. For the complete Data Processing Agreement to review or sign, contact{" "}
            <a href="mailto:info@xobriq.com" className="text-enterprise-primary hover:underline">info@xobriq.com</a>.
          </>
        ),
      }}
      footerLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/security", label: "Security" },
      ]}
    />
  );
}
