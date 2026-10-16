import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell, SectionHeading } from "@/components/common/section";
import { CoverageGrid } from "@/components/marketing/coverage-grid";
import { MODE_META } from "@/components/common/route-line";
import { Button } from "@/components/ui/button";
import { CORRIDORS, NETWORK_STATS, REGIONS } from "@/lib/geo";
import { MOVERS } from "@/lib/movers";
import { formatDays, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Corridor coverage — 53 countries, 19 live lanes",
  description:
    "Every corridor Rotamove sells: Türkiye to and from Western and Southern Europe, the Balkans, Scandinavia, the CIS, Central Asia and the Middle East.",
};

export default function CoveragePage() {
  const lanes = [...CORRIDORS].sort((a, b) => b.monthlyLeads - a.monthlyLeads);

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
              Network
            </p>
            <h1 className="mt-6 max-w-3xl text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              Türkiye is the hinge between Europe, the Caucasus and the Gulf.
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              {NETWORK_STATS.corridors} corridors, run weekly by partners who actually drive them.
            </p>
            <dl className="mt-10 grid gap-x-8 gap-y-7 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [NETWORK_STATS.countries, "Countries"],
                [NETWORK_STATS.cities, "Hub cities"],
                [NETWORK_STATS.corridors, "Live corridors"],
                [formatNumber(NETWORK_STATS.monthlyLeads), "Enquiries / month"],
              ].map(([value, label]) => (
                <div key={label as string}>
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
              eyebrow="Every lane"
              title="The full corridor table."
              lede="Door-to-door medians, measured across completed moves."
            />

            <div className="mt-10 overflow-x-auto rounded-2xl border scrollbar-slim">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b bg-surface">
                    {["Corridor", "From", "To", "Transit", "Modes", "Partners", "Demand"].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="eyebrow px-4 py-3 font-normal"
                        >
                          {h}
                        </th>
                      ),
                    )}
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
                        <td className="px-4 py-3.5 text-[14px] font-medium">{lane.label}</td>
                        <td className="px-4 py-3.5 text-[13.5px] text-muted-foreground">
                          {REGIONS[lane.from].name}
                        </td>
                        <td className="px-4 py-3.5 text-[13.5px] text-muted-foreground">
                          {REGIONS[lane.to].name}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] tnum">
                          {formatDays(lane.transitDays)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1">
                            {lane.modes.map((mode) => {
                              const { Icon, label } = MODE_META[mode];
                              return (
                                <span
                                  key={mode}
                                  title={label}
                                  className="grid size-6 place-items-center rounded border bg-background"
                                >
                                  <Icon className="size-3 text-muted-foreground" />
                                </span>
                              );
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] tnum">{partners}</td>
                        <td className="px-4 py-3.5 text-[13px] text-muted-foreground tnum">
                          {formatNumber(lane.monthlyLeads)}/mo
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed bg-surface/60 p-5">
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
                Route not on the list? The extended network covers another 90-odd country pairs
                through partner handovers.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/">
                  Search any route
                  <ArrowRight className="size-4" />
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
