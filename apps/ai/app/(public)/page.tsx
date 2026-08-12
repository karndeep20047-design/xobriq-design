import { HeroParticleScan } from "@/components/ai/HeroParticleScan";
import { MetricsBand } from "@/components/ai/MetricsBand";
import { PillarGrid } from "@/components/ai/PillarGrid";
import { CustomerJourney } from "@/components/ai/CustomerJourney";
import { ROICalculator } from "@/components/ai/ROICalculator";
import { TrustBar } from "@/components/ai/TrustBar";
import { CaseStudiesPreview } from "@/components/ai/CaseStudiesPreview";
import { SegmentedCTAGrid } from "@/components/ai/SegmentedCTAGrid";
import { HomeCTA } from "@/components/ai/HomeCTA";

export default function HomePage() {
  return (
    <>
      <HeroParticleScan />
      <MetricsBand />
      <PillarGrid />
      <CustomerJourney />
      <ROICalculator />
      <TrustBar />
      <CaseStudiesPreview />
      <SegmentedCTAGrid />
      <HomeCTA />
    </>
  );
}