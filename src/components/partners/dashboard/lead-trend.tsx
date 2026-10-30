"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PANEL } from "@/components/partners/dashboard/surface";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
 * Built to match the admin console's own leads chart: a monotone area on the
 * brand green with the same gradient under it, the same recessive dashed
 * grid, the same legend. Two charts of the same measurement in one product
 * should not disagree about what that measurement looks like, and the admin
 * one is the elder — so this followed it rather than the other way round.
 *
 * What it adds is the grain switch, because a partner looking at their own
 * account wants a different window than an operator looking at the platform.
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
        {/* Wider side margins than the admin chart uses. An area puts its
            first and last point hard against the plot edges, and an axis
            label is centred on its tick — so at the yearly grain half of
            "2026" fell outside the SVG. Half a label is the margin. */}
        <AreaChart data={data} margin={{ left: 12, right: 18, top: 8 }}>
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
          <ChartLegend content={<ChartLegendContent />} />
          <defs>
            {/* Its own gradient id, not the admin chart's. Two <defs> with
                one id in a document is a coin toss over which fill wins,
                and these two live on different pages only by convention. */}
            <linearGradient id="partnerLeadsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-leads)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-leads)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <Area
            dataKey="leads"
            type="monotone"
            stroke="var(--color-leads)"
            strokeWidth={2}
            fill="url(#partnerLeadsFill)"
          />
        </AreaChart>
      </ChartContainer>
    </section>
  );
}
