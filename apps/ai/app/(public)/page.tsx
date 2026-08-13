import { HeroParticleScan } from "@/components/ai/HeroParticleScan";
import { MetricsBand } from "@/components/ai/MetricsBand";
import { PillarGrid } from "@/components/ai/PillarGrid";
import { IndustriesStrip } from "@/components/ai/IndustriesStrip";
import { CustomerJourney } from "@/components/ai/CustomerJourney";
import { ROICalculator } from "@/components/ai/ROICalculator";
import { CaseStudiesPreview } from "@/components/ai/CaseStudiesPreview";
import { SegmentedCTAGrid } from "@/components/ai/SegmentedCTAGrid";
import { HomeCTA } from "@/components/ai/HomeCTA";

export default function HomePage() {
  return (
    <>
      <HeroParticleScan />
      <MetricsBand />
      <PillarGrid />
      <IndustriesStrip />
      <CustomerJourney />
      <ROICalculator />
      <CaseStudiesPreview />
      <SegmentedCTAGrid />
      <HomeCTA />
    </>
  );
}