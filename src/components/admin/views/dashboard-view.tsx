"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Building2, Route } from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { EmptyState, KpiCard, PageHeader, StatusBadge } from "@/components/admin/bits";
import {
  LeadsTrendChart,
  MixDonut,
  RankedBars,
  RevenueTrendChart,
  SERVICE_COLORS,
} from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  billingTotals,
  companyPerformance,
  computeKpis,
  leadTrend,
  leadsInRange,
  previousRange,
  revenueTrend,
  serviceMix,
  topLeadRoutes,
} from "@/lib/admin/metrics";
import { COMPANY_STATUS_META } from "@/lib/admin/labels";
import { getCity } from "@/lib/geo";
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
  const billing = useMemo(() => billingTotals(data, range), [data, range]);

  const routes = useMemo(
    () =>
      topLeadRoutes(rangeLeads).map((r) => ({
        key: `${r.fromCode}:${r.toCode}`,
        label: `${getCity(r.fromCode)?.name ?? r.fromCode} → ${getCity(r.toCode)?.name ?? r.toCode}`,
        value: r.count,
      })),
    [rangeLeads],
  );

  const services = useMemo(
    () =>
      serviceMix(rangeLeads).map((s) => ({
        id: s.service,
        label: dict.enums.serviceLevel[s.service].label,
        value: s.count,
        color: SERVICE_COLORS[s.service],
      })),
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={dx.kpiTotalLeads}
          value={t.number(kpis.totalLeads)}
          delta={delta(kpis.totalLeads, prev.totalLeads)}
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
        <KpiCard
          label={dict.admin.billing.kpiOverdue}
          value={t.usd(billing.overdueUsd)}
          hint={t.fill(dict.admin.billing.kpiOverdueHint, { n: t.number(billing.overdueCount) })}
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
            <CardTitle>{dict.admin.routesCard.title}</CardTitle>
            <CardDescription>{dict.admin.routesCard.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {routes.length === 0 ? (
              <EmptyState
                title={dict.admin.routesCard.empty}
                icon={<Route className="size-5" aria-hidden />}
                className="py-8"
              />
            ) : (
              <RankedBars items={routes} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{dict.admin.routesCard.serviceTitle}</CardTitle>
            <CardDescription>{dict.admin.routesCard.serviceDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <EmptyState
                title={dict.admin.routesCard.empty}
                icon={<Route className="size-5" aria-hidden />}
                className="py-8"
              />
            ) : (
              <MixDonut data={services} className="h-56 w-full" />
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
      </div>
    </div>
  );
}
