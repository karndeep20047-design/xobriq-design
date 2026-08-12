"use client";

import { Marquee } from "./Marquee";

const partners = [
  "AFRI-BANK",
  "GOV.CONNECT",
  "FINTECH.X",
  "SAFE.INSURE",
  "MOBILE.MONEY",
];

export function TrustBar() {
  return (
    <section className="overflow-hidden bg-enterprise-bg-low/40 py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 sm:px-6">
        <p className="label-caps-thin text-enterprise-fg-subtle/60">
          Trusted by industry leaders across East Africa
        </p>
        <Marquee speed={26} className="mt-8 w-full opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0">
          {partners.map((p) => (
            <span key={p} className="text-xl font-bold tracking-wider text-enterprise-fg sm:text-2xl">
              {p}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}