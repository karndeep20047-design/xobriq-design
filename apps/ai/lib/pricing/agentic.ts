import type { PricingTier } from "@/components/ai/PricingSection";

export const agenticTiers: PricingTier[] = [
  {
    name: "Pre-built Agent",
    price: "Custom",
    unit: "per deployment",
    desc: "Fraud, KYC, compliance, or SecOps agent — pre-built, fine-tuned to your data.",
    features: [
      "Fraud Investigation, KYC, Compliance, or SecOps",
      "Fine-tuned on your data under DPA",
      "Audit-grade decision logs",
      "Reduces analyst workload 60–80%",
    ],
    cta: { href: "/contact", label: "Book pilot" },
  },
  {
    name: "Custom Agent System",
    price: "$80K – $500K",
    unit: "per engagement",
    desc: "Bespoke autonomous agent built for your specific enterprise workflow.",
    featured: true,
    features: [
      "Discovery + workflow mapping",
      "Agent architecture + decision logic design",
      "Model fine-tuning on H200 under DPA",
      "Production deployment + monitoring",
      "Staff transition support",
    ],
    cta: { href: "/contact", label: "Talk to sales" },
  },
  {
    name: "Agent + MLOps",
    price: "From $3K",
    unit: "/ month per agent",
    desc: "Managed deployment, monitoring, and retraining of your agents.",
    features: [
      "Continuous performance monitoring",
      "Automated retraining on drift",
      "MLflow versioning + audit",
      "Monthly performance reports",
    ],
    cta: { href: "/contact", label: "Get managed plan" },
  },
];