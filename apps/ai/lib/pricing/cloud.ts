import type { PricingTier } from "@/components/ai/PricingSection";

export const cloudTiers: PricingTier[] = [
  {
    name: "Shared Partition",
    price: "$2.50",
    unit: "/ GPU hour",
    desc: "MIG-isolated H200 slice for startups, researchers, ML practitioners.",
    features: [
      "CUDA, PyTorch, TensorFlow pre-installed",
      "HuggingFace integration",
      "Per-second billing",
      "Sub-20ms latency from Nairobi",
    ],
    cta: { href: "/register", label: "Spin up GPU" },
  },
  {
    name: "Reserved H200",
    price: "$5.60",
    unit: "/ GPU hour",
    desc: "Reserved monthly capacity at 20% discount for steady workloads.",
    featured: true,
    features: [
      "8× H200 SXM · 141GB HBM3e each",
      "1 PetaFLOP AI compute",
      "20% discount vs on-demand",
      "Reserved capacity guarantee",
    ],
    cta: { href: "/contact", label: "Reserve capacity" },
  },
  {
    name: "On-Demand H200",
    price: "$7.00",
    unit: "/ GPU hour",
    desc: "Full DGX H200 access on demand. Best for production inference.",
    features: [
      "NVLink interconnect",
      "MIG partitioning available",
      "99.9% uptime SLA",
      "Triton multi-model serving",
    ],
    cta: { href: "/register", label: "Launch instance" },
  },
];