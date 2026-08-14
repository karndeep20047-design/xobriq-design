// ============================================================================
//  Xobriq.ai — Public Footer
//  ---------------------------------------------------------------------------
//  - Premium multi-column layout matched precisely to specifications
//  - Fully styled with structured columns: Products, Developers, Company, Legal
//  - Integrates contact details, social media icons, and dynamic status banner
// ============================================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { FaGithub, FaXTwitter, FaLinkedinIn, FaYoutube, FaFacebookF, FaInstagram } from "react-icons/fa6";

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
    <footer className="relative w-full bg-[#050E22] border-t border-blue-500/20 text-white transition-colors duration-150">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        
        {/* Top Grid Area */}
        <div className="grid gap-12 lg:grid-cols-12 pb-12 border-b border-blue-500/10">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-col items-start">
                <Image
                  src="/xobriq-logo-horizontal.png"
                  alt="Xobriq Logo"
                  width={140}
                  height={36}
                  className="h-9 w-auto brightness-110"
                />
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#EAB308] font-bold mt-1 pl-1">
                  Intelligence at scale
                </p>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-slate-300 max-w-sm">
                East Africa&apos;s enterprise AI cybersecurity company. Five integrated pillars — Agentic AI, Guard, Cloud, Consult and Cyber — built on sovereign DGX H200 infrastructure in Nairobi.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-500 shrink-0" />
                <span>GTC Tower, 24th Floor, Westlands, Nairobi</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-500 shrink-0" />
                <a href="mailto:info@xobriq.com" className="hover:text-yellow-400 transition-colors">
                  info@xobriq.com
                </a>
              </div>
            </div>

            {/* Socials Row */}
            <div className="flex flex-wrap gap-2.5">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-blue-500/20 bg-slate-950/40 text-slate-400 hover:bg-blue-950/60 hover:text-white transition-all"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Products
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Developers
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {developerLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {companyLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Legal
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom copyright & status row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Xobriq Technologies Limited.{" "}
            <span className="text-teal-400 font-semibold tracking-wide">Data. AI. Clarity.</span>
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
            <span className="text-slate-800">|</span>
            <span>
              Made in Nairobi <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">ke</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
