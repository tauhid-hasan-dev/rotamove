import type { Metadata } from "next";
import { AlarmClock } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { LastCallBoard } from "@/components/marketing/last-call-board";
import { toOffer } from "@/lib/last-call-offers";
import { laneRepository } from "@/lib/lane-store";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/last-call">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.lastCallPage.metaTitle,
    description: dict.lastCallPage.metaDescription,
    alternates: {
      canonical: localePath(locale, "/last-call"),
      languages: alternateLanguages("/last-call"),
    },
  };
}

/** Offers expire on the clock, so this page can never be cached. */
export const dynamic = "force-dynamic";

/**
 * Resolved outside the component body: the clock is read once per request
 * and threaded through as data, so the countdown the server renders is the
 * one the client hydrates with — and the render itself stays pure.
 */
async function loadOffers() {
  const now = Date.now();
  const lanes = await laneRepository.activeLastCall(now);
  return { now, offers: lanes.map(toOffer).filter((offer) => offer !== null) };
}

export default async function LastCallPage({ params }: PageProps<"/[locale]/last-call">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const lx = dict.lastCallPage;

  const { now, offers } = await loadOffers();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Shell className="pt-10 pb-20 sm:pt-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lastcall px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.14em] text-lastcall-foreground">
              <AlarmClock className="last-call-ring size-3.5 motion-reduce:animate-none" />
              {lx.eyebrow}
            </span>
            <h1 className="mt-5 text-[clamp(2rem,4.5vw,3rem)] leading-[1.06] tracking-[-0.04em]">
              {lx.title}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">{lx.lede}</p>
          </div>

          <div className="mt-10">
            <LastCallBoard offers={offers} now={now} />
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
