import type { PricingTier } from "@/components/ai/PricingSection";

export const cyberTiers: PricingTier[] = [
  {
    name: "Penetration Testing",
    price: "$8K – $40K",
    unit: "per engagement",
    desc: "Black, grey, white box. API security, social engineering. CVSS-rated reports.",
    features: [
      "Annual repeat for enterprise clients",
      "API security for banking / fintech",
      "Social engineering assessments",
      "Prioritised remediation guidance",
    ],
    cta: { href: "/contact", label: "Book pentest" },
  },
  {
    name: "Managed SIEM",
    price: "$3K – $12K",
    unit: "/ month",
    desc: "24/7 AI-powered security event monitoring on Xobriq H200 infrastructure.",
    featured: true,
    features: [
      "Wazuh on H200 · AI alert triage",
      "60–70% fewer false positives",
      "MITRE ATT&CK-aligned rules",
      "Grafana / Prometheus dashboards",
      "Monthly CISO reports",
    ],
    cta: { href: "/contact", label: "Start SIEM" },
  },
  {
    name: "Incident Response Retainer",
    price: "$15K – $50K",
    unit: "annual retainer",
    desc: "Named IR partner. Activated on breach within 2 hours per SLA.",
    features: [
      "2-hour activation SLA",
      "Digital forensics + root cause",
      "Containment + eradication",
      "CBK / CMA / DPC notification support",
      "Post-incident review report",
    ],
    cta: { href: "/contact", label: "Get retainer" },
  },
];