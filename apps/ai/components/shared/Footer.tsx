// ============================================================================
//  Xobriq.ai — Public Footer (Hover Effect Layout)
//  ---------------------------------------------------------------------------
//  - Card-like floating footer container with rounded corners and gradient backdrop
//  - SVG text hover effect showcasing "XOBRIQ" dynamically on cursor proximity
//  - Brand block full-width up top, then a 2-col (mobile) / 4-col (desktop)
//    grid for Products/Developers/Company/Legal — was a single grid with the
//    brand block as a "5th column", which meant every section (including
//    each link group) stacked one-per-row on mobile: a lot of scrolling for
//    not much information per screen. Social icons live in the bottom bar,
//    left of the copyright/status line (single location, not duplicated).
//  - Theme-reactive: was permanently dark regardless of the site's light/
//    dark toggle; every colour below now has a light-mode default plus a
//    dark: override.
// ============================================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { FaGithub, FaXTwitter, FaLinkedinIn, FaYoutube, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { TextHoverEffect } from "@/components/ui/hover-footer";
import { HeroBackgroundSnippet } from "@/components/ui/tailwind-css-background-snippet";

const productLinks = [
  { href: "/guard", label: "Xobriq Guard" },
  { href: "/agentic", label: "Agentic AI" },
  { href: "/cloud", label: "Xobriq Cloud" },
  { href: "/consult", label: "Xobriq Consult" },
  { href: "/cyber", label: "Xobriq Cyber" },
];

const developerLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/api-keys", label: "API Keys" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/console", label: "Console" },
  { href: "/pricing", label: "Pricing" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/ethics", label: "AI Ethics" },
  { href: "/data-protection", label: "Data Protection" },
  { href: "/sla", label: "SLA" },
  { href: "/security", label: "Security" },
];

const linkGroups = [
  { title: "Products", links: productLinks },
  { title: "Developers", links: developerLinks },
  { title: "Company", links: companyLinks },
  { title: "Legal", links: legalLinks },
];

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

export function Footer() {
  return (
    <footer className="relative h-fit overflow-hidden z-10">
      {/* Same background treatment as HeroParticleScan (radial aurora +
          spotlight glows, themed for both light/dark) instead of the
          footer's own separate colour choices — the two sections bookend
          the page, so sharing this makes that intentional rather than the
          footer looking like a visually unrelated block glued on. */}
      <HeroBackgroundSnippet />

      <div className="max-w-7xl mx-auto px-8 pt-8 pb-2 sm:px-14 sm:pt-14 sm:pb-4 z-40 relative">
        <div className="grid grid-cols-1 gap-12 pb-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand block — full width above the link columns on mobile;
              becomes the first of 5 side-by-side columns on desktop (the
              original layout), via the grid this whole block sits in. */}
          <div className="flex max-w-md flex-col space-y-4 lg:self-start">
            <Image
              src="/xobriq-logo-horizontal.png"
              alt="Xobriq Logo"
              width={2484}
              height={809}
              className="h-11 w-auto self-start object-contain dark:brightness-110"
            />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              East Africa&apos;s enterprise AI cybersecurity company. Five integrated pillars: Agentic AI, Guard, Cloud, Consult and Cyber, built on sovereign DGX H200 infrastructure in Nairobi.
            </p>

            <div className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#3ca2fa] shrink-0" />
                <span>GTC Tower, 24th Floor, Westlands, Nairobi</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#3ca2fa] shrink-0" />
                <a href="mailto:info@xobriq.com" className="hover:text-[#3ca2fa] transition-colors">
                  info@xobriq.com
                </a>
              </div>
            </div>

          </div>

          {/* Link columns — 2-up sub-grid on mobile, below the brand block.
              lg:contents drops this wrapper's own box at desktop width, so
              its 4 children become direct items of the outer 5-col grid
              above (columns 2-5, beside the brand column) instead of being
              trapped inside a nested single grid cell — that's what puts
              them back side-by-side with the brand block on desktop rather
              than always stacking below it. */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:contents">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h4 className="text-slate-900 dark:text-white text-lg font-semibold mb-6">
                  {group.title}
                </h4>
                <ul className="space-y-3 text-sm">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-slate-600 hover:text-[#3ca2fa] transition-colors dark:text-slate-300"
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

        {/* Footer bottom — social icons (left) and copyright/status (right)
            on one full-width row. Socials used to be nested inside the
            narrow Brand column, which was too tight for the copyright line
            to share without wrapping onto several lines — this row isn't
            confined to that column's width, so both sit on one line.
            No separator either side of it any more. */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400 lg:flex-row text-xs">
          <div className="flex items-center gap-5">
            {socials.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-slate-500 hover:text-[#3ca2fa] transition-colors dark:text-slate-400"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <p className="text-center">
              &copy; {new Date().getFullYear()} Xobriq Technologies Limited.{" "}
              <span className="text-teal-600 dark:text-teal-400 font-semibold tracking-wide">Data. AI. Clarity.</span>
            </p>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>
                Made in Nairobi <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-slate-500">ke</span>
              </span>
            </div>
          </div>
        </div>

        {/* Big "XOBRIQ" text watermark — now themed itself (see
            hover-footer.tsx), so it shows in both modes again. */}
        <div className="hidden lg:flex h-[22rem] mt-4 sm:mt-2 -mb-16 sm:-mb-24 relative z-10">
          <TextHoverEffect text="XOBRIQ" className="z-10" />
        </div>
      </div>
    </footer>
  );
}
