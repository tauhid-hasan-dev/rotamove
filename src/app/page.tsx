import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/marketing/hero";
import { CoverageGrid } from "@/components/marketing/coverage-grid";
import {
  CtaBand,
  Faq,
  HowItWorks,
  PartnerTeaser,
  Testimonials,
  TrustStrip,
} from "@/components/marketing/sections";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <CoverageGrid />
        <Testimonials />
        <PartnerTeaser />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
