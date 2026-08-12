// ============================================================================
//  /about — Company story, leadership positioning, location
// ============================================================================
import { Section } from "@/components/shared/Section";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBlock } from "@/components/shared/CtaBlock";
import { Building2, Globe2, MapPin, Target } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Xobriq Technologies Limited",
  description:
    "Xobriq is East Africa's enterprise AI cybersecurity company, headquartered at GTC Tower, Westlands, Nairobi.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        accent="blue"
        iconName="Building2"
        title={
          <>
            Intelligence at scale,{" "}
            <span className="brand-gradient">built in Nairobi.</span>
          </>
        }
        subtitle="Xobriq Technologies is East Africa's enterprise AI cybersecurity company. We operate five integrated service pillars serving banks, fintechs, insurers, telcos, government agencies, and enterprises across East Africa and globally."
        ctas={[
          { href: "/careers", label: "Join the team", primary: true },
          { href: "/contact", label: "Contact us" },
        ]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <article className="rounded-3xl border border-border bg-bg-subtle p-8">
            <Target className="h-8 w-8 text-enterprise-primary" />
            <h3 className="mt-4 text-xl font-bold">Mission</h3>
            <p className="mt-3 text-sm text-fg-muted">
              Make production-grade AI accessible to African enterprises with
              sovereignty, accuracy, and regulatory compliance built in.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-bg-subtle p-8">
            <Globe2 className="h-8 w-8 text-xgold-600" />
            <h3 className="mt-4 text-xl font-bold">Reach</h3>
            <p className="mt-3 text-sm text-fg-muted">
              East Africa first. Deployments and partnerships expanding across
              West Africa, GCC, and South Asia.
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-bg-subtle p-8">
            <MapPin className="h-8 w-8 text-xteal-500" />
            <h3 className="mt-4 text-xl font-bold">Headquarters</h3>
            <p className="mt-3 text-sm text-fg-muted">
              GTC Tower, 24th Floor, Westlands, Nairobi. Datacenter colocation
              in Nairobi Tier 3 facility.
            </p>
          </article>
        </div>
      </Section>

      <Section className="bg-bg-subtle">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">
              Five pillars. One platform.
            </h2>
            <p className="mt-4 text-fg-muted">
              Agentic AI, Guard, Cloud, Consult, Cyber — each pillar works
              standalone but compounds when combined. A bank that starts with
              Guard for fraud often deploys Agentic AI for KYC, Cloud for
              sovereign hosting, and Cyber for managed SIEM within 18 months.
            </p>
            <p className="mt-4 text-fg-muted">
              Consulting is the entry path — we don&apos;t sell software before
              we&apos;ve assessed the problem.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Headquarters", value: "Nairobi, Kenya" },
              { label: "Infrastructure", value: "NVIDIA DGX H200" },
              { label: "Data residency", value: "Kenya DPA compliant" },
              { label: "Tagline", value: "Data. AI. Clarity." },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-bg p-5"
              >
                <p className="text-xs uppercase tracking-widest text-fg-muted">
                  {stat.label}
                </p>
                <p className="mt-2 font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBlock
        title="Want to work with us — or for us?"
        body="Whether you're an enterprise looking for a partner or an engineer looking for a mission, we'd love to hear from you."
        primaryHref="/careers"
        primaryLabel="See open roles"
        secondaryHref="/contact"
      />
    </>
  );
}