"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, KpiCard, PageHeader } from "@/components/admin/bits";
import { RevenueTrendChart } from "@/components/admin/charts";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import { PaginationBar, usePagination } from "@/components/admin/table-bits";
import { MoverLogo } from "@/components/common/mover-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { PlanId } from "@/lib/types";
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

const PLAN_IDS: readonly PlanId[] = ["pro_unlimited", "pay_per_lead", "pay_per_seen"];

const PERIOD_SORTS = ["period_desc", "period_asc", "revenue_desc", "leads_desc"] as const;
const COMPANY_SORTS = ["total_desc", "leads_desc", "name_asc"] as const;

type PeriodSort = (typeof PERIOD_SORTS)[number];
type CompanySort = (typeof COMPANY_SORTS)[number];

/** The toolbar strip each table carries above its own rows. */
function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-surface/60 px-6 py-3">
      {children}
    </div>
  );
}

/**
 * Cell rhythm for the two report tables.
 *
 * The table defaults to 8px of padding and sits flush against the card edge,
 * which at full width left the first column tight to the border and ran the
 * money columns into each other. This gives the outer edges the same 24px
 * gutter the card header already uses, so the table lines up with the title
 * above it, and 16px between columns.
 *
 * Logical properties, so the gutter stays on the outside in Arabic.
 */
const CELLS = [
  "[&_th]:px-4 [&_td]:px-4 [&_td]:py-3",
  "[&_th:first-child]:ps-6 [&_td:first-child]:ps-6",
  "[&_th:last-child]:pe-6 [&_td:last-child]:pe-6",
].join(" ");

/** Rows per page, matching the other admin tables. */
const PAGE_SIZE = 10;

export function ReportsView() {
  const { dict, t } = useI18n();
  const rx = dict.admin.reports;
  const data = useAdminData();
  const dateRange = useDateRange(data.anchorMs, "30d");
  const [period, setPeriod] = useState<string>("daily");

  // Per-table filters. Each table carries its own, because the two answer
  // different questions off the same range — "which weeks earned" and
  // "which carriers paid" are rarely narrowed the same way.
  const [periodSort, setPeriodSort] = useState<PeriodSort>("period_desc");
  const [periodActive, setPeriodActive] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyPlan, setCompanyPlan] = useState<PlanId | "all">("all");
  const [companySort, setCompanySort] = useState<CompanySort>("total_desc");

  const allRows = useMemo(() => reportRows(data, dateRange.range), [data, dateRange.range]);
  const revenue = useMemo(() => revenueTrend(data, dateRange.range), [data, dateRange.range]);
  const allCompanyRows = useMemo(
    () => companyReport(data, dateRange.range),
    [data, dateRange.range],
  );

  const rows = useMemo(() => {
    const kept = periodActive
      ? allRows.filter((r) => r.leads > 0 || r.revenueUsd > 0)
      : allRows;
    const sorted = [...kept];
    switch (periodSort) {
      case "period_asc":
        sorted.sort((a, b) => a.key.localeCompare(b.key));
        break;
      case "revenue_desc":
        sorted.sort((a, b) => b.revenueUsd - a.revenueUsd);
        break;
      case "leads_desc":
        sorted.sort((a, b) => b.leads - a.leads);
        break;
      default:
        sorted.sort((a, b) => b.key.localeCompare(a.key));
    }
    return sorted;
  }, [allRows, periodActive, periodSort]);

  const byCompany = useMemo(() => {
    const needle = companyQuery.trim().toLowerCase();
    const kept = allCompanyRows.filter((r) => {
      if (companyPlan !== "all" && r.company.mover.plan !== companyPlan) return false;
      if (needle && !r.company.mover.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    const sorted = [...kept];
    switch (companySort) {
      case "leads_desc":
        sorted.sort((a, b) => b.leadsReceived - a.leadsReceived);
        break;
      case "name_asc":
        sorted.sort((a, b) => a.company.mover.name.localeCompare(b.company.mover.name));
        break;
      default:
        sorted.sort((a, b) => b.totalUsd - a.totalUsd);
    }
    return sorted;
  }, [allCompanyRows, companyQuery, companyPlan, companySort]);

  const periodPages = usePagination(rows, PAGE_SIZE);
  const companyPages = usePagination(byCompany, PAGE_SIZE);

  // KPIs answer for the whole range, so they read off the unfiltered rows —
  // a total that moved when you typed in a search box would be lying about
  // the period it is labelled with.
  const totals = useMemo(
    () =>
      allRows.reduce(
        (acc, r) => ({
          leads: acc.leads + r.leads,
          assigned: acc.assigned + r.assigned,
          converted: acc.converted + r.converted,
          revenue: Math.round((acc.revenue + r.revenueUsd) * 100) / 100,
        }),
        { leads: 0, assigned: 0, converted: 0, revenue: 0 },
      ),
    [allRows],
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

      {/* Stacked, not side by side: each table is wide enough that sharing
          a row squeezed the company names and crowded five money columns
          into half a screen. */}
      <div className="mt-4 space-y-4">
        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>{rx.byPeriodTitle}</CardTitle>
              <CardDescription>{rx.byPeriodDescription}</CardDescription>
            </div>
            <ExportMenu
              basename={`rotamove-report-${dateRange.range.end}`}
              buildSheet={buildPeriodSheet}
            />
          </CardHeader>

          <FilterBar>
            <Select
              value={periodSort}
              onValueChange={(v) => {
                setPeriodSort(v as PeriodSort);
                periodPages.setPage(0);
              }}
            >
              <SelectTrigger className="w-56" aria-label={rx.sortAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {rx.periodSorts[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={periodActive ? "active" : "all"}
              onValueChange={(v) => {
                setPeriodActive(v === "active");
                periodPages.setPage(0);
              }}
            >
              <SelectTrigger className="w-48" aria-label={rx.activityFilterAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{rx.allPeriods}</SelectItem>
                <SelectItem value="active">{rx.activePeriodsOnly}</SelectItem>
              </SelectContent>
            </Select>

            {/* Only worth saying when a filter actually removed something;
                the page counter below carries the totals otherwise. */}
            {rows.length !== allRows.length ? (
              <span className="ms-auto text-[13px] text-muted-foreground tnum">
                {t.fill(rx.showingPeriods, {
                  shown: t.number(rows.length),
                  total: t.number(allRows.length),
                })}
              </span>
            ) : null}
          </FilterBar>

          <div className="overflow-x-auto">
            <Table className={CELLS}>
              <TableHeader>
                <TableRow>
                  <TableHead>{rx.colPeriod}</TableHead>
                  <TableHead className="text-end">{rx.colLeads}</TableHead>
                  <TableHead className="text-end">{rx.colRevenue}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodPages.pageRows.map((r) => (
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
          </div>
          {rows.length === 0 ? (
            <EmptyState title={rx.emptyPeriods} className="m-4" />
          ) : (
            <PaginationBar
              page={periodPages.page}
              pageCount={periodPages.pageCount}
              from={periodPages.from}
              to={periodPages.to}
              total={periodPages.total}
              onPage={periodPages.setPage}
            />
          )}
        </Card>

        <Card className="gap-0 overflow-hidden py-0 shadow-soft">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pt-6 pb-4">
            <div className="space-y-1">
              <CardTitle>{rx.byCompanyTitle}</CardTitle>
              <CardDescription>{rx.byCompanyDescription}</CardDescription>
            </div>
            <ExportMenu
              basename={`rotamove-company-report-${dateRange.range.end}`}
              buildSheet={buildCompanySheet}
            />
          </CardHeader>

          <FilterBar>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={companyQuery}
                onChange={(e) => {
                  setCompanyQuery(e.target.value);
                  companyPages.setPage(0);
                }}
                placeholder={dict.admin.companies.searchPlaceholder}
                aria-label={dict.admin.companies.searchAria}
                className="w-64 ps-8"
              />
            </div>

            <Select
              value={companyPlan}
              onValueChange={(v) => {
                setCompanyPlan(v as PlanId | "all");
                companyPages.setPage(0);
              }}
            >
              <SelectTrigger className="w-44" aria-label={dict.admin.companies.planFilterAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.admin.companies.allPlans}</SelectItem>
                {PLAN_IDS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {dict.admin.labels.plan[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={companySort}
              onValueChange={(v) => {
                setCompanySort(v as CompanySort);
                companyPages.setPage(0);
              }}
            >
              <SelectTrigger className="w-56" aria-label={rx.sortAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {rx.companySorts[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {byCompany.length !== allCompanyRows.length ? (
              <span className="ms-auto text-[13px] text-muted-foreground tnum">
                {t.fill(rx.showingCompanies, {
                  shown: t.number(byCompany.length),
                  total: t.number(allCompanyRows.length),
                })}
              </span>
            ) : null}
          </FilterBar>

          <div className="overflow-x-auto">
            <Table className={CELLS}>
              <TableHeader>
                <TableRow>
                  <TableHead>{rx.colCompany}</TableHead>
                  <TableHead className="text-end">{rx.colLeads}</TableHead>
                  <TableHead className="text-end">{rx.colLeadFees}</TableHead>
                  <TableHead className="text-end">{rx.colSubscriptions}</TableHead>
                  <TableHead className="text-end">{rx.colTotal}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyPages.pageRows.map((r) => (
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
          </div>
          {byCompany.length === 0 ? (
            <EmptyState title={rx.emptyCompanies} className="m-4" />
          ) : (
            <PaginationBar
              page={companyPages.page}
              pageCount={companyPages.pageCount}
              from={companyPages.from}
              to={companyPages.to}
              total={companyPages.total}
              onPage={companyPages.setPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
