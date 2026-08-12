// ============================================================================
//  CtaBlock — bottom-of-page conversion block
// ============================================================================
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CtaBlockProps = {
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CtaBlock({
  title,
  body,
  primaryHref = "/dashboard",
  primaryLabel = "Launch Console",
  secondaryHref = "/contact",
  secondaryLabel = "Talk to sales",
}: CtaBlockProps) {
  return (
    <section className="px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-gradient-to-br from-enterprise-primary/10 via-bg-subtle to-enterprise-accent/10 p-8 text-center md:p-14">
        <h2 className="text-3xl font-black sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-fg-muted">{body}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="glow-hover inline-flex items-center justify-center gap-2 rounded-lg bg-enterprise-primary px-6 py-3 font-semibold text-enterprise-on-primary hover:bg-enterprise-primary-hover"
          >
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-bg-subtle px-6 py-3 font-semibold text-fg hover:bg-bg-elevated"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}