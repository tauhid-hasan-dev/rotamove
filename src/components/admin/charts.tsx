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
import { useI18n } from "@/i18n/provider";
import type { LeadTrendPoint, RevenuePoint, SessionsPoint } from "@/lib/admin/metrics";
import type { AcquisitionChannel } from "@/lib/admin/types";
import { CHANNELS } from "@/lib/admin/types";

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

export function LeadsTrendChart({ data, className }: { data: LeadTrendPoint[]; className?: string }) {
  const { dict } = useI18n();
  // Enquiries only. The conversion series shared this axis without
  // sharing its scale, so a flat line near zero sat under the volume
  // curve and read as a reporting failure rather than a ratio.
  const leadsConfig = {
    leads: { label: dict.admin.charts.leads, color: CATEGORICAL.green },
  } satisfies ChartConfig;

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
      </AreaChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ *
 * Revenue — stacked bars: subscriptions vs lead fees.
 * ------------------------------------------------------------------ */

export function RevenueTrendChart({ data, className }: { data: RevenuePoint[]; className?: string }) {
  const { dict, t } = useI18n();
  // One series per plan. Pay-per-seen used to be folded into "lead fees",
  // which named it after the plan it is not.
  const revenueConfig = {
    subscriptions: { label: dict.admin.charts.subscriptions, color: CATEGORICAL.blue },
    leadFees: { label: dict.admin.charts.leadFees, color: CATEGORICAL.green },
    unlockFees: { label: dict.admin.charts.unlockFees, color: CATEGORICAL.ochre },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={revenueConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" {...X_AXIS} interval={tickInterval(data.length)} />
        {/* Wider than the old "$12k" needed: a compact euro carries the
            locale's own abbreviation, and "12 тыс. €" does not fit in 42. */}
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          fontSize={11}
          tickFormatter={(v: number) => t.eurCompact(v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="unlockFees"
          stackId="revenue"
          fill="var(--color-unlockFees)"
          stroke="var(--background)"
          strokeWidth={1}
        />
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

export function SessionsChart({ data, className }: { data: SessionsPoint[]; className?: string }) {
  const { dict, t } = useI18n();
  const sessionsConfig = Object.fromEntries(
    CHANNELS.map((channel) => [
      channel,
      { label: dict.admin.labels.channel[channel], color: CHANNEL_COLORS[channel] },
    ]),
  ) satisfies ChartConfig;

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
          tickFormatter={(v: number) => t.compact(v)}
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
  const { t } = useI18n();
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label}: ${t.number(s.value)}`).join(", ")}>
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
            <span className="tnum font-medium text-foreground">{t.number(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Ranked bars — a top-N list with proportional bars, plain divs.
 * ------------------------------------------------------------------ */

export function RankedBars({
  items,
  className,
}: {
  items: Array<{ key: string; label: string; value: number }>;
  className?: string;
}) {
  const { t } = useI18n();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return null;
  return (
    <ol className={className}>
      {items.map((item) => (
        <li key={item.key} className="py-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="tnum shrink-0 font-medium">{t.number(item.value)}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-brand-deep"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * Generic donut — same visual contract as ChannelDonut, any slice set.
 * ------------------------------------------------------------------ */

export interface MixSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function MixDonut({ data, className }: { data: MixSlice[]; className?: string }) {
  const config = Object.fromEntries(
    data.map((d) => [d.id, { label: d.label, color: d.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <PieChart margin={{ top: 4, bottom: 4 }}>
        <ChartTooltip content={<ChartTooltipContent nameKey="id" />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="id"
          innerRadius="55%"
          outerRadius="85%"
          stroke="var(--background)"
          strokeWidth={2}
          paddingAngle={1}
        >
          {data.map((d) => (
            <Cell key={d.id} fill={d.color} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="id" />} />
      </PieChart>
    </ChartContainer>
  );
}

/** Fixed, CVD-safe series colours for the three service levels. */
export const SERVICE_COLORS: Record<import("@/lib/types").ServiceLevel, string> = {
  full_service: CATEGORICAL.green,
  door_to_door: CATEGORICAL.blue,
  transport_only: CATEGORICAL.ochre,
};
