import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { QuoteWizard } from "@/components/quote/quote-wizard";
import { CITY_BY_CODE } from "@/lib/geo";
import { estimateVolume } from "@/lib/pricing";
import { todayLocalIso } from "@/lib/calendar";
import { flexibilityForSpan } from "@/lib/lead-dates";
import { daysBetween } from "@/lib/calendar";
import { laneRepository } from "@/lib/lane-store";
import { lastCallEndAt, LAST_CALL_HOURS, type LastCallHours } from "@/lib/lanes";
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The run a last-call request points at, or `null` if the offer has already
 * expired. The clock is read here rather than in the component body so the
 * render stays pure — an expired lane must not pre-fill a departure that
 * has been and gone.
 */
async function loadLiveLane(laneId: string | undefined) {
  if (!laneId) return null;
  const lane = await laneRepository.get(laneId);
  if (!lane?.lastCall) return null;
  return Date.parse(lastCallEndAt(lane.lastCall)) > Date.now() ? lane : null;
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
  "project",
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

  /**
   * Last call, if the shopper came from the board or picked it in the search
   * bar. The lane id (`lc`) is optional — searching "last call, 48 hours"
   * from the landing page has no specific run behind it — but when it *is*
   * present the declared departure wins over anything typed, because that is
   * the vehicle the request is actually for.
   */
  const lastCallParam = Number(read("lastcall"));
  const lastCallHours = (LAST_CALL_HOURS as readonly number[]).includes(lastCallParam)
    ? (lastCallParam as LastCallHours)
    : null;

  const liveLane = lastCallHours ? await loadLiveLane(read("lc")) : null;

  if (lastCallHours) {
    const departure = liveLane?.lastCall?.startAt.slice(0, 10) ?? todayLocalIso();
    initial.moveDate = departure;
    // The whole window is hours wide, so the collection date is the
    // departure day and there is no flexibility left to offer.
    initial.flexibility = "exact";
    // Last call is one specific vehicle: there is no "how many carriers"
    // decision to make, so the request goes to that carrier alone.
    initial.preferredMatches = 2;
    if (liveLane) {
      initial.origin = {
        cityCode: liveLane.fromCode,
        area: "",
        access: "lift",
        easyParking: true,
      };
      initial.destination = {
        cityCode: liveLane.toCode,
        area: "",
        access: "lift",
        easyParking: true,
      };
    }
  } else {
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
          <QuoteWizard
            initial={initial}
            lastCall={
              lastCallHours
                ? {
                    hours: lastCallHours,
                    endAt: liveLane?.lastCall ? lastCallEndAt(liveLane.lastCall) : null,
                  }
                : null
            }
          />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
