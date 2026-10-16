import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Filter, Plug, ShieldCheck } from "lucide-react";
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
import { LEAD_FEE_CAP_USD, PARTNER_FAQ, PRO_MONTHLY_USD } from "@/lib/plans";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "For movers — $100/month unlimited, or up to $7 per lead",
  description:
    "Join the Rotamove partner network. Unlimited leads for a flat monthly fee, or pay per lead with a hard $7 cap.",
};

const WHY = [
  { icon: Filter, title: "Your lanes only", body: "Filter by corridor, volume and date." },
  { icon: Clock3, title: "Ready to move", body: "Route, dates and volume already answered." },
  { icon: ShieldCheck, title: "Verified contacts", body: "Validated at intake. Scored 0–100." },
  { icon: BarChart3, title: "Win-rate reporting", body: "See why you lost, by corridor." },
  { icon: Plug, title: "API & webhooks", body: "Leads land straight in your TMS." },
  { icon: ArrowRight, title: "No commission", body: "We never take a cut of the job." },
];

export default function PartnersPage() {
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
            <p className="eyebrow text-center">For moving companies</p>
            <h1 className="mx-auto mt-5 max-w-3xl text-center text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              Buy demand, not phone numbers.
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-center text-[17px] leading-relaxed text-muted-foreground">
              {formatNumber(NETWORK_STATS.monthlyLeads)} verified enquiries a month across{" "}
              {NETWORK_STATS.corridors} corridors. Two ways to buy them.
            </p>
          </Shell>
        </section>

        {/* plans ------------------------------------------------ */}
        <section className="pb-20">
          <Shell>
            <PricingPlans />
            <p className="mx-auto mt-6 max-w-2xl text-center text-[13.5px] leading-relaxed text-muted-foreground">
              Both plans include licence and insurance verification, dispute mediation, and
              removal from the board if standards slip.
            </p>
          </Shell>
        </section>

        {/* chooser ---------------------------------------------- */}
        <section className="py-20">
          <Shell>
            <h2 className="mx-auto max-w-xl text-center text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.04]">
              Which one fits you?
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
              Never more than ${LEAD_FEE_CAP_USD}. Whatever the job.
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
              {WHY.map((item) => (
                <div key={item.title} className="rounded-3xl border bg-card p-6">
                  <item.icon className="size-5" strokeWidth={2} />
                  <h3 className="mt-5 text-[17px]">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </Shell>
        </section>

        {/* faq -------------------------------------------------- */}
        <section id="faq" className="py-20">
          <Shell>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-center text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.04]">
                Partner FAQ
              </h2>
              <Accordion type="single" collapsible className="mt-12 w-full">
                {PARTNER_FAQ.map((item, i) => (
                  <AccordionItem key={item.q} value={`p-${i}`} className="border-b">
                    <AccordionTrigger className="py-5 text-left text-[17px] font-medium hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                      {item.a}
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
              <h2 className="text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.04]">
                Start free. Upgrade when it pays.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[16px] opacity-70">
                Verification takes about two working days.
              </p>
              <Link
                href="/partners/dashboard"
                className="group mt-9 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[15.5px] font-medium text-background transition-all duration-200 hover:opacity-90 active:scale-[0.985]"
              >
                Open the demo dashboard
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <p className="mt-6 text-[13px] opacity-60">
                ${PRO_MONTHLY_USD}/month unlimited · or ${LEAD_FEE_CAP_USD} max per lead
              </p>
            </div>
          </Shell>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
