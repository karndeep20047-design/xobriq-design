// ============================================================================
//  Guard pricing — from services portfolio
// ============================================================================
import type { PricingTier } from "@/components/ai/PricingSection";

export const guardTiers: PricingTier[] = [
  {
    name: "Sandbox",
    price: "Free",
    unit: "for evaluation",
    desc: "Test Guard against synthetic transactions and identity payloads.",
    features: [
      "10,000 test API calls / month",
      "All Guard signals available",
      "Sandbox environment + SDKs",
      "Community support",
    ],
    cta: { href: "/register", label: "Get sandbox key" },
  },
  {
    name: "Growth",
    price: "Pay-as-you-go",
    unit: "from $0.002 / call",
    desc: "For fintechs, digital lenders, and growing banks.",
    featured: true,
    features: [
      "Production API keys",
      "Fraud, deepfake, identity & behavioural engines",
      "99.9% uptime SLA",
      "Case management module",
      "Email + Slack support",
    ],
    cta: { href: "/contact", label: "Talk to sales" },
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    desc: "For Tier 1 banks, telcos, insurers, and government.",
    features: [
      "Dedicated MIG-isolated infrastructure",
      "Custom model fine-tuning on your data",
      "On-premise deployment option",
      "Named CSM + 24/7 incident response",
      "CBK / CMA / FCA compliance support",
    ],
    cta: { href: "/contact", label: "Request quote" },
  },
];