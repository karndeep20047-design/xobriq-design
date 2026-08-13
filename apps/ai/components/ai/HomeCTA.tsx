"use client";

import { CTASection } from "@/components/blocks/cta-with-rectangle";

export function HomeCTA() {
  return (
    <CTASection
      badge={{
        text: "Start Today"
      }}
      title="Ready to deploy sovereign intelligence?"
      description="Talk to our team about Guard integration, GPU reservations, agentic AI pilots, or a full AI maturity assessment."
      action={{
        text: "Get API Key",
        href: "/register",
        variant: "glow"
      }}
      withGlow={true}
    />
  );
}