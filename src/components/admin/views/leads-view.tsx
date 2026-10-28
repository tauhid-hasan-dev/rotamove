"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoveRight, Search } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/bits";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import {
  PaginationBar,
  SortHead,
  usePagination,
  useSort,
} from "@/components/admin/table-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CHANNELS, type AdminLead } from "@/lib/admin/types";
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

  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<string>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [dupOnly, setDupOnly] = useState(false);
  const { sort, toggle } = useSort<SortKey>({ key: "created", direction: "desc" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leadsInRange(data.leads, dateRange.range).filter((l) => {
      if (channel !== "all" && l.source.channel !== channel) return false;
      if (companyId !== "all" && !l.assignments.some((a) => a.companyId === companyId)) {
        return false;
      }
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
          return dir * (a.feeUsd - b.feeUsd);
      }
    });
  }, [data.leads, dateRange.range, query, channel, companyId, dupOnly, sort]);

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
      dict.admin.leads.exportHeaders.feeUsd,
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
      l.feeUsd,
      l.assignments.length,
      l.duplicateOf ?? "",
    ]),
  });

  const hasFilters = query !== "" || channel !== "all" || companyId !== "all" || dupOnly;

  return (
    <div className="animate-rise">
      <PageHeader
        title={dict.admin.leads.title}
        description={dict.admin.leads.description}
        actions={
          <>
            <DateRangePicker
              value={dateRange}
              onPreset={dateRange.setPreset}
              onCustom={dateRange.setCustom}
            />
            <ExportMenu basename={`rotamove-leads-${dateRange.range.end}`} buildSheet={buildSheet} />
          </>
        }
      />

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.admin.leads.searchPlaceholder}
            aria-label={dict.admin.leads.searchAria}
            className="w-64 ps-8"
          />
        </div>

        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-40" aria-label={dict.admin.leads.filterChannelAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.admin.leads.allChannels}</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {dict.admin.labels.channel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="w-48" aria-label={dict.admin.leads.filterCompanyAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.admin.leads.allCompanies}</SelectItem>
            {data.companies.map((c) => (
              <SelectItem key={c.mover.id} value={c.mover.id}>
                {c.mover.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ps-1">
          <Switch id="dup-only" checked={dupOnly} onCheckedChange={setDupOnly} />
          <Label htmlFor="dup-only" className="text-[13px] font-normal text-muted-foreground">
            {dict.admin.leads.duplicatesOnly}
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
              {pagination.pageRows.map((l) => (
                <TableRow
                  key={l.lead.id}
                  tabIndex={0}
                  onClick={() => router.push(`/admin/leads/${l.lead.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/admin/leads/${l.lead.id}`);
                  }}
                  className="cursor-pointer"
                >
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
                    {t.usd(l.feeUsd)}
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
