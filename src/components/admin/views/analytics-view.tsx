"use client";

import { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { EmptyState, KpiCard, PageHeader } from "@/components/admin/bits";
import { CHANNEL_COLORS, ChannelDonut, SessionsChart } from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompact, formatNumber, pct } from "@/lib/format";
import {
  campaignRows,
  channelTotals,
  countryRows,
  landingPageRows,
  sessionsTrend,
  trafficTotals,
  type NamedStatsRow,
} from "@/lib/admin/metrics";
import { useAdminData } from "@/lib/admin/store";
import { CHANNEL_LABELS } from "@/lib/admin/types";

function StatsTable({ rows, nameHeader }: { rows: NamedStatsRow[]; nameHeader: string }) {
  if (rows.length === 0) {
    return <EmptyState title="No traffic in this range" className="m-4" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameHeader}</TableHead>
          <TableHead className="text-end">Sessions</TableHead>
          <TableHead className="text-end">Leads</TableHead>
          <TableHead className="text-end">Conversion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="text-[13px] font-medium">{row.label}</TableCell>
            <TableCell className="tnum text-end text-[13px]">
              {formatNumber(row.sessions)}
            </TableCell>
            <TableCell className="tnum text-end text-[13px]">{row.leads}</TableCell>
            <TableCell className="tnum text-end text-[13px]">
              {pct(row.conversionRate, 1)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AnalyticsView() {
  const data = useAdminData();
  const dateRange = useDateRange(data.anchorMs, "30d");
  const { range } = dateRange;

  const totals = useMemo(() => trafficTotals(data.traffic, range), [data.traffic, range]);
  const trend = useMemo(() => sessionsTrend(data.traffic, range), [data.traffic, range]);
  const channels = useMemo(() => channelTotals(data.traffic, range), [data.traffic, range]);
  const campaigns = useMemo(() => campaignRows(data, range), [data, range]);
  const pages = useMemo(() => landingPageRows(data.traffic, range), [data.traffic, range]);
  const countries = useMemo(
    () => countryRows(data.traffic, range).slice(0, 10),
    [data.traffic, range],
  );

  const donutData = useMemo(
    () =>
      channels
        .filter((c) => c.leads > 0)
        .map((c) => ({ channel: c.channel, label: CHANNEL_LABELS[c.channel], value: c.leads })),
    [channels],
  );

  const buildChannelSheet = () => ({
    headers: ["Channel", "Sessions", "Visitors", "Leads", "Conversion rate"],
    rows: channels.map((c) => [
      CHANNEL_LABELS[c.channel],
      c.sessions,
      c.visitors,
      c.leads,
      Math.round(c.conversionRate * 1000) / 10 + "%",
    ]),
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Traffic analytics"
        description="Where visitors come from and how many become leads."
        actions={
          <>
            <DateRangePicker
              value={dateRange}
              onPreset={dateRange.setPreset}
              onCustom={dateRange.setCustom}
            />
            <ExportMenu
              basename={`rotamove-traffic-${range.end}`}
              buildSheet={buildChannelSheet}
            />
          </>
        }
      />

      <Alert className="mb-4">
        <FlaskConical aria-hidden />
        <AlertTitle>Simulated traffic</AlertTitle>
        <AlertDescription>
          No analytics provider is connected. Sessions are seeded demo data, generated so that
          lead counts here reconcile exactly with the Leads table for the same period.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Sessions" value={formatCompact(totals.sessions)} />
        <KpiCard label="Unique visitors" value={formatCompact(totals.visitors)} />
        <KpiCard
          label="Leads"
          value={formatNumber(totals.leads)}
          hint="same count as the Leads table"
        />
        <KpiCard
          label="Session → lead"
          value={pct(totals.conversionRate, 2)}
          hint="conversion across all channels"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="shadow-soft xl:col-span-2">
          <CardHeader>
            <CardTitle>Sessions by channel</CardTitle>
            <CardDescription>Acquisition mix over the period.</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionsChart data={trend} className="h-72 w-full" />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Lead share</CardTitle>
            <CardDescription>Leads attributed per channel.</CardDescription>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <EmptyState title="No leads in this range" className="py-8" />
            ) : (
              <ChannelDonut data={donutData} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 gap-0 overflow-hidden py-0 shadow-soft">
        <CardHeader className="pt-6 pb-4">
          <CardTitle>Channels</CardTitle>
          <CardDescription>Sessions, visitors and conversion per acquisition channel.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-end">Sessions</TableHead>
                <TableHead className="text-end">Visitors</TableHead>
                <TableHead className="text-end">Leads</TableHead>
                <TableHead className="text-end">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((c) => (
                <TableRow key={c.channel}>
                  <TableCell>
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: CHANNEL_COLORS[c.channel] }}
                        aria-hidden
                      />
                      {CHANNEL_LABELS[c.channel]}
                    </span>
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {formatNumber(c.sessions)}
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {formatNumber(c.visitors)}
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">{c.leads}</TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {pct(c.conversionRate, 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Paid search and social.</CardDescription>
          </CardHeader>
          <StatsTable rows={campaigns} nameHeader="Campaign" />
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>Landing pages</CardTitle>
            <CardDescription>First page of the session.</CardDescription>
          </CardHeader>
          <StatsTable rows={pages} nameHeader="Page" />
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="pt-6 pb-4">
            <CardTitle>Top countries</CardTitle>
            <CardDescription>Visitor geography.</CardDescription>
          </CardHeader>
          <StatsTable rows={countries} nameHeader="Country" />
        </Card>
      </div>
    </div>
  );
}
