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
import { CHANNELS, LEAD_STATUSES } from "@/lib/admin/types";
import { useAdminData } from "@/lib/admin/store";
import { useI18n } from "@/i18n/provider";

function delta(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return (current - previous) / previous;
}

export function DashboardView() {
  const { dict, t } = useI18n();
  const dx = dict.admin.dashboard;
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
        label: dict.admin.labels.channel[channel],
        value: rangeLeads.filter((l) => l.source.channel === channel).length,
      })).filter((s) => s.value > 0),
    [rangeLeads, dict],
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
        title={dx.title}
        description={dx.description}
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
          label={dx.kpiTotalLeads}
          value={t.number(kpis.totalLeads)}
          delta={delta(kpis.totalLeads, prev.totalLeads)}
        />
        <KpiCard label={dx.kpiNew} value={t.number(kpis.newLeads)} hint={dx.kpiNewHint} />
        <KpiCard
          label={dx.kpiQualified}
          value={t.number(kpis.qualifiedLeads)}
          delta={delta(kpis.qualifiedLeads, prev.qualifiedLeads)}
        />
        <KpiCard
          label={dx.kpiConverted}
          value={t.number(kpis.convertedLeads)}
          delta={delta(kpis.convertedLeads, prev.convertedLeads)}
        />
        <KpiCard
          label={dx.kpiConversionRate}
          value={t.percent(kpis.conversionRate, 1)}
          delta={delta(kpis.conversionRate, prev.conversionRate)}
        />
        <KpiCard
          label={dx.kpiActiveCompanies}
          value={t.number(kpis.activeCompanies)}
          hint={dx.kpiActiveCompaniesHint}
        />
        <KpiCard
          label={dx.kpiRevenue}
          value={t.usd(kpis.revenueUsd)}
          delta={delta(kpis.revenueUsd, prev.revenueUsd)}
        />
        <KpiCard
          label={dx.kpiOutstanding}
          value={t.usd(kpis.outstandingUsd)}
          hint={dx.kpiOutstandingHint}
        />
      </div>

      {/* Trend charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{dx.leadFlowTitle}</CardTitle>
            <CardDescription>{dx.leadFlowDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsTrendChart data={trend} className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{dx.revenueTitle}</CardTitle>
            <CardDescription>{dx.revenueDescription}</CardDescription>
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
            <CardTitle>{dx.pipelineTitle}</CardTitle>
            <CardDescription>{dx.pipelineDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {rangeLeads.length === 0 ? (
              <EmptyState
                title={dx.pipelineEmptyTitle}
                description={dx.pipelineEmptyBody}
                icon={<Inbox className="size-5" aria-hidden />}
                className="py-8"
              />
            ) : (
              <>
                <DistributionBar
                  segments={LEAD_STATUSES.map((status) => ({
                    label: dict.admin.status.lead[status],
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
            <CardTitle>{dx.topCompaniesTitle}</CardTitle>
            <CardDescription>{dx.topCompaniesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {topCompanies.length === 0 ? (
              <EmptyState
                title={dx.topCompaniesEmptyTitle}
                description={dx.topCompaniesEmptyBody}
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
                      {t.fill(dx.leadsCount, { count: t.number(row.leadsReceived) })}
                      {row.feesUsd > 0
                        ? ` · ${t.fill(dx.inFees, { amount: t.usd(row.feesUsd) })}`
                        : ` · ${dx.proPlan}`}
                    </span>
                  </span>
                  <StatusBadge
                    meta={COMPANY_STATUS_META[row.company.status]}
                    label={dict.admin.status.company[row.company.status]}
                  />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{dx.activityTitle}</CardTitle>
            <CardDescription>{dx.activityDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex gap-3 text-[13px]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-deep" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate">{entry.detail}</span>
                    <span className="tnum text-xs text-muted-foreground">
                      {entry.actor} · {t.dateShort(entry.at)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <Button asChild variant="ghost" size="sm" className="mt-3 gap-1.5">
              <Link href="/admin/settings?tab=audit">
                {dx.fullAuditLog}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
