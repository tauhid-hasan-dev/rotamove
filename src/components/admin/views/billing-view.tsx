"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { DetailRow, EmptyState, KpiCard, PageHeader, StatusBadge } from "@/components/admin/bits";
import { DateRangePicker, useDateRange } from "@/components/admin/date-range-picker";
import { ExportMenu } from "@/components/admin/export-menu";
import {
  PaginationBar,
  SortHead,
  usePagination,
  useSort,
} from "@/components/admin/table-bits";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort, formatUsd, formatUsdPrecise } from "@/lib/format";
import { INVOICE_STATUS_META, PAYMENT_METHOD_LABELS, PLAN_LABELS } from "@/lib/admin/labels";
import { billingTotals, inRange } from "@/lib/admin/metrics";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  INVOICE_STATUSES,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/admin/types";

type SortKey = "number" | "issued" | "due" | "total";

export function BillingView() {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const dateRange = useDateRange(data.anchorMs, "90d");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const { sort, toggle } = useSort<SortKey>({ key: "issued", direction: "desc" });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [refundReason, setRefundReason] = useState("");

  const companiesById = useMemo(
    () => new Map(data.companies.map((c) => [c.mover.id, c])),
    [data.companies],
  );

  const totals = useMemo(() => billingTotals(data, dateRange.range), [data, dateRange.range]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.invoices.filter((invoice) => {
      if (!inRange(invoice.issuedAt, dateRange.range)) return false;
      if (status !== "all" && invoice.status !== status) return false;
      if (!q) return true;
      const company = companiesById.get(invoice.companyId);
      return (
        invoice.number.toLowerCase().includes(q) ||
        (company?.mover.name.toLowerCase().includes(q) ?? false)
      );
    });

    const dir = sort.direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      switch (sort.key) {
        case "number":
          return dir * a.number.localeCompare(b.number);
        case "issued":
          return dir * a.issuedAt.localeCompare(b.issuedAt);
        case "due":
          return dir * a.dueAt.localeCompare(b.dueAt);
        case "total":
          return dir * (a.totalUsd - b.totalUsd);
      }
    });
  }, [data.invoices, dateRange.range, query, status, sort, companiesById]);

  const pagination = usePagination(filtered, 12);
  const selected = selectedId ? data.invoices.find((i) => i.id === selectedId) : undefined;
  const selectedCompany = selected ? companiesById.get(selected.companyId) : undefined;
  const selectedPayments = selected
    ? data.payments.filter((p) => p.invoiceId === selected.id)
    : [];

  const buildSheet = () => ({
    headers: ["Invoice", "Company", "Plan", "Period", "Issued", "Due", "Status", "Total USD", "Paid at"],
    rows: filtered.map((invoice) => [
      invoice.number,
      companiesById.get(invoice.companyId)?.mover.name ?? invoice.companyId,
      PLAN_LABELS[invoice.plan],
      invoice.periodStart.slice(0, 7),
      invoice.issuedAt,
      invoice.dueAt,
      invoice.status,
      invoice.totalUsd,
      invoice.paidAt?.slice(0, 10) ?? "",
    ]),
  });

  const recordPayment = (invoice: Invoice) => {
    const company = companiesById.get(invoice.companyId);
    if (
      payMethod === "credit_balance" &&
      (company?.creditBalanceUsd ?? 0) < invoice.totalUsd
    ) {
      toast.error("Credit balance does not cover this invoice.");
      return;
    }
    dispatch({ type: "invoice/pay", id: invoice.id, method: payMethod });
    toast.success(`${invoice.number} marked paid`);
  };

  const refund = (invoice: Invoice) => {
    dispatch({
      type: "invoice/refund",
      id: invoice.id,
      reason: refundReason.trim() || "Refunded from admin console",
    });
    toast.success(`${invoice.number} refunded`);
    setRefundReason("");
  };

  const hasFilters = query !== "" || status !== "all";

  return (
    <div className="animate-rise">
      <PageHeader
        title="Billing"
        description="Invoices, payments, refunds and prepaid lead credits across the network."
        actions={
          <>
            <DateRangePicker
              value={dateRange}
              onPreset={dateRange.setPreset}
              onCustom={dateRange.setCustom}
            />
            <ExportMenu
              basename={`rotamove-invoices-${dateRange.range.end}`}
              buildSheet={buildSheet}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Collected"
          value={formatUsd(totals.collectedUsd)}
          hint="in period, net of refunds"
        />
        <KpiCard
          label="Outstanding"
          value={formatUsd(totals.outstandingUsd)}
          hint={`${totals.openCount + totals.overdueCount} open invoices`}
        />
        <KpiCard
          label="Overdue"
          value={formatUsd(totals.overdueUsd)}
          hint={`${totals.overdueCount} invoices past due`}
        />
        <KpiCard label="Refunded" value={formatUsd(totals.refundedUsd)} hint="in period" />
      </div>

      <div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice number or company…"
            aria-label="Search invoices"
            className="w-72 ps-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | "all")}>
          <SelectTrigger className="w-36" aria-label="Filter by invoice status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {INVOICE_STATUS_META[s].label}
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
                <SortHead label="Invoice" sortKey="number" sort={sort} onToggle={toggle} />
                <TableHead>Company</TableHead>
                <TableHead>Period</TableHead>
                <SortHead label="Issued" sortKey="issued" sort={sort} onToggle={toggle} />
                <SortHead label="Due" sortKey="due" sort={sort} onToggle={toggle} />
                <SortHead label="Total" sortKey="total" sort={sort} onToggle={toggle} align="right" />
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageRows.map((invoice) => {
                const company = companiesById.get(invoice.companyId);
                return (
                  <TableRow
                    key={invoice.id}
                    tabIndex={0}
                    onClick={() => setSelectedId(invoice.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedId(invoice.id);
                    }}
                    className="cursor-pointer"
                  >
                    <TableCell className="code whitespace-nowrap text-[12.5px]">
                      {invoice.number}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-[13px] font-medium">
                      {company?.mover.name ?? invoice.companyId}
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {invoice.periodStart.slice(0, 7)}
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {formatDateShort(invoice.issuedAt)}
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {formatDateShort(invoice.dueAt)}
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px] font-semibold">
                      {formatUsdPrecise(invoice.totalUsd)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={INVOICE_STATUS_META[invoice.status]} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No invoices match these filters" : "No invoices in this period"}
            description={
              hasFilters ? "Loosen the search or clear a filter." : "Pick a wider date range."
            }
            icon={<Receipt className="size-5" aria-hidden />}
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

      {/* Credit ledger */}
      <Card className="mt-4 gap-0 overflow-hidden py-0 shadow-soft">
        <CardHeader className="pt-6 pb-4">
          <CardTitle>Lead credit ledger</CardTitle>
          <CardDescription>
            Prepaid credits granted and spent. Grant new credits from a company&apos;s page.
          </CardDescription>
        </CardHeader>
        {data.credits.length === 0 ? (
          <CardContent className="pb-6">
            <EmptyState title="No credit activity" />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-end">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.credits.slice(0, 10).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-[13px] font-medium">
                      <Link
                        href={`/admin/companies/${entry.companyId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {companiesById.get(entry.companyId)?.mover.name ?? entry.companyId}
                      </Link>
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {formatDateShort(entry.at)}
                    </TableCell>
                    <TableCell className="max-w-72 truncate text-[13px]">{entry.reason}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{entry.by}</TableCell>
                    <TableCell
                      className={`tnum text-end text-[13px] font-semibold ${entry.deltaUsd >= 0 ? "text-verify" : "text-destructive"}`}
                    >
                      {entry.deltaUsd >= 0 ? "+" : ""}
                      {formatUsdPrecise(entry.deltaUsd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Invoice detail dialog */}
      <Dialog open={selected !== undefined} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="code text-[15px]">{selected.number}</span>
                  <StatusBadge meta={INVOICE_STATUS_META[selected.status]} />
                </DialogTitle>
                <DialogDescription>
                  {selectedCompany?.mover.name} · {PLAN_LABELS[selected.plan]} · period{" "}
                  {selected.periodStart} to {selected.periodEnd}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1">
                {selected.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span>{line.description}</span>
                    <span className="tnum">{formatUsdPrecise(line.amountUsd)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-[14px] font-semibold">
                  <span>Total</span>
                  <span className="tnum">{formatUsdPrecise(selected.totalUsd)}</span>
                </div>
              </div>

              <dl className="rounded-lg bg-muted/60 px-3 py-1">
                <DetailRow label="Issued">{formatDateShort(selected.issuedAt)}</DetailRow>
                <DetailRow label="Due">{formatDateShort(selected.dueAt)}</DetailRow>
                {selected.paidAt ? (
                  <DetailRow label="Paid">
                    {formatDateShort(selected.paidAt)}
                    {selectedPayments[0]
                      ? ` · ${PAYMENT_METHOD_LABELS[selectedPayments[0].method]}`
                      : ""}
                  </DetailRow>
                ) : null}
                {selected.refund ? (
                  <DetailRow label="Refunded">
                    {formatDateShort(selected.refund.at)} · {selected.refund.reason}
                  </DetailRow>
                ) : null}
              </dl>

              {selected.status === "open" || selected.status === "overdue" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-method">Record payment</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                      <SelectTrigger id="pay-method" className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                        <SelectItem value="credit_balance">
                          Credit balance ({formatUsd(selectedCompany?.creditBalanceUsd ?? 0)})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => recordPayment(selected)}>Mark paid</Button>
                </div>
              ) : null}

              {selected.status === "paid" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="refund-reason">Refund reason</Label>
                    <Input
                      id="refund-reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Disputed lead quality"
                    />
                  </div>
                  <Button variant="destructive" className="gap-1.5" onClick={() => refund(selected)}>
                    <Undo2 aria-hidden />
                    Refund {formatUsdPrecise(selected.totalUsd)}
                  </Button>
                </div>
              ) : null}

              <DialogFooter>
                <Button asChild variant="ghost">
                  <Link href={`/admin/companies/${selected.companyId}`}>Open company</Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
