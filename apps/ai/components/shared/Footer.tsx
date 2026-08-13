// ============================================================================
//  Xobriq.ai — Public Footer (Professional Redesign)
//  ---------------------------------------------------------------------------
//  - Curtain reveal scroll animation on desktop viewports
//  - Inspired by LlamaIndex footer structure
//  - Multi-column Solutions, Products, Resources, and Company links
//  - Clean newsletter sign-up container & socials
//  - Compliance badges (SOC 2, GDPR, HIPAA)
//  - Large translucent outline "XOBRIQ" bottom branding
//  - Light & dark mode compatible
// ============================================================================

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, ArrowRight } from "lucide-react";
import { FaGithub, FaXTwitter, FaLinkedinIn, FaYoutube, FaFacebookF, FaInstagram } from "react-icons/fa6";

const columns = [
  {
    title: "Solutions",
    links: [
      { href: "/kyc", label: "Financial Verification" },
      { href: "/guard", label: "Fraud Detection" },
      { href: "/cloud", label: "Compute Allocation" },
      { href: "/cyber", label: "Threat Intelligence" },
      { href: "/cyber", label: "Incident Response" },
      { href: "/cyber", label: "Managed SIEM" },
      { href: "/consult", label: "Compliance & Auditing" },
    ],
  },
  {
    title: "Products",
    links: [
      { href: "/kyc", label: "Xobriq KYC" },
      { href: "/guard", label: "Xobriq Guard" },
      { href: "/agentic", label: "Agentic AI" },
      { href: "/cloud", label: "Xobriq Cloud" },
      { href: "/consult", label: "Xobriq Consult" },
      { href: "/cyber", label: "Xobriq Cyber" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/case-studies", label: "Case Studies" },
      { href: "/benchmarks", label: "Benchmarks" },
      { href: "/blog", label: "Engineering Blog" },
      { href: "/developers", label: "Developer SDKs" },
      { href: "/status", label: "System Status" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/brand", label: "Brand Kit" },
      { href: "/contact", label: "Contact Support" },
    ],
  },
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
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Calculate the height of the footer
        setFooterHeight(entry.contentRect.height);
      }
    });

    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Spacer that pushes the scroll flow to allow the fixed footer reveal underneath */}
      <div
        style={{ height: `${footerHeight}px` }}
        className="pointer-events-none w-full hidden md:block"
      />

      <footer
        ref={footerRef}
        className="w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#070708] md:fixed md:bottom-0 md:left-0 md:right-0 md:z-0"
      >
        <div className="mx-auto max-w-7xl px-6 py-14">
          
          {/* Main Footer Content */}
          <div className="grid gap-12 lg:grid-cols-[1.5fr_3fr_1.5fr]">
            
            {/* Left Column: CTA + AI Summary */}
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="font-display text-2xl font-semibold leading-snug tracking-tight text-slate-900 dark:text-zinc-100 max-w-sm">
                  Build enterprise AI platforms that protect, reason, and scale.
                </h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-zinc-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    Contact Sales
                  </a>
                  <a
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-slate-950 dark:bg-zinc-100 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-zinc-200"
                  >
                    Sign Up
                  </a>
                </div>
              </div>

              {/* AI Summary Provider Badges */}
              <div className="mt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  Explore AI Summary
                </p>
                <div className="mt-3.5 flex items-center gap-4">
                  {/* OpenAI */}
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[1.5] text-slate-400 dark:text-zinc-500 hover:text-emerald-500 transition-colors cursor-pointer" title="OpenAI">
                    <path d="M12 3a9 9 0 0 1 9 9v1a5 5 0 0 1-5 5h-1a3 3 0 0 1-3-3v-1M12 21a9 9 0 0 1-9-9v-1a5 5 0 0 1 5-5h1a3 3 0 0 1 3 3v1" />
                  </svg>
                  {/* Google Gemini */}
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current text-slate-400 dark:text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer" title="Google Gemini">
                    <path d="M12 2c-.1 2.3-1.7 3.9-4 4 2.3.1 3.9 1.7 4 4 .1-2.3 1.7-3.9 4-4-2.3-.1-3.9-1.7-4-4zm0 11c-.1 1.7-1.3 2.9-3 3 1.7.1 2.9 1.3 3 3 .1-1.7 1.3-2.9 3-3-1.7-.1-2.9-1.3-3-3z"/>
                  </svg>
                  {/* Meta */}
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-slate-400 dark:text-zinc-500 hover:text-indigo-400 transition-colors cursor-pointer" title="Meta LLaMA">
                    <path d="M7 16c-2.2 0-4-1.8-4-4s1.8-4 4-4c1.9 0 3.2 1.3 4.2 2.6L12.8 12c1 1.3 2.3 2.6 4.2 2.6 2.2 0 4-1.8 4-4s-1.8-4-4-4c-1.9 0-3.2 1.3-4.2 2.6L11.2 12C10.2 10.7 8.9 9.4 7 9.4" />
                  </svg>
                  {/* Anthropic */}
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-slate-400 dark:text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer" title="Anthropic Claude">
                    <path d="M12 22V12M12 12c-2 0-4-1.5-4-3.5S9.5 5 12 5M12 12c2 0 4-1.5 4-3.5S14.5 5 12 5M12 5V2" />
                  </svg>
                  {/* Hugging Face */}
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-slate-400 dark:text-zinc-500 hover:text-yellow-500 transition-colors cursor-pointer" title="Hugging Face">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Middle Columns: Links Grid */}
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:px-6">
              {columns.map((col) => (
                <div key={col.title}>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                    {col.title}
                  </h4>
                  <ul className="mt-5 grid gap-3 text-xs">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right Column: Newsletter & Socials & Compliance */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  Weekly Newsletter
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  Get a weekly roundup of key enterprise security and AI infrastructure updates.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="relative flex items-center rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-1 pl-3 shadow-sm focus-within:border-slate-400 dark:focus-within:border-zinc-700">
                    <input
                      type="email"
                      placeholder="jane@company.com"
                      className="bg-transparent w-full text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none pr-24"
                    />
                    <button className="absolute right-1 top-1 bottom-1 bg-slate-950 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3.5 rounded-md transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              {/* Socials & Compliance Badges */}
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  {socials.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>

                {/* Compliance Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-500 bg-slate-100/50 dark:bg-zinc-900/40">
                    SOC 2 Type II
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-500 bg-slate-100/50 dark:bg-zinc-900/40">
                    GDPR
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-500 bg-slate-100/50 dark:bg-zinc-900/40">
                    HIPAA
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Large Translucent Branding Text Banner */}
          <div className="relative mt-12 overflow-hidden border-t border-slate-200/50 dark:border-zinc-800/40 pt-8 select-none">
            <h1 className="font-display text-[9vw] font-black uppercase tracking-widest text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-blue-500/20 leading-none [-webkit-text-stroke:1px_rgba(20,184,166,0.12)]">
              Xobriq
            </h1>
          </div>

          {/* Bottom Copyright & Terms Footer Bar */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200/50 dark:border-zinc-800/40 pt-6 text-[11px] text-slate-400 dark:text-zinc-500">
            <p>
              © {new Date().getFullYear()} Xobriq Technologies Limited.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="/privacy" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Privacy Notice</a>
              <span>•</span>
              <a href="/terms" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="/dpa" className="hover:text-slate-600 dark:hover:text-zinc-300 transition-colors">Data Processing Addendum</a>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
