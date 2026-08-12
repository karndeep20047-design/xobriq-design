import Image from "next/image";
import { Section } from "@/components/shared/Section";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBlock } from "@/components/shared/CtaBlock";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Case Studies — Xobriq",
  description: "How Xobriq engagements are structured, from pilot to production.",
};

const engagementModels = [
  {
    image: "/images/ops-dashboard.png",
    imageAlt: "Fraud operations dashboard",
    tag: "Financial Services",
    title: "Shadow-mode fraud pilots",
    body:
      "Xobriq Guard runs alongside your existing fraud stack in shadow mode first — scoring live traffic without acting on it — so you can see detection lift on your own data before anything goes live.",
  },
  {
    image: "/images/gpu-rack.png",
    imageAlt: "GPU server racks in a data center",
    tag: "Infrastructure",
    title: "Sovereign cloud buildouts",
    body:
      "For banks, governments, and enterprises that need full data residency, we scope dedicated GPU capacity on our Nairobi cluster to your compliance and workload requirements from day one.",
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <PageHero
        accent="blue"
        eyebrow="Case Studies"
        title={<>Real deployments, <span className="brand-gradient">coming soon.</span></>}
        subtitle="We're in early engagements with banks, fintechs, and public-sector partners across East Africa. As deployments go live, we'll publish detailed case studies here — with real numbers and client permission."
        ctas={[{ href: "/contact?type=discovery_call", label: "Talk to us about a pilot", variant: "primary" }]}
      />

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps-thin text-enterprise-accent">How engagements are structured</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">What working with us looks like</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {engagementModels.map((m) => (
            <article key={m.title} className="glass-panel group relative overflow-hidden rounded-2xl">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={m.image}
                  alt={m.imageAlt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-enterprise-bg via-enterprise-bg/40 to-transparent" />
              </div>
              <div className="p-6">
                <span className="label-caps-thin rounded-full bg-enterprise-primary/15 px-3 py-1 text-enterprise-primary">
                  {m.tag}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{m.title}</h3>
                <p className="mt-3 text-sm leading-6 text-enterprise-fg-muted">{m.body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <CtaBlock
        title="Want to be one of our first published case studies?"
        body="If you're evaluating Guard, Cloud, or Agentic AI, let's scope a pilot on your own data — real results, not marketing copy."
        primaryLabel="Book a discovery call"
        primaryHref="/contact?type=discovery_call"
        secondaryLabel="See our approach to performance"
        secondaryHref="/benchmarks"
      />
    </>
  );
}
