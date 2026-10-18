import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Minus, Quote as QuoteIcon, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { MoverLogo } from "@/components/common/mover-logo";
import { MODE_ICONS } from "@/components/common/route-line";
import { Stars } from "@/components/common/stars";
import { Button } from "@/components/ui/button";
import { CORRIDORS, getCity } from "@/lib/geo";
import { MOVERS, getMoverBySlug } from "@/lib/movers";
import { LEAD_FEE_CAP_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { createRng } from "@/lib/rand";
import { LOCALES, quote as quoteMarks } from "@/i18n/config";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { corridorLabel, regionName } from "@/i18n/geo-labels";
import {
  cityLabel,
  fill,
  formatDays,
  formatNumber,
  formatPercent,
  formatResponseTime,
  formatUsd,
  formatVolume,
} from "@/i18n/format";
import { plural } from "@/i18n/plural";
import { localePath } from "@/i18n/paths";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Mover } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 28 partners × 8 locales, all prerendered. */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => MOVERS.map((m) => ({ locale, slug: m.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/movers/[slug]">): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const mover = getMoverBySlug(slug);
  if (!mover) return { title: dict.moverProfile.notFound };

  return {
    title: fill(dict.moverProfile.metaTitle, { name: mover.name }),
    // The partner's own description, as supplied.
    description: mover.blurb,
    alternates: {
      canonical: localePath(locale, `/movers/${slug}`),
      languages: Object.fromEntries(
        LOCALES.map((l) => [l, localePath(l, `/movers/${slug}`)]),
      ),
    },
  };
}

/** Review bodies are seed content; they stay in English like the blurbs. */
const REVIEW_BODIES = [
  "Crew arrived fifteen minutes early, wrapped everything properly and the delivery landed on the first day of the window. The final invoice matched the quote exactly.",
  "Good communication throughout — I had a named contact who answered on WhatsApp within minutes. One small scuff on a wardrobe door, sorted without argument.",
  "Customs paperwork was handled entirely by them, which was the whole reason I picked them. Nothing for me to sign at the border.",
  "Not the cheapest quote on the board but the delivery estimate was honest, which the cheaper one was not when I checked afterwards.",
  "Packed a full three-bedroom house in a day. They brought more materials than they needed, which I would rather have than the opposite.",
  "Second move with this company. Same standard, same crew lead. That consistency is worth paying for on a long corridor.",
];

const REVIEW_NAMES = [
  "Elif Y.", "Jonas R.", "Marta K.", "Deniz A.", "Sofia L.", "Rustam N.",
  "Hanna B.", "Kerem Ö.", "Ingrid S.", "Omar H.",
];

const SERVICE_KEYS = [
  "packing",
  "storage",
  "customs",
  "vehicle",
  "piano",
  "cleaning",
] as const satisfies ReadonlyArray<keyof Mover["services"]>;

function buildReviews(mover: Mover, dict: Dictionary, count = 5) {
  const rng = createRng("reviews", mover.id);
  const lanes = CORRIDORS.filter(
    (c) => mover.regions.includes(c.from) && mover.regions.includes(c.to),
  );
  return Array.from({ length: count }, (_, i) => {
    const lane = lanes.length ? lanes[i % lanes.length] : CORRIDORS[0];
    const rating = Math.min(
      5,
      Math.max(3, Math.round((mover.rating + rng.range(-0.6, 0.4)) * 2) / 2),
    );
    return {
      id: `${mover.id}-r${i}`,
      name: rng.pick(REVIEW_NAMES),
      body: rng.pick(REVIEW_BODIES),
      rating,
      lane: corridorLabel(dict, lane),
      volume: rng.int(14, 82),
      monthsAgo: rng.int(1, 16),
    };
  });
}

export default async function MoverPage({ params }: PageProps<"/[locale]/movers/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const profile = dict.moverProfile;

  const mover = getMoverBySlug(slug);
  if (!mover) notFound();

  const hq = getCity(mover.hqCity);
  const reviews = buildReviews(mover, dict);
  const lanes = CORRIDORS.filter(
    (c) => mover.regions.includes(c.from) && mover.regions.includes(c.to),
  );
  const isPro = mover.plan === "pro_unlimited";

  const stats: Array<[string, string]> = [
    [profile.statOnTime, formatPercent(locale, mover.onTimeRate)],
    [profile.statClaims, formatPercent(locale, mover.claimRate, 1)],
    [profile.statTrucks, formatNumber(locale, mover.fleetTrucks)],
    [profile.statCrew, formatNumber(locale, mover.crewSize)],
    [profile.statCover, profile.statCoverValue],
    [
      profile.statCancellation,
      plural(
        locale,
        dict.units.days,
        mover.freeCancellationDays,
        formatNumber(locale, mover.freeCancellationDays),
      ),
    ],
  ];

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="pb-20">
        {/* header ----------------------------------------------- */}
        <section className="relative overflow-hidden border-b">
          <div
            className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand"
            aria-hidden
          />
          <Shell className="py-10 sm:py-14">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
              <MoverLogo mover={mover} size="xl" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.05] tracking-[-0.04em]">
                    {mover.name}
                  </h1>
                  {isPro && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[11.5px] font-medium text-ink">
                      <Zap className="size-3" />
                      {profile.instantMatch}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  {mover.legalName} ·{" "}
                  {hq ? cityLabel(locale, hq, hq.country) : mover.hqCity} ·{" "}
                  {fill(profile.established, { year: formatNumber(locale, mover.since) })}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Stars rating={mover.rating} count={mover.reviewCount} />
                  <span className="text-[13.5px] text-muted-foreground">
                    {fill(profile.completedMoves, {
                      count: formatNumber(locale, mover.completedMoves),
                    })}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {mover.badges.map((badge) => (
                    <span
                      key={badge}
                      title={dict.enums.badges[badge].hint}
                      className="rounded-md border bg-background px-2 py-1 text-[11.5px] font-medium text-muted-foreground"
                    >
                      {dict.enums.badges[badge].label}
                    </span>
                  ))}
                  {mover.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11.5px] font-medium"
                    >
                      <BadgeCheck className="size-3 text-verify" />
                      {cert}
                    </span>
                  ))}
                </div>

                <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">
                  {mover.blurb}
                </p>
                {/* Partner-authored copy is shown as supplied rather than
                    machine-translated, and labelled so that is not mistaken
                    for a gap in the localisation. */}
                <p className="mt-2 text-[12px] text-muted-foreground/80">{profile.blurbNote}</p>
              </div>

              <div className="shrink-0 lg:w-[250px]">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="eyebrow">{isPro ? profile.instantMatch : profile.sameDay}</p>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {isPro ? profile.instantBody : profile.manualBody}
                  </p>
                  <Button asChild className="mt-4 w-full rounded-full">
                    <Link href={localePath(locale, "/")}>
                      {dict.common.startSearch}
                      <ArrowRight className="size-4 rtl:-scale-x-100" />
                    </Link>
                  </Button>
                  <p className="mt-3 text-center text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    {fill(profile.repliesIn, {
                      time: formatResponseTime(locale, dict, mover.responseMins),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Shell>
        </section>

        {/* stats ------------------------------------------------ */}
        <Shell className="py-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map(([label, value]) => (
              <div key={label} className="border-t pt-4">
                <dd className="text-[clamp(1.2rem,2.2vw,1.6rem)] font-medium leading-none tnum">
                  {value}
                </dd>
                <dt className="mt-2 text-[12.5px] text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </Shell>

        {/* detail ----------------------------------------------- */}
        <Shell className="grid gap-10 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="space-y-10">
            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">{profile.corridorsTitle}</h2>
              <ul className="mt-5 space-y-2.5">
                {lanes.map((lane) => (
                  <li
                    key={lane.id}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {corridorLabel(dict, lane)}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground tnum">
                        {fill(profile.corridorTypical, {
                          days: formatDays(locale, dict, lane.transitDays),
                        })}
                      </p>
                    </div>
                    <span className="flex shrink-0 gap-1">
                      {lane.modes
                        .filter((m) => mover.modes.includes(m))
                        .map((mode) => {
                          const Icon = MODE_ICONS[mode];
                          return (
                            <span
                              key={mode}
                              title={dict.enums.modes[mode].label}
                              className="grid size-7 place-items-center rounded-md border bg-background"
                            >
                              <Icon className="size-3.5 text-muted-foreground" />
                            </span>
                          );
                        })}
                    </span>
                  </li>
                ))}
                {lanes.length === 0 && (
                  <li className="rounded-xl border border-dashed p-5 text-[13.5px] text-muted-foreground">
                    {fill(profile.extendedNetwork, {
                      regions: mover.regions.map((r) => regionName(dict, r)).join(", "),
                    })}
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">{profile.reviewsTitle}</h2>
              <ul className="mt-5 space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <QuoteIcon className="size-4 shrink-0 text-brand" />
                      <Stars rating={review.rating} compact />
                      <span className="text-[11.5px] text-muted-foreground tnum">
                        {review.lane} · {formatVolume(locale, dict, review.volume)} ·{" "}
                        {plural(
                          locale,
                          dict.units.monthsAgo,
                          review.monthsAgo,
                          formatNumber(locale, review.monthsAgo),
                        )}
                      </span>
                    </div>
                    <p className="mt-3 text-[14.5px] leading-relaxed">
                      {quoteMarks(locale, review.body)}
                    </p>
                    <p className="mt-3 text-[12.5px] font-medium text-muted-foreground">
                      {review.name} · {dict.common.verifiedBooking}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">{profile.servicesTitle}</h2>
              <ul className="mt-5 space-y-2">
                {SERVICE_KEYS.map((key) => {
                  const on = mover.services[key];
                  return (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-[14px]",
                        !on && "opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded-full",
                          on ? "bg-verify/15 text-verify" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {on ? (
                          <Check className="size-2.5" strokeWidth={3.5} />
                        ) : (
                          <Minus className="size-2.5" strokeWidth={3} />
                        )}
                      </span>
                      {profile.services[key]}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">{profile.languagesTitle}</h2>
              {/* Language names are endonyms in the seed data ("Türkçe"), which
                  is how a partner lists what their crew actually speaks. */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {mover.languages.map((lang) => (
                  <span key={lang} className="rounded-full border bg-card px-3 py-1.5 text-[13px]">
                    {lang}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mover.regions.map((region) => (
                  <span
                    key={region}
                    className="rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-[13px] text-foreground dark:bg-accent dark:text-foreground"
                  >
                    {regionName(dict, region)}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-dashed bg-surface/60 p-5">
              <h3 className="eyebrow">{profile.billingTitle}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {isPro
                  ? fill(profile.billingPro, {
                      name: mover.name,
                      pro: formatUsd(locale, PRO_MONTHLY_USD),
                    })
                  : fill(profile.billingPpl, {
                      name: mover.name,
                      cap: formatUsd(locale, LEAD_FEE_CAP_USD),
                    })}
              </p>
            </section>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
