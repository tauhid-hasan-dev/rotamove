"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, KpiCard, PageHeader } from "@/components/admin/bits";
import { RevenueTrendChart } from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import { MoverLogo } from "@/components/common/mover-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsdPrecise } from "@/lib/format";
import type { RangePreset } from "@/lib/admin/date-range";
import {
  companyReport,
  reportRows,
  revenueTrend,
} from "@/lib/admin/metrics";
import { useAdminData } from "@/lib/admin/store";
import { useI18n } from "@/i18n/provider";

/**
 * Period tabs map to presets; the bucket size (day / week / month) follows
 * the span automatically, so "Daily" shows day rows and "Yearly" month rows.
 */
const PERIODS = [
  { id: "daily", preset: "30d" },
  { id: "weekly", preset: "90d" },
  { id: "monthly", preset: "all" },
  { id: "yearly", preset: "this_year" },
] as const satisfies ReadonlyArray<{ id: string; preset: Exclude<RangePreset, "custom"> }>;

export function ReportsView() {
  const { dict, t } = useI18n();
  const rx = dict.admin.reports;
  const data = useAdminData();
  const dateRange = useDateRange(data.anchorMs, "30d");
  const [period, setPeriod] = useState<string>("daily");

  const rows = useMemo(() => reportRows(data, dateRange.range), [data, dateRange.range]);
  const revenue = useMemo(() => revenueTrend(data, dateRange.range), [data, dateRange.range]);
  const byCompany = useMemo(() => companyReport(data, dateRange.range), [data, dateRange.range]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          leads: acc.leads + r.leads,
          assigned: acc.assigned + r.assigned,
          converted: acc.converted + r.converted,
          revenue: Math.round((acc.revenue + r.revenueUsd) * 100) / 100,
        }),
        { leads: 0, assigned: 0, converted: 0, revenue: 0 },
      ),
    [rows],
  );

  const selectPeriod = (id: string) => {
    setPeriod(id);
    const match = PERIODS.find((p) => p.id === id);
    if (match) dateRange.setPreset(match.preset);
  };

  const buildPeriodSheet = () => ({
    headers: [rx.colPeriod, rx.colLeads, rx.colRevenueUsd],
    rows: rows.map((r) => [r.label, r.leads, r.revenueUsd]),
  });

  const buildCompanySheet = () => ({
    headers: [
      rx.colCompany,
      rx.colPlan,
      rx.colLeadsReceived,
      rx.colLeadFeesUsd,
      rx.colSubscriptionsUsd,
      rx.colTotalUsd,
    ],
    rows: byCompany.map((r) => [
      r.company.mover.name,
      dict.admin.labels.plan[r.company.mover.plan],
      r.leadsReceived,
      r.leadFeesUsd,
      r.subscriptionUsd,
      r.totalUsd,
    ]),
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title={rx.title}
        description={t.fill(rx.description, {
          range: t.dateRange([dateRange.range.start, dateRange.range.end]),
        })}
        actions={
          <>
            <Tabs value={period} onValueChange={selectPeriod}>
              <TabsList>
                {PERIODS.map((p) => (
                  <TabsTrigger key={p.id} value={p.id}>
                    {rx.periods[p.id]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DateRangePicker
              value={dateRange}
              onPreset={(preset) => {
                setPeriod("");
                dateRange.setPreset(preset);
              }}
              onCustom={(range) => {
                setPeriod("");
                dateRange.setCustom(range);
              }}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label={rx.kpiLeads} value={t.number(totals.leads)} />
        <KpiCard label={rx.kpiRevenue} value={t.usd(totals.revenue)} hint={rx.kpiRevenueHint} />
      </div>

      <Card className="mt-4 shadow-soft">
        <CardHeader>
          <CardTitle>{rx.revenueTrendTitle}</CardTitle>
          <CardDescription>{rx.revenueTrendDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={revenue} className="h-64 w-full" />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex-row items-start justify-between pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>{rx.byPeriodTitle}</CardTitle>
              <CardDescription>{rx.byPeriodDescription}</CardDescription>
            </div>
            <ExportMenu
              basename={`rotamove-report-${dateRange.range.end}`}
              buildSheet={buildPeriodSheet}
            />
          </CardHeader>
          <div className="max-h-[460px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>{rx.colPeriod}</TableHead>
                  <TableHead className="text-end">{rx.colLeads}</TableHead>
                  <TableHead className="text-end">{rx.colRevenue}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="whitespace-nowrap text-[13px]">{r.label}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">{r.leads}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {formatUsdPrecise(r.revenueUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length === 0 ? (
              <EmptyState title={rx.emptyPeriods} className="m-4" />
            ) : null}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex-row items-start justify-between pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>{rx.byCompanyTitle}</CardTitle>
              <CardDescription>{rx.byCompanyDescription}</CardDescription>
            </div>
            <ExportMenu
              basename={`rotamove-company-report-${dateRange.range.end}`}
              buildSheet={buildCompanySheet}
            />
          </CardHeader>
          <div className="max-h-[460px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>{rx.colCompany}</TableHead>
                  <TableHead className="text-end">{rx.colLeads}</TableHead>
                  <TableHead className="text-end">{rx.colLeadFees}</TableHead>
                  <TableHead className="text-end">{rx.colSubscriptions}</TableHead>
                  <TableHead className="text-end">{rx.colTotal}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCompany.map((r) => (
                  <TableRow key={r.company.mover.id}>
                    <TableCell>
                      <Link
                        href={`/admin/companies/${r.company.mover.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <MoverLogo mover={r.company.mover} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium underline-offset-4 hover:underline">
                            {r.company.mover.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {dict.admin.labels.plan[r.company.mover.plan]}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px]">{r.leadsReceived}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {r.leadFeesUsd > 0 ? formatUsdPrecise(r.leadFeesUsd) : "—"}
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {r.subscriptionUsd > 0 ? formatUsdPrecise(r.subscriptionUsd) : "—"}
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px] font-semibold">
                      {formatUsdPrecise(r.totalUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {byCompany.length === 0 ? (
              <EmptyState title={rx.emptyCompanies} className="m-4" />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
