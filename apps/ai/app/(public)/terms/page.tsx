import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Xobriq",
  description: "The terms governing access to and use of Xobriq's websites, platforms, APIs, and services.",
};

const intro = `These Terms of Service (“Terms”) govern your access to and use of the websites, platforms, APIs, applications, and Services operated by Xobriq Technologies Limited, a company incorporated in the Republic of Kenya. Please read them carefully before using our Services.`;

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, do not access or use the Services. These Terms apply to all users, clients, and third parties who access or use our Services.`,
  },
  {
    title: "2. The Services",
    body: `Xobriq provides AI-powered trust and fraud intelligence services, including but not limited to: Xobriq Guard, Xobriq Agentic AI, Xobriq Cloud, Xobriq Consult, and Xobriq Cyber. Certain Services may be offered in private beta, early access, or waitlist form and may be modified or discontinued at any time.`,
  },
  {
    title: "3. Eligibility and Accounts",
    body: `The Services are intended for business and enterprise use. You must be at least 18 years old and legally capable of entering into binding contracts. You are responsible for the accuracy of the information you provide, for safeguarding your credentials and API keys, and for activity under your account. Notify us immediately at info@xobriq.com if you suspect unauthorised access.`,
  },
  {
    title: "4. Customer Obligations and Lawful Use",
    body: `When you submit personal data to the Services, you warrant that you have a lawful basis under applicable law, including the KDPA and GDPR where applicable, and that you have obtained any required notices and consents. You must not use the Services to unlawfully surveil, profile, discriminate, harm individuals, submit data you have no right to process, reverse engineer the Services, resell the Services without authorisation, or generate synthetic media intended to deceive or impersonate.`,
  },
  {
    title: "5. Service Outputs, Accuracy, and Human Oversight",
    body: `Our Services produce risk signals and recommendations. They are probabilistic and may generate false positives or false negatives. Customers should maintain appropriate human oversight, review mechanisms, and escalation procedures, especially for decisions that deny access to services or have significant consequences. Published metrics are targets or measured benchmarks and do not constitute warranties unless incorporated into a signed SLA.`,
  },
  {
    title: "6. Fees and Payment",
    body: `Fees are set out in the applicable order form or statement of work and are exclusive of taxes. Payment terms, currency, and late payment treatment are defined in the order form. Late payments may accrue interest and may lead to suspension of access after notice.`,
  },
  {
    title: "7. Intellectual Property",
    body: `Xobriq and its licensors retain all rights in the Services, including software, models, algorithms, documentation, and trademarks. You retain ownership of the data you submit. You grant us a limited licence to process your data solely to deliver, secure, and support the Services. We do not use customer data to train models for other customers without explicit opt-in.`,
  },
  {
    title: "8. Confidentiality",
    body: `Each party agrees to protect the other party's confidential information with at least the same care it uses for its own confidential information, and not less than reasonable care. Confidential information does not include information already in the public domain through no breach of these Terms or information required to be disclosed by law.`,
  },
  {
    title: "9. Data Protection and Security",
    body: `Xobriq processes personal data in accordance with the KDPA, GDPR where applicable, and the DPA. We maintain appropriate safeguards including encryption, access controls, logging, and secure infrastructure. We will notify you promptly of any personal data breach affecting your data in accordance with applicable law.`,
  },
  {
    title: "10. Warranties and Disclaimers",
    body: `Except as expressly stated in these Terms or a signed order form, the Services are provided "as is" and "as available". To the maximum extent permitted by law, Xobriq disclaims all implied warranties, including merchantability and fitness for a particular purpose. Nothing in these Terms excludes liability that cannot be excluded under applicable law.`,
  },
  {
    title: "11. Limitation of Liability",
    body: `To the maximum extent permitted by law, neither party will be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, goodwill, or data. Each party's total aggregate liability will not exceed the fees paid or payable in the twelve months preceding the claim, except for payment obligations, indemnification obligations, or liability that cannot be limited by law.`,
  },
  {
    title: "12. Indemnification",
    body: `You agree to indemnify Xobriq against claims arising from your Customer Data or End User Data, your breach of these Terms, or your infringement of third-party rights. Xobriq will indemnify you against third-party claims that the Services infringe intellectual property rights, subject to customary exclusions and remedies.`,
  },
  {
    title: "13. Term, Suspension, and Termination",
    body: `These Terms apply from your first use of the Services and continue until terminated. We may suspend the Services immediately when necessary to prevent harm, respond to a security incident, or comply with law. Either party may terminate for material breach not cured within 30 days or immediately upon insolvency. Upon termination, outstanding fees become due, and we will delete or return Customer Data in accordance with the DPA and applicable law.`,
  },
  {
    title: "14. Governing Law and Dispute Resolution",
    body: `These Terms are governed by the laws of the Republic of Kenya. Disputes will first be addressed by good-faith negotiation and, if unresolved within 30 days, referred to arbitration in Nairobi under the Arbitration Act, 1995 (as amended). The language of arbitration will be English. Either party may seek interim injunctive relief in court.`,
  },
  {
    title: "15. General",
    body: `We may update these Terms from time to time. Material changes will be notified via the website or email at least 14 days before taking effect. Continued use after the effective date constitutes acceptance. These Terms, together with the Privacy Policy, DPA, and any order forms or SLAs, constitute the entire agreement. If any provision is unenforceable, the remainder remains in effect.`,
  },
  {
    title: "16. Contact",
    body: `Contact: Xobriq Technologies Limited · Nairobi, Kenya · info@xobriq.com`,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate="14 July 2026"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      footerLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/ai-ethics", label: "AI Ethics" },
      ]}
    />
  );
}
