import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Xobriq",
  description: "How Xobriq Technologies Limited collects, uses, and protects personal data.",
};

const intro = `Xobriq Technologies Limited (“Xobriq”, “we”, “us”) is committed to protecting personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard personal data in connection with our websites, platforms, APIs, and services (the “Services”). We process personal data in accordance with the Kenya Data Protection Act, 2019 (“KDPA”) and its Regulations, and — where we process personal data of individuals in the European Economic Area or the United Kingdom — the EU General Data Protection Regulation (“GDPR”) and UK GDPR. Xobriq is registered with the Office of the Data Protection Commissioner of Kenya (“ODPC”) as a data controller and data processor.`;

const sections = [
  {
    title: "1. Who We Are and Our Roles",
    body: `Depending on the context, Xobriq acts as:
- Data Controller — for personal data of website visitors, waitlist registrants, prospective customers, customer account administrators, and job applicants.
- Data Processor — for personal data of our customers' end users ("End User Data") submitted through the Guard API and related Services.
In our processor role, we process data only on the documented instructions of our customer under a Data Processing Agreement ("DPA"). If your data was submitted to Xobriq by a customer, that customer is the controller for your data.`,
  },
  {
    title: "2. Personal Data We Collect",
    body: `Data you provide to us:
- Contact and account data: name, business email, company, role, phone number, login credentials.
- Waitlist and demo requests: email address and information volunteered during signup.
- Commercial data: billing details, order history, correspondence, and support tickets.
- Recruitment data: CVs, application materials, and interview notes.
Data collected automatically:
- Usage and device data: IP address, browser type, device identifiers, pages viewed, timestamps, and referral URLs.
- Cookies and similar technologies: authentication, security, preferences, and analytics.
End User Data processed on behalf of customers may include biometric data, identity document data, behavioural and transaction data, and screening data, depending on the services used.`,
  },
  {
    title: "3. Purposes and Lawful Bases",
    body: `We use personal data for the following purposes:
- Providing and operating the Services, including account management.
- Fraud detection, identity verification, and deepfake detection when acting as a processor on behalf of customers.
- Security, abuse prevention, and service integrity.
- Improving the Services using aggregated, de-identified data.
- Marketing communications when consent is obtained.
- Legal and regulatory compliance.
The lawful basis depends on the processing context, including: contractual necessity, legitimate interests, consent, and legal obligation. For End User Data processed on behalf of customers, the customer is responsible for identifying the lawful basis under KDPA and GDPR.`,
  },
  {
    title: "4. Sensitive and Biometric Data",
    body: `Biometric data is processed only as strictly necessary for the verification, liveness, or fraud-prevention task requested, under contractual safeguards that require the customer to obtain any explicit consent or satisfy another valid legal condition under KDPA s.44–46 and GDPR Art. 9(2).
We encrypt biometric samples and templates, restrict access, delete data on the shortest schedule consistent with the customer's legal obligations, and never reuse it across customers or repurpose it for training without explicit opt-in.`,
  },
  {
    title: "5. Disclosure of Personal Data",
    body: `We do not sell personal data. We disclose personal data only to:
- Service providers / sub-processors (e.g., cloud infrastructure, communications, billing) under written contracts imposing KDPA/GDPR-equivalent obligations.
- Our customers — results of processing we perform on their behalf.
- Regulators, law enforcement, and courts where required by law.
- Professional advisers and, in the event of a merger or acquisition, prospective acquirers under confidentiality obligations.`,
  },
  {
    title: "6. Data Retention",
    body: `We retain personal data only as long as necessary for the purposes described, then delete or irreversibly anonymise it. Indicative periods include:
- Biometric samples and templates (as processor): retained only as configured by the customer, defaulting to deletion promptly after verification completes and in all cases within the shortest period consistent with the customer's legal obligations.
- Behavioural baselines: rolling window of up to 90 days.
- Account and billing records: duration of the contract plus statutory limitation periods.
- AML/KYC records processed for regulated customers: as mandated by the customer's regulatory retention obligations.
- Website analytics: typically no more than 26 months.
- Recruitment data: up to 12 months after the process concludes, unless you consent to longer.`,
  },
  {
    title: "7. International Transfers and Data Sovereignty",
    body: `Our primary processing infrastructure is located in Nairobi, Kenya, in a Tier 3 data centre. For sovereign-tier deployments, designated customer data does not leave Kenya. Where personal data is transferred outside Kenya, we ensure compliance with KDPA Sections 48–49 and with applicable safeguards, including contractual safeguards or the data subject's consent. For GDPR transfers, we rely on adequacy decisions or the European Commission's Standard Contractual Clauses (and the UK Addendum/IDTA) where appropriate.`,
  },
  {
    title: "8. Security",
    body: `We implement technical and organisational measures appropriate to the risk, including encryption in transit and at rest, role-based access control, least-privilege access, multi-factor authentication for administrative access, network segmentation, continuous logging and 24/7 SIEM monitoring, regular penetration testing, secure development practices, and staff confidentiality training.
In the event of a personal data breach posing a real risk of harm, we will notify the ODPC within 72 hours, notify affected data subjects where required, and notify affected customers without undue delay.`,
  },
  {
    title: "9. Your Rights",
    body: `Subject to applicable law, you have the right to:
- Be informed about how your data is used.
- Access the personal data we hold about you.
- Rectify inaccurate or incomplete data.
- Erase data that is no longer necessary or unlawfully processed.
- Restrict processing in certain circumstances.
- Object to processing based on legitimate interests and to direct marketing.
- Port your data in a structured, machine-readable format.
- Withdraw consent at any time.
- Not be subject to solely automated decisions producing legal or similarly significant effects, except as permitted by law.
To exercise your rights, contact info@xobriq.com (Attn: DPO). We will respond within the timelines required by law.`,
  },
  {
    title: "10. Third-Party Links",
    body: `Our website may link to third-party sites. We are not responsible for their privacy practices; review their policies before providing personal data.`,
  },
  {
    title: "11. Changes to This Policy",
    body: `We may update this Policy from time to time. Material changes will be announced on this page and, where appropriate, by email, with the "Last updated" date revised. Significant changes affecting your rights will be notified in advance where required by law.`,
  },
  {
    title: "12. Contact",
    body: `Xobriq Technologies Limited · Nairobi, Kenya · info@xobriq.com. For privacy enquiries, mark the subject line "Attn: DPO / Privacy".`,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      effectiveDate="14 July 2026"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      callout={{
        icon: ShieldCheck,
        title: "KDPA Compliant",
        body: (
          <>
            Xobriq&apos;s data practices are designed to comply with the Kenya Data Protection Act, 2019.
            You may contact the Office of the Data Protection Commissioner (ODPC) at{" "}
            <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-enterprise-primary hover:underline">
              odpc.go.ke
            </a>{" "}
            if you believe your rights have been infringed.
          </>
        ),
      }}
      footerLinks={[
        { href: "/terms", label: "Terms of Service" },
        { href: "/ai-ethics", label: "AI Ethics" },
      ]}
    />
  );
}
