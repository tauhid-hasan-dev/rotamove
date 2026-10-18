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
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { dirFor } from "@/i18n/config";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero dict={dict} rtl={dirFor(locale) === "rtl"} />
        <TrustStrip dict={dict} />
        <HowItWorks dict={dict} locale={locale} />
        <CoverageGrid />
        <Testimonials dict={dict} locale={locale} />
        <PartnerTeaser dict={dict} locale={locale} />
        <Faq dict={dict} />
        <CtaBand dict={dict} />
      </main>
      <SiteFooter />
    </>
  );
}
