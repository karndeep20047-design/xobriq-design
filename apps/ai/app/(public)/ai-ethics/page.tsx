import type { Metadata } from "next";
import { Gavel } from "lucide-react";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "AI Ethics — Xobriq",
  description: "The principles that govern how Xobriq designs, builds, deploys, and governs AI.",
};

const intro = `Xobriq builds AI systems that decide, in milliseconds, whether a face is real, whether a document is genuine, and whether a transaction is trustworthy. These decisions affect people's access to money, identity, and opportunity. That responsibility demands more than technical excellence — it demands an explicit ethical commitment. This Policy sets out the principles that govern how we design, build, deploy, and govern AI at Xobriq, and what we require of the customers who use it.`;

const sections = [
  {
    title: "Human-Centred Purpose",
    body: `We build AI to protect people from fraud, impersonation, and identity theft — not to surveil, exclude, or discriminate. Every capability we ship must have a legitimate protective purpose.
We will not develop or knowingly permit our technology to be used for:
- mass surveillance unrelated to a specific fraud-prevention or verification purpose;
- social scoring of individuals by governments or private actors;
- suppression of lawful expression, journalism, or political participation;
- creation or distribution of deceptive synthetic media; or
- targeting individuals on the basis of protected characteristics.`,
  },
  {
    title: "Fairness and Non-Discrimination",
    body: `Facial recognition and liveness systems have historically underperformed on darker skin tones and non-Western documents. As a company built in East Africa, for Africa, we treat this core engineering problem seriously.
We train, test, and benchmark our models on demographically representative African datasets and measure disaggregated performance across demographic groups. Models that fail our internal thresholds for acceptable disparity are not deployed, and we reassess when monitoring detects drift. Behavioural analytics models are reviewed to ensure they do not use, or act as proxies for, protected characteristics.`,
  },
  {
    title: "Human Oversight and Accountability",
    body: `AI at Xobriq supports human decisions; it does not silently replace them where the stakes are significant.
Guard API outputs are risk signals and recommendations. We require customers to maintain meaningful human review for adverse decisions with legal or similarly significant effects on individuals, consistent with Section 35 KDPA and Article 22 GDPR. Our autonomous agents operate within defined authority boundaries, and high-impact actions require human approval or immediate override when configured with the customer. Every automated decision is logged and attributable.`,
  },
  {
    title: "Transparency and Explainability",
    body: `Individuals interacting with our verification flows should know they are being assessed by an automated system. We require customers to disclose this in their user journeys.
Guard API responses include reason codes and confidence signals, not bare verdicts, so reviewers and affected individuals can understand and contest outcomes. We document intended use, limitations, training data characteristics, and known failure modes in customer model documentation.`,
  },
  {
    title: "Privacy and Data Minimisation by Design",
    body: `We collect and process the minimum data necessary for each verification or detection task.
Biometric data is encrypted, access-restricted, deleted on the shortest schedule consistent with the customer's legal obligations, and never reused across customers or repurposed for training without explicit opt-in. Behavioural baselines are limited to a rolling 90-day window. Sovereign-tier customer data does not leave Kenya, and we offer on-device processing options where feasible.`,
  },
  {
    title: "Security and Robustness",
    body: `Our models and infrastructure are protected by the same standards we sell: 24/7 SIEM monitoring, regular penetration testing, encryption, and least-privilege access.
We test against adversarial attacks, presentation attacks, injection attacks, prompt manipulation, and evolving deepfake techniques, and we retrain or roll back degraded models. We operate a responsible disclosure channel at info@xobriq.com.`,
  },
  {
    title: "Responsible Deepfake Detection",
    body: `Our synthetic media capabilities exist to defend, never to deceive.
We do not build generative tools for creating synthetic faces, voices, or documents, except tightly controlled internal red-team assets used solely to harden our detectors. Detection outputs express calibrated confidence, and customers are advised not to treat them as proof of wrongdoing without human review.`,
  },
  {
    title: "Customer and Deployment Standards",
    body: `We choose who we work with. Before high-risk deployments, we conduct due diligence on the intended use. Our Terms of Service prohibit uses that violate this Policy, and we may suspend or terminate access for customers who use our AI to harm people.
Where a deployment is likely to pose high risk to individuals' rights, we support customers in conducting Data Protection Impact Assessments as required by KDPA s.31 and GDPR Art. 35.`,
  },
  {
    title: "Compliance and External Alignment",
    body: `Our practices align with the Kenya Data Protection Act, 2019 and its Regulations, the GDPR for EEA/UK data subjects, and emerging obligations of the EU AI Act for high-risk systems.
We also align with sector rules relevant to our customers, including Central Bank of Kenya and AML/CFT frameworks, and international frameworks such as OECD AI Principles, NIST AI RMF, the African Union AI strategy, ISO/IEC 27001, and emerging AI management standards.`,
  },
  {
    title: "Governance, Review, and Continuous Improvement",
    body: `An internal AI Ethics & Governance Committee reviews this Policy, approves high-risk releases, and adjudicates escalations. Employees working on AI systems receive ethics and data protection training.
This Policy is reviewed at least annually and whenever law, technology, or our services change materially. Questions or concerns may be sent to info@xobriq.com (Attn: AI Ethics).`,
  },
];

export default function AIEthicsPage() {
  return (
    <LegalPage
      eyebrow="Responsible AI"
      title="AI Ethics"
      lastUpdated="14 July 2026"
      intro={intro}
      sections={sections}
      callout={{
        icon: Gavel,
        title: "Governance & Contact",
        body: (
          <>
            Questions, concerns, or reports regarding the ethical use of Xobriq AI can be sent to{" "}
            <a href="mailto:info@xobriq.com" className="text-enterprise-primary hover:underline">info@xobriq.com</a>{" "}
            (Attn: AI Ethics). Xobriq Technologies Limited · Nairobi, Kenya.
          </>
        ),
      }}
      footerLinks={[
        { href: "/terms", label: "Terms of Service" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    />
  );
}
