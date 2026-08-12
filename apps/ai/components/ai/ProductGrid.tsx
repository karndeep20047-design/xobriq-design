
import { Cpu, Database, Gauge, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";

const products = [
  {
    name: "Guard API",
    desc: "Real-time fraud scoring for payments, KYC events, and account activity.",
    price: "From $0.002 / request",
    icon: ShieldCheck
  },
  {
    name: "AI Workspaces",
    desc: "Organize projects, conversations, files, and AI agents by team.",
    price: "Usage based",
    icon: Workflow
  },
  {
    name: "Benchmarks",
    desc: "Track latency, model quality, false positives, and API reliability.",
    price: "Included",
    icon: Gauge
  },
  {
    name: "Secure APIs",
    desc: "API keys, scoped access, audit trails, and token-based auth.",
    price: "Developer-ready",
    icon: LockKeyhole
  },
  {
    name: "Data Connectors",
    desc: "Connect transaction, identity, and operational data to AI workflows.",
    price: "Enterprise",
    icon: Database
  },
  {
    name: "Compute Routing",
    desc: "Prepare for AI inference routing and GPU-backed enterprise workloads.",
    price: "Coming soon",
    icon: Cpu
  }
];

export function ProductGrid() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              Marketplace-style platform
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">
              Pick the AI product you need.
            </h2>
          </div>
          <p className="max-w-xl text-slate-400">
            Inspired by cloud marketplaces: clear product cards, transparent usage,
            API-first onboarding, and dashboard access.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <div key={product.name} className="glass rounded-3xl p-6 transition hover:-translate-y-1 hover:border-blue-400/40">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/20 text-blue-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-400">{product.desc}</p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-cyan-200">
                  {product.price}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
