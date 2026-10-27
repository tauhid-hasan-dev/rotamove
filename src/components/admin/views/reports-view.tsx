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
import { formatNumber, formatUsd, formatUsdPrecise, pct } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/admin/labels";
import { formatRangeLabel, type RangePreset } from "@/lib/admin/date-range";
import {
  companyReport,
  reportRows,
  revenueTrend,
} from "@/lib/admin/metrics";
import { useAdminData } from "@/lib/admin/store";

/**
 * Period tabs map to presets; the bucket size (day / week / month) follows
 * the span automatically, so "Daily" shows day rows and "Yearly" month rows.
 */
const PERIODS = [
  { id: "daily", label: "Daily", preset: "30d" },
  { id: "weekly", label: "Weekly", preset: "90d" },
  { id: "monthly", label: "Monthly", preset: "all" },
  { id: "yearly", label: "Yearly", preset: "this_year" },
] as const satisfies ReadonlyArray<{ id: string; label: string; preset: Exclude<RangePreset, "custom"> }>;

export function ReportsView() {
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
    headers: ["Period", "Leads", "Assigned", "Converted", "Revenue USD"],
    rows: rows.map((r) => [r.label, r.leads, r.assigned, r.converted, r.revenueUsd]),
  });

  const buildCompanySheet = () => ({
    headers: ["Company", "Plan", "Leads received", "Lead fees USD", "Subscriptions USD", "Total USD"],
    rows: byCompany.map((r) => [
      r.company.mover.name,
      PLAN_LABELS[r.company.mover.plan],
      r.leadsReceived,
      r.leadFeesUsd,
      r.subscriptionUsd,
      r.totalUsd,
    ]),
  });

  return (
    <div className="animate-rise">
      <PageHeader
        title="Sales reports"
        description={`Lead volume and collected revenue for ${formatRangeLabel(dateRange.range)}.`}
        actions={
          <>
            <Tabs value={period} onValueChange={selectPeriod}>
              <TabsList>
                {PERIODS.map((p) => (
                  <TabsTrigger key={p.id} value={p.id}>
                    {p.label}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Leads" value={formatNumber(totals.leads)} />
        <KpiCard
          label="Assigned"
          value={formatNumber(totals.assigned)}
          hint={totals.leads > 0 ? `${pct(totals.assigned / totals.leads)} of leads` : undefined}
        />
        <KpiCard
          label="Converted"
          value={formatNumber(totals.converted)}
          hint={totals.leads > 0 ? `${pct(totals.converted / totals.leads, 1)} of leads` : undefined}
        />
        <KpiCard label="Revenue" value={formatUsd(totals.revenue)} hint="cash collected, net of refunds" />
      </div>

      <Card className="mt-4 shadow-soft">
        <CardHeader>
          <CardTitle>Revenue trend</CardTitle>
          <CardDescription>Pro subscriptions and pay-per-lead fees, as collected.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={revenue} className="h-64 w-full" />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex-row items-start justify-between pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>By period</CardTitle>
              <CardDescription>The chart above, row by row.</CardDescription>
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
                  <TableHead>Period</TableHead>
                  <TableHead className="text-end">Leads</TableHead>
                  <TableHead className="text-end">Assigned</TableHead>
                  <TableHead className="text-end">Converted</TableHead>
                  <TableHead className="text-end">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="whitespace-nowrap text-[13px]">{r.label}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">{r.leads}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">{r.assigned}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">{r.converted}</TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {formatUsdPrecise(r.revenueUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length === 0 ? (
              <EmptyState title="No data in this range" className="m-4" />
            ) : null}
          </div>
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex-row items-start justify-between pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>By company</CardTitle>
              <CardDescription>Who received leads and what they paid.</CardDescription>
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
                  <TableHead>Company</TableHead>
                  <TableHead className="text-end">Leads</TableHead>
                  <TableHead className="text-end">Lead fees</TableHead>
                  <TableHead className="text-end">Subscriptions</TableHead>
                  <TableHead className="text-end">Total</TableHead>
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
                            {PLAN_LABELS[r.company.mover.plan]}
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
              <EmptyState title="No company activity in this range" className="m-4" />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
