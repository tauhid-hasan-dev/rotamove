"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { Stars } from "@/components/common/stars";
import { EmptyState, PageHeader, StatusBadge } from "@/components/admin/bits";
import { ExportMenu } from "@/components/admin/export-menu";
import {
  PaginationBar,
  SortHead,
  usePagination,
  useSort,
} from "@/components/admin/table-bits";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REGION_ORDER, type RegionId } from "@/lib/geo";
import { COMPANY_STATUS_META } from "@/lib/admin/labels";
import { companyPerformance, type DayRange } from "@/lib/admin/metrics";
import { presetRange } from "@/lib/admin/date-range";
import { useAdminData } from "@/lib/admin/store";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/admin/types";
import type { PlanId } from "@/lib/types";
import { useI18n } from "@/i18n/provider";

type SortKey = "name" | "rating" | "leads" | "fees" | "joined";

const PLAN_IDS: readonly PlanId[] = ["pro_unlimited", "pay_per_lead", "pay_per_seen"];

/**
 * The statuses this table deals in.
 *
 * Everything except `pending`, which belongs to the review queue — see the
 * filter in `filtered` below. Derived from `COMPANY_STATUSES` rather than
 * written out, so a fifth status appears here the day it is added.
 */
const MANAGED_STATUSES = COMPANY_STATUSES.filter((s) => s !== "pending");

export function CompaniesView() {
  const data = useAdminData();
  const router = useRouter();
  const { dict, t } = useI18n();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CompanyStatus | "all">("all");
  const [plan, setPlan] = useState<PlanId | "all">("all");
  const [region, setRegion] = useState<RegionId | "all">("all");
  const { sort, toggle } = useSort<SortKey>({ key: "leads", direction: "desc" });

  // Performance is summed over the last 12 months — the list ranks partners
  // by sustained activity, the detail page has the fine-grained view.
  const yearRange: DayRange = useMemo(() => presetRange("all", data.anchorMs), [data.anchorMs]);
  const performance = useMemo(
    () => new Map(companyPerformance(data, yearRange).map((p) => [p.company.mover.id, p])),
    [data, yearRange],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.companies.filter((c) => {
      /*
       * Pending companies are not managed here.
       *
       * A company awaiting a decision is a different kind of object from one
       * we have accepted: it has no lead history, no invoices and no plan we
       * are billing, so every column on this table reads as a zero, and the
       * only useful action on it — approve or decline — lives in the review
       * queue. Leaving it in made Manage companies a list that was partly a
       * list of work, and gave the reviewer two places to look.
       */
      if (c.status === "pending") return false;
      if (status !== "all" && c.status !== status) return false;
      if (plan !== "all" && c.mover.plan !== plan) return false;
      if (region !== "all" && !c.mover.regions.includes(region)) return false;
      if (!q) return true;
      return (
        c.mover.name.toLowerCase().includes(q) ||
        c.mover.hqCity.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q)
      );
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      const pa = performance.get(a.mover.id);
      const pb = performance.get(b.mover.id);
      switch (sort.key) {
        case "name":
          return dir * a.mover.name.localeCompare(b.mover.name);
        case "rating":
          return dir * (a.mover.rating - b.mover.rating);
        case "leads":
          return dir * ((pa?.leadsReceived ?? 0) - (pb?.leadsReceived ?? 0));
        case "fees":
          return dir * ((pa?.feesUsd ?? 0) - (pb?.feesUsd ?? 0));
        case "joined":
          return dir * a.joinedAt.localeCompare(b.joinedAt);
      }
    });
  }, [data.companies, query, status, plan, region, sort, performance]);

  const pagination = usePagination(filtered, 10);

  const buildSheet = () => ({
    headers: [
      dict.admin.companies.colCompany,
      dict.admin.companies.exportLegalName,
      dict.admin.companies.colStatus,
      dict.admin.companies.colPlan,
      dict.admin.companies.exportHq,
      dict.admin.companies.colJoined,
      dict.admin.companies.colRating,
      dict.admin.companies.colLeads12mo,
      dict.admin.companies.exportFeesUsd12mo,
      dict.admin.companies.exportContact,
      dict.admin.companies.exportEmail,
      dict.admin.companies.exportCreditUsd,
    ],
    rows: filtered.map((c) => {
      const perf = performance.get(c.mover.id);
      return [
        c.mover.name,
        c.mover.legalName,
        c.status,
        dict.admin.labels.plan[c.mover.plan],
        c.mover.hqCity,
        c.joinedAt,
        c.mover.rating,
        perf?.leadsReceived ?? 0,
        perf?.feesUsd ?? 0,
        c.contactName,
        c.contactEmail,
        c.creditBalanceUsd,
      ];
    }),
  });

  const hasFilters = query !== "" || status !== "all" || plan !== "all" || region !== "all";

  return (
    <div className="animate-rise">
      <PageHeader
        title={dict.admin.companies.title}
        description={dict.admin.companies.description}
        actions={
          <ExportMenu basename="rotamove-companies" buildSheet={buildSheet} />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.admin.companies.searchPlaceholder}
            aria-label={dict.admin.companies.searchAria}
            className="w-64 ps-8"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus | "all")}>
          <SelectTrigger className="w-40" aria-label={dict.admin.companies.statusFilterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.admin.common.allStatuses}</SelectItem>
            {/* "Pending review" is not offered: those rows are filtered out
                of this table above, so the option could only ever return an
                empty list. */}
            {MANAGED_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {dict.admin.status.company[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={plan} onValueChange={(v) => setPlan(v as PlanId | "all")}>
          <SelectTrigger className="w-40" aria-label={dict.admin.companies.planFilterAria}>
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

        <Select value={region} onValueChange={(v) => setRegion(v as RegionId | "all")}>
          <SelectTrigger className="w-48" aria-label={dict.admin.companies.regionFilterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.admin.companies.allRegions}</SelectItem>
            {REGION_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {dict.enums.regions[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label={dict.admin.companies.colCompany} sortKey="name" sort={sort} onToggle={toggle} />
                <TableHead>{dict.admin.companies.colPlan}</TableHead>
                <SortHead label={dict.admin.companies.colRating} sortKey="rating" sort={sort} onToggle={toggle} />
                <SortHead label={dict.admin.companies.colLeads12mo} sortKey="leads" sort={sort} onToggle={toggle} align="right" />
                <SortHead label={dict.admin.companies.colFees12mo} sortKey="fees" sort={sort} onToggle={toggle} align="right" />
                <SortHead label={dict.admin.companies.colJoined} sortKey="joined" sort={sort} onToggle={toggle} />
                <TableHead>{dict.admin.companies.colStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageRows.map((c) => {
                const perf = performance.get(c.mover.id);
                return (
                  <TableRow
                    key={c.mover.id}
                    tabIndex={0}
                    onClick={() => router.push(`/admin/companies/${c.mover.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/admin/companies/${c.mover.id}`);
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <MoverLogo mover={c.mover} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.mover.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {t.fill(dict.admin.companies.hqSince, {
                              city: c.mover.hqCity,
                              year: c.mover.since,
                            })}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                      {dict.admin.labels.plan[c.mover.plan]}
                    </TableCell>
                    <TableCell>
                      <Stars rating={c.mover.rating} compact />
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {t.number(perf?.leadsReceived ?? 0)}
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px]">
                      {perf && perf.feesUsd > 0 ? t.usd(perf.feesUsd) : "—"}
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {c.joinedAt}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        meta={COMPANY_STATUS_META[c.status]}
                        label={dict.admin.status.company[c.status]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.admin.companies.emptyFiltered : dict.admin.companies.emptyNone}
            description={hasFilters ? dict.admin.common.loosenFilters : undefined}
            className="m-4"
          />
        ) : (
          <PaginationBar
            page={pagination.page}
            pageCount={pagination.pageCount}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            onPage={pagination.setPage}
          />
        )}
      </div>
    </div>
  );
}
