// ============================================================================
//  Xobriq.ai — Public Footer
//  ---------------------------------------------------------------------------
//  - Light & dark mode aware via CSS variables in globals.css
//  - Brand-aligned: deep blue + mustard gold from the Xobriq logo
//  - Inspired by vast.ai / runpod.io footer density
//  - Brand icons (LinkedIn, X, GitHub) come from react-icons,
//    because lucide-react removed all brand/trademark icons.
//  - Generic UI icons (Mail, MapPin) come from lucide-react.
// ============================================================================

import Image from "next/image";
import Link from "next/link";

// Generic UI icons
import { Mail, MapPin } from "lucide-react";

// Brand icons (install once: npm install react-icons)
import { FaGithub, FaXTwitter, FaLinkedinIn, FaYoutube, FaFacebookF, FaInstagram } from "react-icons/fa6";

// ----------------------------------------------------------------------------
//  Footer link columns — edit these arrays to add/remove links
// ----------------------------------------------------------------------------
const columns = [
  {
    title: "Products",
    links: [
      { href: "/guard", label: "Xobriq Guard" },
      { href: "/agentic", label: "Agentic AI" },
      { href: "/cloud", label: "Xobriq Cloud" },
      { href: "/consult", label: "Xobriq Consult" },
      { href: "/cyber", label: "Xobriq Cyber" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/developers", label: "API Keys" },
      { href: "/benchmarks", label: "Benchmarks" },
      { href: "/dashboard", label: "Console" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/ai-ethics", label: "AI Ethics" },
      { href: "/dpa", label: "Data Protection" },
      { href: "/sla", label: "SLA" },
      { href: "/security", label: "Security" },
    ],
  },
];

// ----------------------------------------------------------------------------
//  Social links
// ----------------------------------------------------------------------------
const socials = [
  {
    href: "https://linkedin.com/company/xobriq",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
  {
    href: "https://x.com/xobriq",
    label: "X (Twitter)",
    Icon: FaXTwitter,
  },
  {
    href: "https://github.com/xobriq",
    label: "GitHub",
    Icon: FaGithub,
  },
  {
    href: "https://www.youtube.com/@XobriqTechnologiesLTD",
    label: "YouTube",
    Icon: FaYoutube,
  },
  {
    href: "https://www.facebook.com/people/Xobriq-Technologies-LTD/61592448488064/",
    label: "Facebook",
    Icon: FaFacebookF,
  },
  {
    href: "https://www.instagram.com/xobriqtechnologies/",
    label: "Instagram",
    Icon: FaInstagram,
  },
];

// ============================================================================
//  Footer Component
// ============================================================================
export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="mx-auto max-w-7xl px-5 py-14">

        {/* ============================================================ */}
        {/*  TOP SECTION — Brand block + 4 link columns                  */}
        {/* ============================================================ */}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2.8fr]">

          {/* ---------- Brand block ---------- */}
          <div>
            <Image
              src="/xobriq-logo-horizontal.png"
              alt="Xobriq"
              width={150}
              height={40}
              className="h-10 w-auto dark:brightness-110"
            />

            <p className="mt-4 max-w-sm text-sm leading-6 text-fg-muted">
              East Africa&apos;s enterprise AI cybersecurity company.
              Five integrated pillars — Agentic AI, Guard, Cloud, Consult and
              Cyber — built on sovereign DGX H200 infrastructure in Nairobi.
            </p>

            {/* Contact details */}
            <div className="mt-5 flex flex-col gap-2 text-sm text-fg-muted">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-xgold-600" />
                GTC Tower, 24th Floor, Westlands, Nairobi
              </span>

              <a
                href="mailto:info@xobriq.com"
                className="flex items-center gap-2 transition hover:text-fg"
              >
                <Mail className="h-4 w-4 text-enterprise-primary" />
                info@xobriq.com
              </a>
            </div>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-bg-elevated"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ---------- 4 link columns ---------- */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-fg">
                  {col.title}
                </h4>

                <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="transition hover:text-fg"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  BOTTOM SECTION — copyright + status + location              */}
        {/* ============================================================ */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">

          {/* Copyright + tagline */}
          <p className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} Xobriq Technologies Limited.
            <span className="mx-1">·</span>
            <span className="brand-gradient font-semibold">
              Data. AI. Clarity.
            </span>
          </p>

          {/* Status + location */}
          <div className="flex items-center gap-4 text-xs text-fg-subtle">
            <span className="flex items-center gap-2">
              <span className="status-dot" />
              All systems operational
            </span>
            <span>Made in Nairobi 🇰🇪</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
