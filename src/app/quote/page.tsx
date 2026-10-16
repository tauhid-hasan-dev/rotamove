import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { CITY_BY_CODE } from "@/lib/geo";
import { estimateVolume } from "@/lib/pricing";
import type { LeadDraft, PropertySize } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tell us about your move",
  description:
    "Tell us about your move once. Verified movers get in touch on the channel you choose.",
};

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

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const params = await searchParams;
  const read = (key: string) => {
    const v = params[key];
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
