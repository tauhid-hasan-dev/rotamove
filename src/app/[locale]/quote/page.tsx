import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { CITY_BY_CODE } from "@/lib/geo";
import { estimateVolume } from "@/lib/pricing";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";
import type { LeadDraft, PropertySize } from "@/lib/types";

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
