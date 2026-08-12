import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Section } from "./Section";

type LegalSection = { title: string; body: string };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  effectiveDate?: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  callout?: { icon: LucideIcon; title: string; body: React.ReactNode };
  footerLinks: { href: string; label: string }[];
};

export function LegalPage({
  eyebrow,
  title,
  effectiveDate,
  lastUpdated,
  intro,
  sections,
  callout,
  footerLinks,
}: LegalPageProps) {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <p className="label-caps-thin text-enterprise-primary">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-enterprise-fg-muted">
            {effectiveDate ? (
              <>Effective date: <span className="font-mono text-enterprise-fg">{effectiveDate}</span> &nbsp;·&nbsp; </>
            ) : null}
            Last updated: <span className="font-mono text-enterprise-fg">{lastUpdated}</span>
          </p>
          <div className="mt-6 h-px bg-gradient-to-r from-enterprise-primary/40 via-enterprise-primary/10 to-transparent" />
        </div>

        <p className="mb-10 whitespace-pre-line leading-relaxed text-enterprise-fg-muted">{intro}</p>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="mb-2 text-lg font-semibold sm:text-xl">{s.title}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-enterprise-fg-muted sm:text-base">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {callout ? (
          <div className="mt-12 flex items-start gap-4 rounded-xl border border-enterprise-primary/20 bg-enterprise-surface p-6">
            <callout.icon className="h-6 w-6 shrink-0 text-enterprise-primary" />
            <div>
              <div className="label-caps-thin mb-1 text-enterprise-primary">{callout.title}</div>
              <p className="text-sm text-enterprise-fg-muted">{callout.body}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-enterprise-border pt-8 sm:flex-row sm:items-center">
          <Link href="/" className="text-xs font-semibold text-enterprise-primary hover:underline">
            ← Back to Home
          </Link>
          <div className="flex gap-6 text-xs font-semibold text-enterprise-fg-muted">
            {footerLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-enterprise-primary">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
