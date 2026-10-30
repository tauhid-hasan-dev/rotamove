"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PANEL } from "@/components/partners/dashboard/surface";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CATEGORICAL } from "@/components/admin/charts";
import { aggregateDays, TREND_GRAINS, type PartnerDay, type TrendGrain } from "@/lib/partner-history";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Leads over time, at whichever grain the partner asks for.
 *
 * One series, so there is no legend: the heading names what the bars are, and
 * a single hue cannot encode an identity the reader has to decode. The exact
 * figure for a bucket comes from hovering it, and the line under the control
 * row states the total for the range — which is the number most partners
 * actually came for.
 *
 * Bars rather than an area, at every grain. The grain switch moves between
 * thirty buckets and four, and an area drawn through four points is a shape
 * with no data in three quarters of it. Bars read the same either way.
 *
 * The green is slot one of the admin palette, reused deliberately: it is the
 * set that was validated against both surfaces, and a partner-side chart
 * inventing its own green would be a second unvalidated palette.
 */
export function LeadTrendPanel({ days }: { days: PartnerDay[] }) {
  const { dict, t } = useI18n();
  const tx = dict.partnerDashboard.trend;
  const [grain, setGrain] = useState<TrendGrain>("month");

  const points = useMemo(() => aggregateDays(days, grain), [days, grain]);

  const data = useMemo(
    () =>
      points.map((point) => ({
        key: point.key,
        leads: point.leads,
        label:
          grain === "day"
            ? t.dateShort(point.start)
            : grain === "month"
              ? t.monthShort(point.start)
              : grain === "quarter"
                ? t.fill(tx.quarterLabel, {
                    q: t.number(point.quarter ?? 1),
                    year: t.year(Number(point.start.slice(0, 4))),
                  })
                : t.year(Number(point.start.slice(0, 4))),
      })),
    [points, grain, t, tx.quarterLabel],
  );

  const totals = useMemo(
    () =>
      points.reduce(
        (sum, point) => ({ leads: sum.leads + point.leads, opened: sum.opened + point.opened }),
        { leads: 0, opened: 0 },
      ),
    [points],
  );

  const config = {
    leads: { label: tx.seriesLeads, color: CATEGORICAL.green },
  } satisfies ChartConfig;

  const grainLabel: Record<TrendGrain, string> = {
    day: tx.grainDay,
    month: tx.grainMonth,
    quarter: tx.grainQuarter,
    year: tx.grainYear,
  };

  return (
    <section className={cn(PANEL, "mt-4 p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {tx.title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {totals.leads === 0
              ? tx.empty
              : t.fill(tx.summary, {
                  leads: t.number(totals.leads),
                  opened: t.number(totals.opened),
                })}
          </p>
        </div>

        {/* The filter row sits above the plot, not beside it: on a phone it
            wraps onto its own line and the chart keeps its full width. */}
        <div
          role="group"
          aria-label={tx.grainAria}
          className="flex shrink-0 flex-wrap gap-1 rounded-xl bg-muted p-1"
        >
          {TREND_GRAINS.map((id) => {
            const active = grain === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setGrain(id)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12.5px] transition-colors",
                  active
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {grainLabel[id]}
              </button>
            );
          })}
        </div>
      </div>

      <ChartContainer
        config={config}
        className="mt-5 h-64 w-full"
        role="img"
        aria-label={t.fill(tx.chartAria, {
          period: grainLabel[grain],
          leads: t.number(totals.leads),
        })}
      >
        <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            // Thin the labels so thirty days of dates do not overlap. Nine
            // is about what fits on a phone without rotating them.
            interval={Math.max(0, Math.ceil(data.length / 9) - 1)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={34}
            fontSize={11}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="leads"
            fill="var(--color-leads)"
            radius={[4, 4, 0, 0]}
            // A surface-coloured hairline between neighbours, so adjacent
            // bars stay countable at the daily grain.
            stroke="var(--background)"
            strokeWidth={1}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
