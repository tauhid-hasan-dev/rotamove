import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { CITY_BY_CODE } from "@/lib/geo";
import { estimateVolume } from "@/lib/pricing";
import { daysBetween, todayLocalIso } from "@/lib/calendar";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";
import type { DateFlexibility, LeadDraft, PropertySize } from "@/lib/types";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/quote">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.meta.quoteTitle,
    description: dict.meta.quoteDescription,
    alternates: {
      canonical: localePath(locale, "/quote"),
      languages: alternateLanguages("/quote"),
    },
  };
}

/**
 * A date range from the home search becomes a move date plus a flexibility
 * band — the two fields the wizard and the matching engine already speak.
 * Wider window, looser band; the buckets mirror the ones the wizard offers.
 */
function flexibilityForSpan(span: number): DateFlexibility {
  if (span <= 0) return "exact";
  if (span <= 6) return "plus_minus_3";
  if (span <= 16) return "within_2_weeks";
  return "flexible";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const SIZES: PropertySize[] = [
  "few_items",
  "studio",
  "one_bed",
  "two_bed",
  "three_bed",
  "four_bed",
  "villa",
  "office",
];

export default async function QuotePage({ params, searchParams }: PageProps<"/[locale]/quote">) {
  await params;
  const query = await searchParams;
  const read = (key: string) => {
    const v = query[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const from = read("from")?.toUpperCase();
  const to = read("to")?.toUpperCase();
  const size = read("size") as PropertySize | undefined;

  const initial: Partial<LeadDraft> = {};
  if (from && CITY_BY_CODE.has(from)) {
    initial.origin = { cityCode: from, area: "", access: "lift", easyParking: true };
  }
  if (to && CITY_BY_CODE.has(to)) {
    initial.destination = { cityCode: to, area: "", access: "lift", easyParking: true };
  }
  if (size && SIZES.includes(size)) {
    initial.propertySize = size;
    initial.volumeM3 = estimateVolume(size);
  }

  // Dates are optional in the search bar, so everything here is conditional —
  // and a start date in the past is ignored rather than carried forward.
  const start = read("start");
  const end = read("end");
  if (start && ISO_DATE.test(start) && start >= todayLocalIso()) {
    initial.moveDate = start;
    if (end && ISO_DATE.test(end) && end >= start) {
      initial.flexibility = flexibilityForSpan(daysBetween(start, end));
    }
  }

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="relative pb-24 pt-10 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand"
          aria-hidden
        />
        <Shell>
          <QuoteWizard initial={initial} />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
