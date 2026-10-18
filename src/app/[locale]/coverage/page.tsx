import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell, SectionHeading } from "@/components/common/section";
import { CoverageGrid } from "@/components/marketing/coverage-grid";
import { MODE_ICONS } from "@/components/common/route-line";
import { Button } from "@/components/ui/button";
import { CORRIDORS, NETWORK_STATS } from "@/lib/geo";
import { MOVERS } from "@/lib/movers";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { corridorLabel, regionName } from "@/i18n/geo-labels";
import { fill, formatDays, formatNumber } from "@/i18n/format";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/coverage">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.meta.coverageTitle,
    description: dict.meta.coverageDescription,
    alternates: {
      canonical: localePath(locale, "/coverage"),
      languages: alternateLanguages("/coverage"),
    },
  };
}

export default async function CoveragePage({ params }: PageProps<"/[locale]/coverage">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const lanes = [...CORRIDORS].sort((a, b) => b.monthlyLeads - a.monthlyLeads);

  const stats: Array<[string, string]> = [
    [formatNumber(locale, NETWORK_STATS.countries), dict.coveragePage.statCountries],
    [formatNumber(locale, NETWORK_STATS.cities), dict.coveragePage.statCities],
    [formatNumber(locale, NETWORK_STATS.corridors), dict.coveragePage.statCorridors],
    [formatNumber(locale, NETWORK_STATS.monthlyLeads), dict.coveragePage.statLeads],
  ];

  const headers = [
    dict.coveragePage.thCorridor,
    dict.coveragePage.thFrom,
    dict.coveragePage.thTo,
    dict.coveragePage.thTransit,
    dict.coveragePage.thModes,
    dict.coveragePage.thPartners,
    dict.coveragePage.thDemand,
  ];

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
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-px w-6 bg-brand" aria-hidden />
              {dict.coveragePage.eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              {dict.coveragePage.title}
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              {fill(dict.coveragePage.lede, {
                corridors: formatNumber(locale, NETWORK_STATS.corridors),
              })}
            </p>
            <dl className="mt-10 grid gap-x-8 gap-y-7 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={label}>
                  <dd className="text-[clamp(2rem,3.6vw,2.8rem)] font-semibold leading-none tracking-[-0.045em] tnum">
                    {value}
                  </dd>
                  <dt className="mt-2 text-[13.5px] text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          </Shell>
        </section>

        <CoverageGrid heading={false} />

        <section className="py-16 sm:py-20">
          <Shell>
            <SectionHeading
              eyebrow={dict.coveragePage.tableEyebrow}
              title={dict.coveragePage.tableTitle}
              lede={dict.coveragePage.tableLede}
            />

            <div className="mt-10 overflow-x-auto rounded-2xl border scrollbar-slim">
              <table className="w-full min-w-[760px] border-collapse text-start">
                <thead>
                  <tr className="border-b bg-surface">
                    {headers.map((h) => (
                      <th key={h} scope="col" className="eyebrow px-4 py-3 text-start font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lanes.map((lane) => {
                    const partners = MOVERS.filter(
                      (m) => m.regions.includes(lane.from) && m.regions.includes(lane.to),
                    ).length;
                    return (
                      <tr
                        key={lane.id}
                        id={lane.id}
                        className="border-b transition-colors last:border-0 hover:bg-surface/70"
                      >
                        <td className="px-4 py-3.5 text-[14px] font-medium">
                          {corridorLabel(dict, lane)}
                        </td>
                        <td className="px-4 py-3.5 text-[13.5px] text-muted-foreground">
                          {regionName(dict, lane.from)}
                        </td>
                        <td className="px-4 py-3.5 text-[13.5px] text-muted-foreground">
                          {regionName(dict, lane.to)}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] tnum">
                          {formatDays(locale, dict, lane.transitDays)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1">
                            {lane.modes.map((mode) => {
                              const Icon = MODE_ICONS[mode];
                              return (
                                <span
                                  key={mode}
                                  title={dict.enums.modes[mode].label}
                                  className="grid size-6 place-items-center rounded border bg-background"
                                >
                                  <Icon className="size-3 text-muted-foreground" />
                                </span>
                              );
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] tnum">
                          {formatNumber(locale, partners)}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-muted-foreground tnum">
                          {fill(dict.units.perMonth, {
                            n: formatNumber(locale, lane.monthlyLeads),
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed bg-surface/60 p-5">
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                {dict.coveragePage.notListed}
              </p>
              <Button asChild className="rounded-full">
                <Link href={localePath(locale, "/")}>
                  {dict.common.searchAnyRoute}
                  <ArrowRight className="size-4 rtl:-scale-x-100" />
                </Link>
              </Button>
            </div>
          </Shell>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
