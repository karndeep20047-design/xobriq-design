// ============================================================================
//  Xobriq.ai — Public Footer (Curtain Reveal Layout)
//  ---------------------------------------------------------------------------
//  - Interactive scroll reveal curtain effect via fixed positioning & relative wrapper spacer
//  - Fully styled with structured columns: Solutions, Products, Resources, Company
//  - Integrates contact details, social media icons, and compliance badges
//  - High-impact outline watermark brand text at the bottom
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
  { href: "/kyc", label: "Xobriq KYC" },
];

const solutionsLinks = [
  { href: "/kyc", label: "Financial Verification" },
  { href: "/agentic", label: "Enterprise AI Agents" },
  { href: "/cyber", label: "Managed Threat Defense" },
  { href: "/cloud", label: "Sovereign GPU Clusters" },
];

const resourceLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/developers", label: "API Reference" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/blog", label: "Engineering Blog" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/careers", label: "Careers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Console Login" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/sla", label: "SLA Commitments" },
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
    <footer className="relative w-full bg-slate-50 dark:bg-[#070708] border-t border-slate-200/80 dark:border-zinc-800/80 transition-colors duration-150">
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:pt-16 pb-8 flex flex-col justify-between">
        
        {/* Top Grid Area */}
        <div className="grid gap-8 lg:grid-cols-12 pb-6 lg:pb-12 border-b border-slate-200/80 dark:border-zinc-800/60">
          
          {/* Brand & CTA Block */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4 lg:space-y-6">
            <div>
              <Image
                src="/xobriq-logo-horizontal.png"
                alt="Xobriq Logo"
                width={140}
                height={36}
                className="h-9 w-auto dark:brightness-110"
              />
              <h3 className="mt-4 lg:mt-6 text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                Build autonomous enterprise AI & cyber defense agents that understand, reason, and act.
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-lg border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-500 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-zinc-200 transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:text-black transition-colors"
              >
                Sign Up Free
              </Link>
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500 dark:text-xgreen-400 shrink-0" />
                <span>GTC Tower, 24th Floor, Westlands, Nairobi</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-500 dark:text-xgreen-400 shrink-0" />
                <a href="mailto:info@xobriq.com" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  info@xobriq.com
                </a>
              </div>
            </div>
          </div>

            {/* Links Columns */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Solutions
                </h4>
                <ul className="mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 text-sm">
                  {solutionsLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Products
                </h4>
                <ul className="mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 text-sm">
                  {productLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Resources
                </h4>
                <ul className="mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 text-sm">
                  {resourceLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Company
                </h4>
                <ul className="mt-3 lg:mt-4 space-y-1.5 lg:space-y-2 text-sm">
                  {companyLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter & Badges Column */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-4 lg:space-y-6">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Weekly Newsletter
                </h4>
                <p className="mt-2 lg:mt-3 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                  Get a weekly roundup of the latest insights on enterprise AI, cybersecurity, and sovereign GPU compute.
                </p>
                
                <form onSubmit={(e) => e.preventDefault()} className="mt-3 lg:mt-4 flex gap-2">
                  <input
                    type="email"
                    placeholder="For example, &quot;jane@company.com&quot;"
                    className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:border-emerald-500 dark:focus:border-xgreen-500 focus:outline-none transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:text-black transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>

              {/* Socials & Compliance badging */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {socials.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white transition-all"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>

                {/* Compliance Trust badges */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded border border-slate-300 dark:border-zinc-800 bg-transparent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    SOC 2 TYPE II
                  </span>
                  <span className="inline-flex items-center justify-center rounded border border-slate-300 dark:border-zinc-800 bg-transparent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    ISO 27001
                  </span>
                  <span className="inline-flex items-center justify-center rounded border border-slate-300 dark:border-zinc-800 bg-transparent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                    GDPR COMPLIANT
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Huge Outline Watermark */}
          <div className="select-none font-display font-extrabold text-[12vw] leading-none text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-500/5 via-purple-500/5 to-blue-500/5 [-webkit-text-stroke:1px_rgba(20,184,166,0.14)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.05)] uppercase tracking-[0.15em] pt-4 lg:pt-6 pb-2">
            xobriq
          </div>

          {/* Bottom copyright & legal row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-zinc-800/40 text-xs text-slate-400 dark:text-zinc-500">
            <p>
              © {new Date().getFullYear()} Xobriq Technologies Limited. Made in Nairobi 🇰🇪
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {legalLinks.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-slate-800 dark:hover:text-zinc-300 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </footer>
  );
}
