import type { Metadata } from "next";
import {
  Building2,
  Clock3,
  Gauge,
  MessageCircle,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Star } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { CtaBand, Faq } from "@/components/marketing/sections";
import { NETWORK_PARTNER_CLAIM } from "@/lib/movers";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { fill, formatNumber, formatPercent } from "@/i18n/format";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.meta.howItWorksTitle,
    description: dict.meta.howItWorksDescription,
    alternates: {
      canonical: localePath(locale, "/how-it-works"),
      languages: alternateLanguages("/how-it-works"),
    },
  };
}

const STEP_ICONS = [Search, Clock3, MessageCircle];
const CHECK_ICONS = [ScrollText, ShieldCheck, Gauge, Building2];

/** Weights are the product's actual ranking model; only the names translate. */
const RANKING: Array<{ key: "routeFit" | "reviewScore" | "onTime" | "transit" | "response"; weight: number; icon: typeof Star }> = [
  { key: "routeFit", weight: 36, icon: ShieldCheck },
  { key: "reviewScore", weight: 24, icon: Star },
  { key: "onTime", weight: 16, icon: Gauge },
  { key: "transit", weight: 14, icon: Clock3 },
  { key: "response", weight: 10, icon: MessageCircle },
];

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const page = dict.howItWorksPage;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative pb-12 pt-16 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand"
            aria-hidden
          />
          <Shell>
            <h1 className="mx-auto max-w-3xl text-center text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              {page.title}
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-center text-[17px] leading-relaxed text-muted-foreground">
              {page.lede}
            </p>
          </Shell>
        </section>

        <section className="py-20">
          <Shell>
            <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
              {page.steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? Search;
                return (
                  <li key={step.title} className="rounded-3xl border bg-card p-7">
                    <span className="grid size-11 place-items-center rounded-full bg-brand text-ink">
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </span>
                    <p className="mt-6 text-[11.5px] font-medium tabular-nums text-muted-foreground">
                      {new Intl.NumberFormat(`${locale}-u-nu-latn`, {
                        minimumIntegerDigits: 2,
                      }).format(i + 1)}
                    </p>
                    <h2 className="mt-1 text-[21px]">{step.title}</h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Shell>
        </section>

        <section id="ranking" className="py-20">
          <Shell>
            <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
                  {page.rankingTitle}
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
                  {page.rankingBody}
                </p>
              </div>

              <ul className="space-y-2.5">
                {RANKING.map((item) => (
                  <li key={item.key} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" strokeWidth={2} />
                      <span className="text-[15px] font-medium">{page.ranking[item.key]}</span>
                      <span className="ms-auto text-[15px] font-medium tnum">
                        {formatPercent(locale, item.weight / 100)}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${(item.weight / 36) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Shell>
        </section>

        <section id="trust" className="py-20">
          <Shell>
            <h2 className="mx-auto max-w-2xl text-center text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
              {fill(page.checksTitle, { count: formatNumber(locale, NETWORK_PARTNER_CLAIM) })}
            </h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {page.checks.map((check, i) => {
                const Icon = CHECK_ICONS[i] ?? ShieldCheck;
                return (
                  <div key={check.title} className="rounded-3xl border bg-card p-6">
                    <Icon className="size-5" strokeWidth={2} />
                    <h3 className="mt-5 text-[17px]">{check.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                      {check.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </Shell>
        </section>

        <section id="about" className="py-20">
          <Shell>
            <div className="mx-auto max-w-2xl space-y-5 text-[16px] leading-relaxed text-muted-foreground">
              <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05] text-foreground">
                {page.aboutTitle}
              </h2>
              <p>{page.aboutBody1}</p>
              <p>{page.aboutBody2}</p>
              <p className="text-foreground">{dict.footer.offices}</p>
            </div>
          </Shell>
        </section>

        <Faq dict={dict} />
        <CtaBand dict={dict} />
      </main>
      <SiteFooter />
    </>
  );
}
