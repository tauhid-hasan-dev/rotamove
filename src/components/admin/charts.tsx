"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompact } from "@/lib/format";
import type { LeadTrendPoint, RevenuePoint, SessionsPoint } from "@/lib/admin/metrics";
import type { AcquisitionChannel } from "@/lib/admin/types";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/admin/types";

/* ======================================================================== *
 *  Admin charts.
 *
 *  Series colours are a CVD-validated categorical set anchored on the brand
 *  green (checked with the palette validator against both the light and the
 *  dark surface): green, blue, ochre, purple, rust — assigned in fixed
 *  order, never cycled. Identity never rides on colour alone: every multi-
 *  series chart carries a legend and every page pairs its chart with a
 *  table of the same numbers.
 * ======================================================================== */

export const CATEGORICAL = {
  green: "#5f9a3e",
  blue: "#5570c4",
  ochre: "#b0781f",
  purple: "#9a5fc0",
  rust: "#c4504e",
} as const;

export const CHANNEL_COLORS: Record<AcquisitionChannel, string> = {
  organic: CATEGORICAL.green,
  paid_search: CATEGORICAL.blue,
  referral: CATEGORICAL.ochre,
  direct: CATEGORICAL.purple,
  social: CATEGORICAL.rust,
};

const GRID = { vertical: false, strokeDasharray: "3 3" } as const;
const X_AXIS = { tickLine: false, axisLine: false, tickMargin: 8, fontSize: 11 } as const;

/** Thin the x labels so long ranges stay legible. */
function tickInterval(count: number): number {
  return Math.max(0, Math.ceil(count / 9) - 1);
}

/* ------------------------------------------------------------------ *
 * Leads over time — area for volume, line for conversions.
 * ------------------------------------------------------------------ */

const leadsConfig = {
  leads: { label: "Leads", color: CATEGORICAL.green },
  converted: { label: "Converted", color: CATEGORICAL.blue },
} satisfies ChartConfig;

export function LeadsTrendChart({ data, className }: { data: LeadTrendPoint[]; className?: string }) {
  return (
    <ChartContainer config={leadsConfig} className={className}>
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...X_AXIS} interval={tickInterval(data.length)} />
        <YAxis tickLine={false} axisLine={false} width={30} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <defs>
          <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-leads)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-leads)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <Area
          dataKey="leads"
          type="monotone"
          stroke="var(--color-leads)"
          strokeWidth={2}
          fill="url(#leadsFill)"
        />
        <Area
          dataKey="converted"
          type="monotone"
          stroke="var(--color-converted)"
          strokeWidth={2}
          fill="transparent"
        />
      </AreaChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Revenue — stacked bars: subscriptions vs lead fees.
 * ------------------------------------------------------------------ */

const revenueConfig = {
  subscriptions: { label: "Subscriptions", color: CATEGORICAL.blue },
  leadFees: { label: "Lead fees", color: CATEGORICAL.green },
} satisfies ChartConfig;

export function RevenueTrendChart({ data, className }: { data: RevenuePoint[]; className?: string }) {
  return (
    <ChartContainer config={revenueConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...X_AXIS} interval={tickInterval(data.length)} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={42}
          fontSize={11}
          tickFormatter={(v: number) => `$${formatCompact(v)}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="leadFees"
          stackId="revenue"
          fill="var(--color-leadFees)"
          stroke="var(--background)"
          strokeWidth={1}
        />
        <Bar
          dataKey="subscriptions"
          stackId="revenue"
          fill="var(--color-subscriptions)"
          stroke="var(--background)"
          strokeWidth={1}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Sessions by channel — stacked bars, fixed channel order.
 * ------------------------------------------------------------------ */

const sessionsConfig = Object.fromEntries(
  CHANNELS.map((channel) => [
    channel,
    { label: CHANNEL_LABELS[channel], color: CHANNEL_COLORS[channel] },
  ]),
) satisfies ChartConfig;

export function SessionsChart({ data, className }: { data: SessionsPoint[]; className?: string }) {
  return (
    <ChartContainer config={sessionsConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...X_AXIS} interval={tickInterval(data.length)} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          fontSize={11}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {CHANNELS.map((channel, i) => (
          <Bar
            key={channel}
            dataKey={channel}
            stackId="sessions"
            fill={`var(--color-${channel})`}
            stroke="var(--background)"
            strokeWidth={1}
            radius={i === CHANNELS.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Lead share by channel — donut, 2px surface gaps between slices.
 * ------------------------------------------------------------------ */

export interface ChannelSlice {
  channel: AcquisitionChannel;
  label: string;
  value: number;
}

export function ChannelDonut({ data, className }: { data: ChannelSlice[]; className?: string }) {
  const config = Object.fromEntries(
    data.map((d) => [d.channel, { label: d.label, color: CHANNEL_COLORS[d.channel] }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <PieChart margin={{ top: 4, bottom: 4 }}>
        <ChartTooltip content={<ChartTooltipContent nameKey="channel" />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="channel"
          innerRadius="55%"
          outerRadius="85%"
          stroke="var(--background)"
          strokeWidth={2}
          paddingAngle={1}
        >
          {data.map((d) => (
            <Cell key={d.channel} fill={CHANNEL_COLORS[d.channel]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="channel" />} />
      </PieChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Status distribution — plain divs, no plot needed for one stacked bar.
 * ------------------------------------------------------------------ */

export function DistributionBar({
  segments,
  className,
}: {
  segments: Array<{ label: string; value: number; colorClassName: string }>;
  className?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.label}
              className={s.colorClassName}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`size-2 rounded-full ${s.colorClassName}`} aria-hidden />
            {s.label}
            <span className="tnum font-medium text-foreground">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
