"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoveRight, Search } from "lucide-react";
import { EmptyState } from "@/components/admin/bits";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import { useAdminPageTitle } from "@/components/admin/page-title";
import {
  PaginationBar,
  SortHead,
  usePagination,
  useSort,
} from "@/components/admin/table-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/i18n/provider";
import { cityLabel } from "@/lib/geo";
import { leadsInRange } from "@/lib/admin/metrics";
import { useAdminData } from "@/lib/admin/store";
import type { AdminLead } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type SortKey = "created" | "move" | "quality" | "fee";

function routeLabel(l: AdminLead): string {
  return `${cityLabel(l.lead.origin.cityCode)} → ${cityLabel(l.lead.destination.cityCode)}`;
}

export function LeadsView() {
  const data = useAdminData();
  const router = useRouter();
  const { dict, t } = useI18n();
  const dateRange = useDateRange(data.anchorMs, "30d");

  useAdminPageTitle(dict.admin.leads.title);

  const [query, setQuery] = useState("");
  const [dupOnly, setDupOnly] = useState(false);
  const { sort, toggle } = useSort<SortKey>({ key: "created", direction: "desc" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leadsInRange(data.leads, dateRange.range).filter((l) => {
      if (dupOnly && !l.duplicateOf) return false;
      if (!q) return true;
      return (
        l.lead.id.toLowerCase().includes(q) ||
        l.lead.contact.fullName.toLowerCase().includes(q) ||
        l.lead.contact.email.toLowerCase().includes(q) ||
        routeLabel(l).toLowerCase().includes(q)
      );
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      switch (sort.key) {
        case "created":
          return dir * a.lead.createdAt.localeCompare(b.lead.createdAt);
        case "move":
          return dir * a.lead.moveDate.localeCompare(b.lead.moveDate);
        case "quality":
          return dir * (a.qualityScore - b.qualityScore);
        case "fee":
          return dir * (a.feeEur - b.feeEur);
      }
    });
  }, [data.leads, dateRange.range, query, dupOnly, sort]);

  const pagination = usePagination(filtered, 12);

  const buildSheet = () => ({
    headers: [
      dict.admin.leads.exportHeaders.leadId,
      dict.admin.leads.exportHeaders.created,
      dict.admin.leads.exportHeaders.name,
      dict.admin.leads.exportHeaders.email,
      dict.admin.leads.exportHeaders.phone,
      dict.admin.leads.exportHeaders.route,
      dict.admin.leads.exportHeaders.moveDate,
      dict.admin.leads.exportHeaders.property,
      dict.admin.leads.exportHeaders.volumeM3,
      dict.admin.leads.exportHeaders.status,
      dict.admin.leads.exportHeaders.channel,
      dict.admin.leads.exportHeaders.quality,
      dict.admin.leads.exportHeaders.feeEur,
      dict.admin.leads.exportHeaders.assignedCompanies,
      dict.admin.leads.exportHeaders.duplicateOf,
    ],
    rows: filtered.map((l) => [
      l.lead.id,
      l.lead.createdAt.slice(0, 10),
      l.lead.contact.fullName,
      l.lead.contact.email,
      l.lead.contact.phone,
      routeLabel(l),
      l.lead.moveDate,
      dict.enums.propertySize[l.lead.propertySize].label,
      l.lead.volumeM3,
      l.status,
      dict.admin.labels.channel[l.source.channel],
      l.qualityScore,
      l.feeEur,
      l.assignments.length,
      l.duplicateOf ?? "",
    ]),
  });

  const hasFilters = query !== "" || dupOnly;

  return (
    <div className="animate-rise">
      {/*
        One row: search, the duplicates switch, then the date range and
        export pushed to the end. The title is claimed by the topbar, so
        nothing above this repeats it — which is also what lets the toolbar
        sit on a single line instead of under a two-line header block.
      */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.admin.leads.searchPlaceholder}
            aria-label={dict.admin.leads.searchAria}
            className="w-full ps-9 sm:w-72"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch id="dup-only" checked={dupOnly} onCheckedChange={setDupOnly} />
          <Label htmlFor="dup-only" className="text-[13px] font-normal text-muted-foreground">
            {dict.admin.leads.duplicatesOnly}
          </Label>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onPreset={dateRange.setPreset}
            onCustom={dateRange.setCustom}
          />
          <ExportMenu basename={`rotamove-leads-${dateRange.range.end}`} buildSheet={buildSheet} />
        </div>
      </div>

      {/*
        The table.

        Three changes from the shared default, all of them about letting the
        rows breathe: a softer corner radius so the panel reads as a sheet of
        data rather than a card; roughly double the cell padding, with the
        first and last columns inset further so nothing runs up against the
        border; and a quiet header band that separates labels from values
        without a heavy rule.

        Scoped here rather than changed in `ui/table`, which eight other
        admin views share and none of them asked for.
      */}
      <div className="overflow-hidden rounded-md border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <Table
            className={cn(
              "[&_thead]:bg-muted/40",
              "[&_th]:h-11 [&_th]:px-4 [&_th]:text-[12px] [&_th]:font-medium [&_th]:text-muted-foreground",
              "[&_td]:px-4 [&_td]:py-3.5",
              "[&_th:first-child]:ps-6 [&_td:first-child]:ps-6",
              "[&_th:last-child]:pe-6 [&_td:last-child]:pe-6",
            )}
          >
            <TableHeader>
              <TableRow>
                {/* Position in the filtered set, not the lead's identity —
                    the ID is already under the name. It continues across
                    pages so "row 14" means the same thing on page two. */}
                <TableHead className="w-[64px] text-end">{dict.admin.leads.colNumber}</TableHead>
                <TableHead>{dict.admin.leads.colLead}</TableHead>
                <TableHead>{dict.admin.leads.colRoute}</TableHead>
                <SortHead label={dict.admin.leads.colCreated} sortKey="created" sort={sort} onToggle={toggle} />
                <SortHead label={dict.admin.leads.colMoveDate} sortKey="move" sort={sort} onToggle={toggle} />
                <TableHead>{dict.admin.leads.colProperty}</TableHead>
                <SortHead label={dict.admin.leads.colQuality} sortKey="quality" sort={sort} onToggle={toggle} align="right" />
                <SortHead label={dict.admin.leads.colFee} sortKey="fee" sort={sort} onToggle={toggle} align="right" />
                <TableHead className="text-end">{dict.admin.leads.colAssigned}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageRows.map((l, i) => (
                <TableRow
                  key={l.lead.id}
                  tabIndex={0}
                  onClick={() => router.push(`/admin/leads/${l.lead.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/admin/leads/${l.lead.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <TableCell className="tnum text-end text-[13px] text-muted-foreground">
                    {t.number(pagination.from + i)}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1.5 font-medium">
                        {l.lead.contact.fullName}
                        {l.duplicateOf ? (
                          <Badge variant="outline" className="gap-1 border-dashed text-muted-foreground">
                            <Copy aria-hidden />
                            {dict.admin.leads.dupBadge}
                          </Badge>
                        ) : null}
                      </span>
                      <span className="code text-[11px] text-muted-foreground">{l.lead.id}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                      <span className="code">{l.lead.origin.cityCode}</span>
                      <MoveRight className="size-3.5 text-muted-foreground" aria-hidden />
                      <span className="code">{l.lead.destination.cityCode}</span>
                    </span>
                  </TableCell>
                  <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                    {t.dateShort(l.lead.createdAt)}
                  </TableCell>
                  <TableCell className="tnum whitespace-nowrap text-[13px]">
                    {t.dateShort(l.lead.moveDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">
                    {dict.enums.propertySize[l.lead.propertySize].label} · {t.volume(l.lead.volumeM3)}
                  </TableCell>
                  <TableCell className="text-end">
                    <span
                      className={cn(
                        "tnum text-[13px] font-semibold",
                        l.qualityScore >= 70
                          ? "text-verify"
                          : l.qualityScore >= 45
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {l.qualityScore}
                    </span>
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {t.eur(l.feeEur)}
                  </TableCell>
                  <TableCell className="tnum text-end text-[13px]">
                    {l.assignments.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? dict.admin.leads.emptyFilteredTitle : dict.admin.leads.emptyPeriodTitle}
            description={
              hasFilters ? dict.admin.leads.emptyFilteredBody : dict.admin.leads.emptyPeriodBody
            }
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
