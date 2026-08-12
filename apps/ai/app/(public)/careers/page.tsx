import { Section } from "@/components/shared/Section";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBlock } from "@/components/shared/CtaBlock";
import { ConsultantApplicationForm } from "./ConsultantApplicationForm";
import { TEAMS } from "./teams";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — Xobriq",
  description: "Build the future of African AI infrastructure with us.",
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        accent="gold"
        iconName="Briefcase"
        eyebrow="Careers"
        title={<>Build AI infrastructure for <span className="brand-gradient">a continent.</span></>}
        subtitle="We&apos;re hiring engineers, consultants, and operators who want to ship production AI at enterprise scale."
        ctas={[{ href: "#expert-roster", label: "View Open Roles", variant: "primary" }]}
      />

      <Section>
        <div className="glass-panel mx-auto max-w-3xl rounded-2xl border-2 border-enterprise-primary/20 p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-enterprise-primary/15 text-enterprise-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="label-caps-thin text-enterprise-primary">Always Hiring Exceptional Talent</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            We&apos;re always looking for <span className="text-enterprise-primary">great builders.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-enterprise-fg-muted">
            We&apos;re genuinely open to strong candidates across every discipline below, even when a
            specific role isn&apos;t listed — reach out and our People &amp; Culture team will keep you
            in mind.
          </p>
        </div>
      </Section>

      <Section className="bg-enterprise-bg-low/40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps-thin text-enterprise-accent">Where you might fit</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Six teams. One mission.</h2>
          <p className="mt-4 text-enterprise-fg-muted">
            When we hire, we hire across these six disciplines. Tell us where you see yourself and
            we&apos;ll keep you in mind.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map((t) => (
            <div key={t.name} className="glass-panel rounded-2xl p-6">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-enterprise-primary/10">
                <t.Icon className="h-5 w-5 text-enterprise-primary" />
              </div>
              <h3 className="mt-4 font-bold text-enterprise-fg">{t.name}</h3>
              <p className="mt-1 text-sm text-enterprise-fg-muted">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="expert-roster" className="bg-enterprise-bg-low/40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps-thin text-enterprise-accent">Expert Roster</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Open consultancy positions.</h2>
          <p className="mt-4 text-enterprise-fg-muted">
            We&apos;re building a roster of pre-qualified independent consultants for upcoming public-sector and
            enterprise ICT consulting bids. Successful applicants are considered as Key Experts on project teams
            when we respond to tenders — applications are accepted on a rolling basis and retained for future
            opportunities.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-6xl">
          <ConsultantApplicationForm />
        </div>
      </Section>

      <CtaBlock
        title="Don't see your role?"
        body="If you're exceptional and African AI excites you, we want to hear from you."
        primaryLabel="View open roles"
        primaryHref="#expert-roster"
      />
    </>
  );
}
