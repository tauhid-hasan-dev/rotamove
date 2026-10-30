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
import { INVOICE_STATUS_META } from "@/lib/admin/labels";
import { billingTotals, inRange } from "@/lib/admin/metrics";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  INVOICE_STATUSES,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/admin/types";
import { useI18n } from "@/i18n/provider";

type SortKey = "number" | "issued" | "due" | "total";

export function BillingView() {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const { dict, t } = useI18n();
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
          return dir * (a.totalEur - b.totalEur);
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
    headers: [
      dict.admin.billing.colInvoice,
      dict.admin.billing.colCompany,
      dict.admin.billing.exportPlan,
      dict.admin.billing.colPeriod,
      dict.admin.billing.colIssued,
      dict.admin.billing.colDue,
      dict.admin.billing.colStatus,
      dict.admin.billing.exportTotalEur,
      dict.admin.billing.exportPaidAt,
    ],
    rows: filtered.map((invoice) => [
      invoice.number,
      companiesById.get(invoice.companyId)?.mover.name ?? invoice.companyId,
      dict.admin.labels.plan[invoice.plan],
      invoice.periodStart.slice(0, 7),
      invoice.issuedAt,
      invoice.dueAt,
      invoice.status,
      invoice.totalEur,
      invoice.paidAt?.slice(0, 10) ?? "",
    ]),
  });

  const recordPayment = (invoice: Invoice) => {
    const company = companiesById.get(invoice.companyId);
    if (
      payMethod === "credit_balance" &&
      (company?.creditBalanceEur ?? 0) < invoice.totalEur
    ) {
      toast.error(dict.admin.billing.creditShortError);
      return;
    }
    dispatch({ type: "invoice/pay", id: invoice.id, method: payMethod });
    toast.success(t.fill(dict.admin.billing.markedPaidToast, { number: invoice.number }));
  };

  const refund = (invoice: Invoice) => {
    dispatch({
      type: "invoice/refund",
      id: invoice.id,
      reason: refundReason.trim() || dict.admin.billing.refundReasonFallback,
    });
    toast.success(t.fill(dict.admin.billing.refundedToast, { number: invoice.number }));
    setRefundReason("");
  };

  const hasFilters = query !== "" || status !== "all";

  return (
    <div className="animate-rise">
      <PageHeader
        title={dict.admin.billing.title}
        description={dict.admin.billing.description}
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
          label={dict.admin.billing.kpiCollected}
          value={t.eur(totals.collectedEur)}
          hint={dict.admin.billing.kpiCollectedHint}
        />
        <KpiCard
          label={dict.admin.billing.kpiOutstanding}
          value={t.eur(totals.outstandingEur)}
          hint={t.fill(dict.admin.billing.kpiOutstandingHint, {
            n: totals.openCount + totals.overdueCount,
          })}
        />
        <KpiCard
          label={dict.admin.billing.kpiOverdue}
          value={t.eur(totals.overdueEur)}
          hint={t.fill(dict.admin.billing.kpiOverdueHint, { n: totals.overdueCount })}
        />
        <KpiCard
          label={dict.admin.billing.kpiRefunded}
          value={t.eur(totals.refundedEur)}
          hint={dict.admin.billing.kpiRefundedHint}
        />
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
            placeholder={dict.admin.billing.searchPlaceholder}
            aria-label={dict.admin.billing.searchAria}
            className="w-72 ps-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | "all")}>
          <SelectTrigger className="w-36" aria-label={dict.admin.billing.statusFilterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.admin.common.allStatuses}</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {dict.admin.status.invoice[s]}
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
                <SortHead label={dict.admin.billing.colInvoice} sortKey="number" sort={sort} onToggle={toggle} />
                <TableHead>{dict.admin.billing.colCompany}</TableHead>
                <TableHead>{dict.admin.billing.colPeriod}</TableHead>
                <SortHead label={dict.admin.billing.colIssued} sortKey="issued" sort={sort} onToggle={toggle} />
                <SortHead label={dict.admin.billing.colDue} sortKey="due" sort={sort} onToggle={toggle} />
                <SortHead label={dict.admin.billing.colTotal} sortKey="total" sort={sort} onToggle={toggle} align="right" />
                <TableHead>{dict.admin.billing.colStatus}</TableHead>
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
                      {t.dateShort(invoice.issuedAt)}
                    </TableCell>
                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {t.dateShort(invoice.dueAt)}
                    </TableCell>
                    <TableCell className="tnum text-end text-[13px] font-semibold">
                      {t.eur(invoice.totalEur)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        meta={INVOICE_STATUS_META[invoice.status]}
                        label={dict.admin.status.invoice[invoice.status]}
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
            title={hasFilters ? dict.admin.billing.emptyFiltered : dict.admin.billing.emptyNone}
            description={
              hasFilters ? dict.admin.common.loosenFilters : dict.admin.billing.emptyNoneHint
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
          <CardTitle>{dict.admin.billing.ledgerTitle}</CardTitle>
          <CardDescription>{dict.admin.billing.ledgerDescription}</CardDescription>
        </CardHeader>
        {data.credits.length === 0 ? (
          <CardContent className="pb-6">
            <EmptyState title={dict.admin.billing.ledgerEmpty} />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.admin.billing.colCompany}</TableHead>
                  <TableHead>{dict.admin.billing.colDate}</TableHead>
                  <TableHead>{dict.admin.billing.colReason}</TableHead>
                  <TableHead>{dict.admin.billing.colBy}</TableHead>
                  <TableHead className="text-end">{dict.admin.billing.colAmount}</TableHead>
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
                      {t.dateShort(entry.at)}
                    </TableCell>
                    <TableCell className="max-w-72 truncate text-[13px]">{entry.reason}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{entry.by}</TableCell>
                    <TableCell
                      className={`tnum text-end text-[13px] font-semibold ${entry.deltaEur >= 0 ? "text-verify" : "text-destructive"}`}
                    >
                      {entry.deltaEur >= 0 ? "+" : ""}
                      {t.eur(entry.deltaEur)}
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
                  <StatusBadge
                    meta={INVOICE_STATUS_META[selected.status]}
                    label={dict.admin.status.invoice[selected.status]}
                  />
                </DialogTitle>
                <DialogDescription>
                  {selectedCompany?.mover.name} · {dict.admin.labels.plan[selected.plan]} ·{" "}
                  {t.fill(dict.admin.billing.dialogPeriod, {
                    start: selected.periodStart,
                    end: selected.periodEnd,
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1">
                {selected.lines.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-3 text-[13px]">
                    <span>{line.description}</span>
                    <span className="tnum">{t.eur(line.amountEur)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-[14px] font-semibold">
                  <span>{dict.admin.billing.total}</span>
                  <span className="tnum">{t.eur(selected.totalEur)}</span>
                </div>
              </div>

              <dl className="rounded-lg bg-muted/60 px-3 py-1">
                <DetailRow label={dict.admin.billing.colIssued}>
                  {t.dateShort(selected.issuedAt)}
                </DetailRow>
                <DetailRow label={dict.admin.billing.colDue}>{t.dateShort(selected.dueAt)}</DetailRow>
                {selected.paidAt ? (
                  <DetailRow label={dict.admin.billing.paidLabel}>
                    {t.dateShort(selected.paidAt)}
                    {selectedPayments[0]
                      ? ` · ${dict.admin.labels.paymentMethod[selectedPayments[0].method]}`
                      : ""}
                  </DetailRow>
                ) : null}
                {selected.refund ? (
                  <DetailRow label={dict.admin.billing.refundedLabel}>
                    {t.dateShort(selected.refund.at)} · {selected.refund.reason}
                  </DetailRow>
                ) : null}
              </dl>

              {selected.status === "open" || selected.status === "overdue" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pay-method">{dict.admin.billing.recordPayment}</Label>
                    <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                      <SelectTrigger id="pay-method" className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">{dict.admin.labels.paymentMethod.card}</SelectItem>
                        <SelectItem value="bank_transfer">
                          {dict.admin.labels.paymentMethod.bank_transfer}
                        </SelectItem>
                        <SelectItem value="credit_balance">
                          {dict.admin.labels.paymentMethod.credit_balance} (
                          {t.eur(selectedCompany?.creditBalanceEur ?? 0)})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => recordPayment(selected)}>
                    {dict.admin.billing.markPaid}
                  </Button>
                </div>
              ) : null}

              {selected.status === "paid" ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="refund-reason">{dict.admin.billing.refundReason}</Label>
                    <Input
                      id="refund-reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder={dict.admin.billing.refundReasonPlaceholder}
                    />
                  </div>
                  <Button variant="destructive" className="gap-1.5" onClick={() => refund(selected)}>
                    <Undo2 aria-hidden />
                    {t.fill(dict.admin.billing.refundAmount, { amount: t.eur(selected.totalEur) })}
                  </Button>
                </div>
              ) : null}

              <DialogFooter>
                <Button asChild variant="ghost">
                  <Link href={`/admin/companies/${selected.companyId}`}>
                    {dict.admin.billing.openCompany}
                  </Link>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
