// ============================================================================
//  /contact — Secure contact form
// ============================================================================
import { Section } from "@/components/shared/Section";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Xobriq.ai",
  description:
    "Talk to the Xobriq team about Guard, Agentic AI, GPU compute, consulting, or managed cybersecurity.",
};

type SearchParams = Promise<{ sent?: string; error?: string; type?: string; product?: string }>;

// The full set of "reason for contact" options the form's own dropdown
// exposes (mirrors xobriq.com's VALID_INQUIRY_TYPES) — used to validate
// ?type= before trusting it for anything, since the dropdown is now a real,
// user-editable field rather than a hidden one carrying the raw query value.
const CONTACT_FORM_TYPES = [
  "contact",
  "demo_request",
  "pricing_inquiry",
  "discovery_call",
  "partnership",
  "support",
] as const;

// Contextual copy for visitors arriving from a segmented homepage CTA
// (SegmentedCTAGrid, ROICalculator) — keeps the "subject" of their click
// visible on the page. Not every CONTACT_FORM_TYPES value needs an entry —
// "contact"/"support" simply fall back to the generic header below.
const SUBJECT_CONFIG: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  demo_request: {
    eyebrow: "Book a demo",
    title: "See Xobriq Guard in action.",
    subtitle:
      "A 30-minute call with our fraud engineering team — we'll walk through real fraud scenarios live.",
  },
  discovery_call: {
    eyebrow: "Discovery call",
    title: "Let's scope your engagement.",
    subtitle:
      "Tell us about your volume and fraud rate — we'll validate the ROI case and scope the right first engagement.",
  },
  partnership: {
    eyebrow: "Partnership",
    title: "Let's explore working together.",
    subtitle:
      "Integration partnerships, co-selling, and technology alliances with East African banks and fintechs.",
  },
  pricing_inquiry: {
    eyebrow: "Custom quote",
    title: "Let's scope your pricing.",
    subtitle:
      "Every engagement is priced to what you actually need — tell us which products and volume you're planning for, and we'll come back with a number.",
  },
};

const PRODUCT_TO_INTEREST: Record<string, string> = {
  "Xobriq Guard": "guard",
  "Xobriq KYC": "kyc",
  "Agentic AI": "agentic",
  "Xobriq Cloud": "cloud",
  "Xobriq Consult": "consult",
  "Xobriq Cyber": "cyber",
};

export default async function ContactPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const initialType: (typeof CONTACT_FORM_TYPES)[number] = (
    CONTACT_FORM_TYPES as readonly string[]
  ).includes(sp.type || "")
    ? (sp.type as (typeof CONTACT_FORM_TYPES)[number])
    : "contact";
  const subject = SUBJECT_CONFIG[initialType];
  // A specific product (from a per-product "Request" link) takes priority;
  // otherwise a segmented CTA's type isn't tied to one product, so default
  // to "other" — this pre-fills the required Interest select so the visitor
  // isn't prompted to guess a product that doesn't match why they clicked through.
  const interestFromProduct =
    (sp.product ? PRODUCT_TO_INTEREST[sp.product] : undefined) || (subject ? "other" : undefined);

  return (
    <Section>
      {sp.sent ? (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          ✓ Thanks! Your message is in — we&apos;ll be in touch within one
          business day.
        </div>
      ) : null}

      {sp.error ? (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {sp.error === "invalid_schedule"
            ? "Please pick a future date and time within business hours (Mon–Fri, 9am–5pm)."
            : "Something went wrong. Please try again or email info@xobriq.com directly."}
        </div>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        {/* LEFT — contact info */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-enterprise-primary">
            {subject ? subject.eyebrow : "Contact us"}
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            {subject ? subject.title : <>Let&apos;s build something defensible.</>}
          </h1>
          <p className="mt-5 text-fg-muted">
            {subject
              ? subject.subtitle
              : "Tell us about your fraud problem, AI maturity, GPU needs, or security posture. Initial discovery calls are always free."}
          </p>

          <ul className="mt-8 grid gap-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-xgold-600" />
              <div>
                <p className="font-semibold">Headquarters</p>
                <p className="text-fg-muted">
                  GTC Tower, 24th Floor, Westlands, Nairobi
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-enterprise-primary" />
              <div>
                <p className="font-semibold">Email</p>
                <a
                  href="mailto:info@xobriq.com"
                  className="text-fg-muted hover:text-fg"
                >
                  info@xobriq.com
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-xteal-500" />
              <div>
                <p className="font-semibold">Sales</p>
                <a
                  href="mailto:sales@xobriq.com"
                  className="text-fg-muted hover:text-fg"
                >
                  sales@xobriq.com
                </a>
              </div>
            </li>
          </ul>
        </div>

        {/* RIGHT — form (its own client component: needs interactive state
            to show the demo date/time picker only when "Request a demo" is
            selected) */}
        <ContactForm initialType={initialType} interest={interestFromProduct} />
      </div>
    </Section>
  );
}
