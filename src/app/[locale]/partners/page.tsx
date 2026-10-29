import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Filter, Gift, Plug, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { PricingPlans } from "@/components/partners/pricing-plans";
import { PlanChooser } from "@/components/partners/roi-calculator";
import { LeadPriceExplainer } from "@/components/partners/lead-price-explainer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NETWORK_STATS } from "@/lib/geo";
import {
  AVG_LEAD_FEE_USD,
  LEAD_FEE_CAP_USD,
  PRO_MONTHLY_USD,
  SIGNUP_CREDIT_USD,
} from "@/lib/plans";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { fill, formatNumber, formatUsd } from "@/i18n/format";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partners">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.meta.partnersTitle,
    description: dict.meta.partnersDescription,
    alternates: {
      canonical: localePath(locale, "/partners"),
      languages: alternateLanguages("/partners"),
    },
  };
}

const WHY_ICONS = [Filter, Clock3, ShieldCheck, BarChart3, Plug, ArrowRight];

export default async function PartnersPage({ params }: PageProps<"/[locale]/partners">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const page = dict.partnersPage;

  const cap = formatUsd(locale, LEAD_FEE_CAP_USD);
  const pro = formatUsd(locale, PRO_MONTHLY_USD);
  const credit = formatUsd(locale, SIGNUP_CREDIT_USD);
  const breakEven = formatNumber(locale, Math.ceil(PRO_MONTHLY_USD / AVG_LEAD_FEE_USD));

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* hero ------------------------------------------------- */}
        <section className="relative pb-16 pt-16 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand"
            aria-hidden
          />
          <Shell>
            <p className="eyebrow text-center">{page.eyebrow}</p>
            <h1 className="mx-auto mt-5 max-w-3xl text-center text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              {page.title}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-center text-[17px] leading-relaxed text-muted-foreground">
              {fill(page.lede, {
                leads: formatNumber(locale, NETWORK_STATS.monthlyLeads),
                corridors: formatNumber(locale, NETWORK_STATS.corridors),
              })}
            </p>
          </Shell>
        </section>

        {/* plans ------------------------------------------------ */}
        <section className="pb-20">
          <Shell>
            {/* The offer sits above the prices because it changes what they
                mean: the first {credit} of whichever plan you pick is on us,
                so the decision below is about fit rather than about spending
                anything today. Same width as the cards, and the same door as
                every button on them. */}
            <Link
              href={localePath(locale, "/partners/register")}
              className="group mx-auto mb-4 flex max-w-6xl flex-col items-center gap-x-5 gap-y-3 rounded-3xl border border-brand/40 bg-brand-soft px-6 py-5 text-center transition-colors hover:border-brand/70 sm:flex-row sm:text-start"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-ink">
                <Gift className="size-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16.5px] font-medium">
                  {fill(page.creditTitle, { credit })}
                </span>
                <span className="mt-0.5 block text-[14px] leading-relaxed text-muted-foreground">
                  {page.creditBody}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14.5px] font-medium text-ink transition-all duration-200 group-hover:brightness-[0.97]">
                {dict.plans.getStarted}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </span>
            </Link>

            <PricingPlans dict={dict} locale={locale} />
            <p className="mx-auto mt-6 max-w-2xl text-center text-[13.5px] leading-relaxed text-muted-foreground">
              {page.plansNote}
            </p>
          </Shell>
        </section>

        {/* chooser ---------------------------------------------- */}
        <section className="py-20">
          <Shell>
            <h2 className="mx-auto max-w-xl text-center text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.04]">
              {page.chooserTitle}
            </h2>
            <div className="mt-12">
              <PlanChooser />
            </div>
          </Shell>
        </section>

        {/* lead fee --------------------------------------------- */}
        <section className="py-20">
          <Shell>
            <h2 className="mx-auto max-w-xl text-center text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.04]">
              {fill(page.feeTitle, { cap })}
            </h2>
            <div className="mt-12">
              <LeadPriceExplainer />
            </div>
          </Shell>
        </section>

        {/* why -------------------------------------------------- */}
        <section className="py-20">
          <Shell>
            <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.whyItems.map((item, i) => {
                const Icon = WHY_ICONS[i] ?? Filter;
                return (
                  <div key={item.title} className="rounded-3xl border bg-card p-6">
                    <Icon className="size-5" strokeWidth={2} />
                    <h3 className="mt-5 text-[17px]">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </Shell>
        </section>

        {/* faq -------------------------------------------------- */}
        <section id="faq" className="py-20">
          <Shell>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-center text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.04]">
                {page.faqTitle}
              </h2>
              <Accordion type="single" collapsible className="mt-12 w-full">
                {dict.plans.faq.map((item, i) => (
                  <AccordionItem key={item.q} value={`p-${i}`} className="border-b">
                    <AccordionTrigger className="py-5 text-start text-[17px] font-medium hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                      {fill(item.a, { pro, cap, breakEven })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Shell>
        </section>

        {/* cta -------------------------------------------------- */}
        <section id="contact" className="pb-24 pt-8 sm:pb-32">
          <Shell>
            <div className="mx-auto max-w-4xl rounded-3xl bg-brand px-7 py-16 text-center text-ink sm:px-12">
              <h2 className="text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.04]">{page.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-md text-[16px] opacity-70">{page.ctaBody}</p>
              <Link
                href={localePath(locale, "/partners/dashboard")}
                className="group mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15.5px] font-medium text-background transition-all duration-200 hover:opacity-90 active:scale-[0.985]"
              >
                {page.ctaButton}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </Link>
              <p className="mt-6 text-[13px] opacity-60">{fill(page.ctaNote, { pro, cap })}</p>
            </div>
          </Shell>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
