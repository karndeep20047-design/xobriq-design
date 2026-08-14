// ============================================================================
//  Xobriq.ai — Public Footer (Hover Effect Layout)
//  ---------------------------------------------------------------------------
//  - Card-like floating footer container with rounded corners and gradient backdrop
//  - SVG text hover effect showcasing "XOBRIQ" dynamically on cursor proximity
//  - Structured 5-column grid mapping Products, Developers, Company, Legal, and Brand
// ============================================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { FaGithub, FaXTwitter, FaLinkedinIn, FaYoutube, FaFacebookF, FaInstagram } from "react-icons/fa6";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";

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
    <footer className="bg-[#050E22] relative h-fit overflow-hidden z-10">
      <div className="max-w-7xl mx-auto p-8 sm:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-8 lg:gap-12 pb-8">

          {/* Brand Column */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col items-start">
              <Image
                src="/xobriq-logo-horizontal.png"
                alt="Xobriq Logo"
                width={140}
                height={36}
                className="h-9 w-auto brightness-110"
              />
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#EAB308] font-bold mt-1 pl-0.5">
                Intelligence at scale
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              East Africa&apos;s enterprise AI cybersecurity company. Five integrated pillars — Agentic AI, Guard, Cloud, Consult and Cyber — built on sovereign DGX H200 infrastructure in Nairobi.
            </p>
            
            <div className="space-y-2 pt-2 text-xs text-slate-300">
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

          {/* Links Columns */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-[#3ca2fa] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Developers
            </h4>
            <ul className="space-y-3 text-sm">
              {developerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-[#3ca2fa] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-[#3ca2fa] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-[#3ca2fa] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>



        <hr className="border-t border-blue-500/10 my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0 text-slate-400">
          {/* Social icons */}
          <div className="flex space-x-6">
            {socials.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="hover:text-[#3ca2fa] transition-colors"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>

          {/* Copyright & Status */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
            <p className="text-center md:text-left">
              &copy; {new Date().getFullYear()} Xobriq Technologies Limited.{" "}
              <span className="text-teal-400 font-semibold tracking-wide">Data. AI. Clarity.</span>
            </p>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
              <span className="text-slate-700">|</span>
              <span>
                Made in Nairobi <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">ke</span>
              </span>
            </div>
          </div>
        </div>

        {/* Big "XOBRIQ" text watermark, closing the footer out at the very
            bottom below the columns and the social/copyright row — moved
            down from the top of the footer to match the reference layout
            (columns -> divider -> social/copyright -> big wordmark last).
            Full text, uncropped. */}
        <div className="lg:flex hidden h-[22rem] mt-4 relative z-10">
          <TextHoverEffect text="XOBRIQ" className="z-10" />
        </div>
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
