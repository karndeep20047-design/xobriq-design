import type { PricingTier } from "@/components/ai/PricingSection";

export const consultTiers: PricingTier[] = [
  {
    name: "AI Maturity Assessment",
    price: "$8K – $15K",
    unit: "fixed · 3–4 weeks",
    desc: "Entry product. Scored report + prioritised 12-month AI roadmap.",
    featured: true,
    features: [
      "Data, governance, infra, talent dimensions",
      "Build-vs-buy analysis per use case",
      "12-month roadmap with ROI estimates",
      "Always the first engagement",
    ],
    cta: { href: "/contact", label: "Book assessment" },
  },
  {
    name: "Implementation",
    price: "$30K – $200K",
    unit: "per engagement",
    desc: "Fraud detection, custom ML, data engineering, or governance audit.",
    features: [
      "Fraud Implementation: $30K – $120K",
      "Custom ML: $30K – $200K",
      "Data Engineering: $20K – $80K",
      "Governance Audit: $10K – $35K",
    ],
    cta: { href: "/contact", label: "Request proposal" },
  },
  {
    name: "MLOps as a Service",
    price: "$3K – $8K",
    unit: "/ month per client",
    desc: "Ongoing model monitoring, retraining, and reporting on H200.",
    features: [
      "Evidently AI continuous monitoring",
      "Automated retraining on drift",
      "MLflow version history",
      "Monthly reports to tech + compliance",
    ],
    cta: { href: "/contact", label: "Get MLOps plan" },
  },
];