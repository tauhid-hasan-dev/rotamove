"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Inbox } from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { EmptyState, KpiCard, PageHeader, StatusBadge } from "@/components/admin/bits";
import {
  ChannelDonut,
  DistributionBar,
  LeadsTrendChart,
  RevenueTrendChart,
} from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateShort, formatNumber, formatUsd, pct } from "@/lib/format";
import {
  companyPerformance,
  computeKpis,
  leadTrend,
  leadsInRange,
  previousRange,
  revenueTrend,
  statusCounts,
} from "@/lib/admin/metrics";
import { COMPANY_STATUS_META, LEAD_STATUS_META } from "@/lib/admin/labels";
import { CHANNELS, CHANNEL_LABELS, LEAD_STATUSES } from "@/lib/admin/types";
import { useAdminData } from "@/lib/admin/store";

function delta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return (current - previous) / previous;
}

export function DashboardView() {
  const data = useAdminData();
  const dateRange = useDateRange(data.anchorMs, "30d");
  const { range } = dateRange;

  const kpis = useMemo(() => computeKpis(data, range), [data, range]);
  const prev = useMemo(() => computeKpis(data, previousRange(range)), [data, range]);
  const trend = useMemo(() => leadTrend(data.leads, range), [data.leads, range]);
  const revenue = useMemo(() => revenueTrend(data, range), [data, range]);

  const rangeLeads = useMemo(() => leadsInRange(data.leads, range), [data.leads, range]);
  const counts = useMemo(() => statusCounts(rangeLeads), [rangeLeads]);

  const channelSlices = useMemo(
    () =>
      CHANNELS.map((channel) => ({
        channel,
        label: CHANNEL_LABELS[channel],
        value: rangeLeads.filter((l) => l.source.channel === channel).length,
      })).filter((s) => s.value > 0),
    [rangeLeads],
  );

  const topCompanies = useMemo(
    () =>
      companyPerformance(data, range)
        .filter((row) => row.leadsReceived > 0)
        .sort((a, b) => b.leadsReceived - a.leadsReceived)
        .slice(0, 5),
    [data, range],
  );

  const activity = data.audit.slice(0, 8);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Dashboard"
        description="Marketplace health at a glance. Every figure follows the selected period."
        actions={
          <DateRangePicker
            value={dateRange}
            onPreset={dateRange.setPreset}
            onCustom={dateRange.setCustom}
          />
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total leads"
          value={formatNumber(kpis.totalLeads)}
          delta={delta(kpis.totalLeads, prev.totalLeads)}
        />
        <KpiCard label="New" value={formatNumber(kpis.newLeads)} hint="awaiting first contact" />
        <KpiCard
          label="Qualified"
          value={formatNumber(kpis.qualifiedLeads)}
          delta={delta(kpis.qualifiedLeads, prev.qualifiedLeads)}
        />
        <KpiCard
          label="Converted"
          value={formatNumber(kpis.convertedLeads)}
          delta={delta(kpis.convertedLeads, prev.convertedLeads)}
        />
        <KpiCard
          label="Conversion rate"
          value={pct(kpis.conversionRate, 1)}
          delta={delta(kpis.conversionRate, prev.conversionRate)}
        />
        <KpiCard
          label="Active companies"
          value={formatNumber(kpis.activeCompanies)}
          hint="of the partner network"
        />
        <KpiCard
          label="Revenue"
          value={formatUsd(kpis.revenueUsd)}
          delta={delta(kpis.revenueUsd, prev.revenueUsd)}
        />
        <KpiCard
          label="Outstanding"
          value={formatUsd(kpis.outstandingUsd)}
          hint="open + overdue invoices"
        />
      </div>

      {/* Trend charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Lead flow</CardTitle>
            <CardDescription>Enquiries created per period, with conversions.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTrendChart data={trend} className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Cash collected: Pro subscriptions and lead fees.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart data={revenue} className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Breakdown row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Status of leads created in the period.</CardDescription>
          </CardHeader>
          <CardContent>
            {rangeLeads.length === 0 ? (
              <EmptyState
                title="No leads in this period"
                description="Pick a wider date range to see the pipeline."
                icon={<Inbox className="size-5" aria-hidden />}
                className="py-8"
              />
            ) : (
              <>
                <DistributionBar
                  segments={LEAD_STATUSES.map((status) => ({
                    label: LEAD_STATUS_META[status].label,
                    value: counts[status],
                    colorClassName: LEAD_STATUS_META[status].dotClassName,
                  }))}
                />
                <div className="mt-5 border-t pt-4">
                  <ChannelDonut data={channelSlices} className="h-48 w-full" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Top companies</CardTitle>
            <CardDescription>Most leads received in the period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {topCompanies.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description="Leads assigned in this period will rank companies here."
                icon={<Building2 className="size-5" aria-hidden />}
                className="py-8"
              />
            ) : (
              topCompanies.map((row) => (
                <Link
                  key={row.company.mover.id}
                  href={`/admin/companies/${row.company.mover.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                >
                  <MoverLogo mover={row.company.mover} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">
                      {row.company.mover.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatNumber(row.leadsReceived)} leads
                      {row.feesUsd > 0 ? ` · ${formatUsd(row.feesUsd)} in fees` : " · Pro plan"}
                    </span>
                  </span>
                  <StatusBadge meta={COMPANY_STATUS_META[row.company.status]} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest entries from the audit log.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-deep" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate">{entry.detail}</span>
                    <span className="tnum text-xs text-muted-foreground">
                      {entry.actor} · {formatDateShort(entry.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <Button asChild variant="ghost" size="sm" className="mt-3 gap-1.5">
              <Link href="/admin/settings?tab=audit">
                Full audit log
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
