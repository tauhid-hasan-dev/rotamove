"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CircleCheck, CirclePause, Mail, MoveRight, Pencil, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { MoverLogo } from "@/components/common/mover-logo";
import { Stars } from "@/components/common/stars";
import { DetailRow, EmptyState, KpiCard, StatusBadge } from "@/components/admin/bits";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PaginationBar, usePagination } from "@/components/admin/table-bits";
import { Badge } from "@/components/ui/badge";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPANY_STATUS_META,
  DELIVERY_META,
  INVOICE_STATUS_META,
} from "@/lib/admin/labels";
import { presetRange } from "@/lib/admin/date-range";
import {
  companyPerformance,
  invoicesForCompany,
  leadsForCompany,
  type DayRange,
} from "@/lib/admin/metrics";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import type { CompanyStatus } from "@/lib/admin/types";
import { useI18n } from "@/i18n/provider";

export function CompanyDetailView({ companyId }: { companyId: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const { dict, t } = useI18n();

  const company = data.companies.find((c) => c.mover.id === companyId);

  const yearRange: DayRange = useMemo(() => presetRange("all", data.anchorMs), [data.anchorMs]);
  const perf = useMemo(
    () => companyPerformance(data, yearRange).find((p) => p.company.mover.id === companyId),
    [data, yearRange, companyId],
  );
  const history = useMemo(() => leadsForCompany(data.leads, companyId), [data.leads, companyId]);
  const invoices = useMemo(
    () => invoicesForCompany(data.invoices, companyId),
    [data.invoices, companyId],
  );
  const credits = useMemo(
    () => data.credits.filter((c) => c.companyId === companyId),
    [data.credits, companyId],
  );
  const pagination = usePagination(history, 8);

  // Edit dialog draft
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({ contactName: "", contactEmail: "", contactPhone: "", notes: "" });
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("25");
  const [creditReason, setCreditReason] = useState("");

  // The grant currently being corrected — null when nothing is open.
  const [amending, setAmending] = useState<{
    id: string;
    amount: string;
    reason: string;
  } | null>(null);

  if (!company) {
    return (
      <EmptyState
        title={dict.admin.companyDetail.notFoundTitle}
        description={t.fill(dict.admin.companyDetail.notFoundDescription, { id: companyId })}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/companies">{dict.admin.companyDetail.backToCompanies}</Link>
          </Button>
        }
      />
    );
  }

  const { mover } = company;

  const setStatus = (status: CompanyStatus, reason?: string) => {
    dispatch({ type: "company/status", id: companyId, status, reason });
    toast.success(
      t.fill(dict.admin.companyDetail.statusToast, {
        name: mover.name,
        status: dict.admin.status.company[status].toLowerCase(),
      }),
    );
  };

  const openEdit = () => {
    setDraft({
      contactName: company.contactName,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      notes: company.notes ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    dispatch({ type: "company/update", id: companyId, patch: draft });
    toast.success(dict.admin.companyDetail.profileUpdatedToast);
    setEditOpen(false);
  };

  const grantCredit = () => {
    const amount = Number.parseFloat(creditAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(dict.admin.companyDetail.creditAmountError);
      return;
    }
    dispatch({
      type: "credit/add",
      companyId,
      amountUsd: Math.round(amount * 100) / 100,
      reason: creditReason.trim() || dict.admin.companyDetail.creditReasonFallback,
    });
    toast.success(t.fill(dict.admin.companyDetail.creditGrantedToast, { amount: t.usd(amount) }));
    setCreditOpen(false);
    setCreditReason("");
  };

  const saveAmendedCredit = () => {
    if (!amending) return;
    const amount = Number.parseFloat(amending.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(dict.admin.companyDetail.creditAmountError);
      return;
    }
    dispatch({
      type: "credit/amend",
      creditId: amending.id,
      amountUsd: amount,
      reason: amending.reason.trim() || dict.admin.companyDetail.creditReasonFallback,
    });
    toast.success(
      t.fill(dict.admin.companyDetail.creditCorrectedToast, { amount: t.usd(amount) }),
    );
    setAmending(null);
  };

  return (
    <div className="animate-rise">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ms-2 gap-1.5 text-muted-foreground">
        <Link href="/admin/companies">
          <ArrowLeft aria-hidden />
          {dict.admin.companyDetail.allCompanies}
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <MoverLogo mover={mover} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.035em]">{mover.name}</h1>
            <StatusBadge
              meta={COMPANY_STATUS_META[company.status]}
              label={dict.admin.status.company[company.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {mover.legalName} · {mover.hqCity} ·{" "}
            {t.fill(dict.admin.companyDetail.partnerSince, { date: company.joinedAt })} ·{" "}
            {dict.admin.labels.plan[mover.plan]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5" onClick={openEdit}>
            <Pencil aria-hidden />
            {dict.admin.companyDetail.editProfile}
          </Button>
          {company.status !== "active" ? (
            <ConfirmDialog
              trigger={
                <Button className="gap-1.5">
                  <CircleCheck aria-hidden />
                  {dict.admin.companyDetail.activate}
                </Button>
              }
              title={t.fill(dict.admin.companyDetail.activateTitle, { name: mover.name })}
              description={dict.admin.companyDetail.activateDescription}
              confirmLabel={dict.admin.companyDetail.activate}
              onConfirm={() => setStatus("active")}
            />
          ) : (
            <>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" className="gap-1.5">
                    <CirclePause aria-hidden />
                    {dict.admin.companyDetail.suspend}
                  </Button>
                }
                title={t.fill(dict.admin.companyDetail.suspendTitle, { name: mover.name })}
                description={dict.admin.companyDetail.suspendDescription}
                confirmLabel={dict.admin.companyDetail.suspend}
                destructive
                onConfirm={() => setStatus("suspended", dict.admin.companyDetail.suspendReason)}
              />
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" className="gap-1.5">
                    <Ban aria-hidden />
                    {dict.admin.companyDetail.deactivate}
                  </Button>
                }
                title={t.fill(dict.admin.companyDetail.deactivateTitle, { name: mover.name })}
                description={dict.admin.companyDetail.deactivateDescription}
                confirmLabel={dict.admin.companyDetail.deactivate}
                destructive
                onConfirm={() => setStatus("deactivated", dict.admin.companyDetail.deactivateReason)}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={dict.admin.companyDetail.kpiLeads12mo}
          value={t.number(perf?.leadsReceived ?? 0)}
          hint={
            perf?.lastAssignedAt
              ? t.fill(dict.admin.companyDetail.kpiLastAssigned, {
                  date: t.dateShort(perf.lastAssignedAt),
                })
              : dict.admin.companyDetail.kpiNoneYet
          }
        />
        <KpiCard
          label={dict.admin.companyDetail.kpiFeesPaid12mo}
          value={
            mover.plan !== "pro_unlimited"
              ? t.usd(perf?.feesUsd ?? 0)
              : dict.admin.companyDetail.kpiProPlan
          }
          hint={
            mover.plan !== "pro_unlimited"
              ? dict.admin.companyDetail.kpiLeadUnlocks
              : t.fill(dict.admin.companyDetail.kpiSubscription, {
                  amount: t.usd(data.settings.proMonthlyUsd),
                })
          }
        />
        <KpiCard
          label={dict.admin.companyDetail.kpiCreditBalance}
          value={t.usd(company.creditBalanceUsd)}
          hint={dict.admin.companyDetail.kpiPrepaidCredit}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Profile */}
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.companyDetail.profileTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow label={dict.admin.companyDetail.rating}>
                  <Stars rating={mover.rating} count={mover.reviewCount} />
                </DetailRow>
                <DetailRow label={dict.admin.companyDetail.fleet}>
                  {t.fill(dict.admin.companyDetail.fleetValue, {
                    trucks: mover.fleetTrucks,
                    crew: mover.crewSize,
                  })}
                </DetailRow>
                <DetailRow label={dict.admin.companyDetail.insuranceUpTo}>
                  <span className="tnum">€{t.number(mover.insuranceUpToEur)}</span>
                </DetailRow>
                <DetailRow label={dict.admin.companyDetail.certifications}>
                  {mover.certifications.length > 0 ? mover.certifications.join(", ") : "—"}
                </DetailRow>
              </dl>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mover.regions.map((r) => (
                  <Badge key={r} variant="secondary">
                    {dict.enums.regions[r]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.companyDetail.contactTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-[13px]">
              <p className="font-medium">{company.contactName}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" aria-hidden />
                {company.contactEmail}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" aria-hidden />
                <span className="tnum">{company.contactPhone}</span>
              </p>
              {company.notes ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-[13px] text-muted-foreground">
                  {company.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.companyDetail.leadCreditsTitle}</CardTitle>
              <CardDescription>{dict.admin.companyDetail.leadCreditsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {credits.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  {dict.admin.companyDetail.noCreditActivity}
                </p>
              ) : (
                credits.slice(0, 5).map((entry) => {
                  // Spends are written by invoice settlement; correcting one
                  // here would only put the ledger out of step with the
                  // invoice that caused it.
                  const correctable = entry.deltaUsd >= 0;
                  return (
                    <div
                      key={entry.id}
                      className="group flex items-center justify-between gap-2 text-[13px]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{entry.reason}</span>
                        <span className="tnum text-xs text-muted-foreground">
                          {t.dateShort(entry.at)} · {entry.by}
                          {entry.correctedFrom !== undefined
                            ? ` · ${t.fill(dict.admin.companyDetail.creditWas, {
                                amount: t.usd(entry.correctedFrom),
                              })}`
                            : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <span
                          className={`tnum font-semibold ${entry.deltaUsd >= 0 ? "text-verify" : "text-destructive"}`}
                        >
                          {entry.deltaUsd >= 0 ? "+" : ""}
                          {t.usd(entry.deltaUsd)}
                        </span>
                        {correctable ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label={t.fill(dict.admin.companyDetail.editCreditAria, {
                              amount: t.usd(entry.deltaUsd),
                            })}
                            onClick={() =>
                              setAmending({
                                id: entry.id,
                                amount: String(entry.deltaUsd),
                                reason: entry.reason,
                              })
                            }
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                        ) : null}
                      </span>
                    </div>
                  );
                })
              )}
              <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Plus aria-hidden />
                    {dict.admin.companyDetail.grantCredit}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{dict.admin.companyDetail.grantCreditTitle}</DialogTitle>
                    <DialogDescription>
                      {t.fill(dict.admin.companyDetail.grantCreditDescription, {
                        name: mover.name,
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-amount">{dict.admin.companyDetail.amountUsd}</Label>
                      <Input
                        id="credit-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-reason">{dict.admin.companyDetail.reason}</Label>
                      <Input
                        id="credit-reason"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        placeholder={dict.admin.companyDetail.reasonPlaceholder}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">{dict.admin.common.cancel}</Button>
                    </DialogClose>
                    <Button onClick={grantCredit}>{dict.admin.companyDetail.grantCredit}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Correcting a grant that was keyed in wrong. Separate from
                  the grant dialog above because the two are different acts:
                  one decides to give credit, the other fixes a number. */}
              <Dialog
                open={amending !== null}
                onOpenChange={(open) => {
                  if (!open) setAmending(null);
                }}
              >
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{dict.admin.companyDetail.editCreditTitle}</DialogTitle>
                    <DialogDescription>
                      {dict.admin.companyDetail.editCreditDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-edit-amount">
                        {dict.admin.companyDetail.amountUsd}
                      </Label>
                      <Input
                        id="credit-edit-amount"
                        type="number"
                        min="1"
                        step="1"
                        value={amending?.amount ?? ""}
                        onChange={(e) =>
                          setAmending((prev) =>
                            prev ? { ...prev, amount: e.target.value } : prev,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-edit-reason">
                        {dict.admin.companyDetail.reason}
                      </Label>
                      <Input
                        id="credit-edit-reason"
                        value={amending?.reason ?? ""}
                        onChange={(e) =>
                          setAmending((prev) =>
                            prev ? { ...prev, reason: e.target.value } : prev,
                          )
                        }
                        placeholder={dict.admin.companyDetail.reasonPlaceholder}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">{dict.admin.common.cancel}</Button>
                    </DialogClose>
                    <Button onClick={saveAmendedCredit}>
                      {dict.admin.companyDetail.editCreditSave}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Lead history + invoices */}
        <div className="space-y-4 xl:col-span-2">
          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>{dict.admin.companyDetail.leadHistoryTitle}</CardTitle>
              <CardDescription>{dict.admin.companyDetail.leadHistoryDescription}</CardDescription>
            </CardHeader>
            {history.length === 0 ? (
              <CardContent className="pb-6">
                <EmptyState
                  title={dict.admin.companyDetail.noLeadsTitle}
                  description={dict.admin.companyDetail.noLeadsDescription}
                />
              </CardContent>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{dict.admin.companyDetail.colLead}</TableHead>
                        <TableHead>{dict.admin.companyDetail.colRoute}</TableHead>
                        <TableHead>{dict.admin.companyDetail.colAssigned}</TableHead>
                        <TableHead className="text-end">{dict.admin.companyDetail.colFee}</TableHead>
                        <TableHead>{dict.admin.companyDetail.colDelivery}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.pageRows.map((l) => {
                        const assignment = l.assignments.find((a) => a.companyId === companyId);
                        if (!assignment) return null;
                        return (
                          <TableRow key={l.lead.id}>
                            <TableCell>
                              <Link
                                href={`/admin/leads/${l.lead.id}`}
                                className="font-medium underline-offset-4 hover:underline"
                              >
                                {l.lead.contact.fullName}
                              </Link>
                              <span className="code block text-[11px] text-muted-foreground">
                                {l.lead.id}
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
                              {t.dateShort(assignment.assignedAt)}
                            </TableCell>
                            <TableCell className="tnum text-end text-[13px]">
                              {assignment.feeUsd > 0 ? t.usd(assignment.feeUsd) : "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                meta={DELIVERY_META[assignment.delivery]}
                                label={dict.admin.status.delivery[assignment.delivery]}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PaginationBar
                  page={pagination.page}
                  pageCount={pagination.pageCount}
                  from={pagination.from}
                  to={pagination.to}
                  total={pagination.total}
                  onPage={pagination.setPage}
                />
              </>
            )}
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.companyDetail.recentInvoicesTitle}</CardTitle>
              <CardDescription>
                {dict.admin.companyDetail.recentInvoicesLead}{" "}
                <Link href="/admin/billing" className="underline underline-offset-4">
                  {dict.admin.companyDetail.billingLink}
                </Link>{" "}
                {dict.admin.companyDetail.recentInvoicesTail}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoices.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  {dict.admin.companyDetail.noInvoices}
                </p>
              ) : (
                invoices.slice(0, 6).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <span className="text-[13px]">
                      <span className="code text-[12px]">{invoice.number}</span>{" "}
                      <span className="text-muted-foreground">
                        {invoice.periodStart.slice(0, 7)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tnum text-[13px] font-semibold">
                        {t.usd(invoice.totalUsd)}
                      </span>
                      <StatusBadge
                        meta={INVOICE_STATUS_META[invoice.status]}
                        label={dict.admin.status.invoice[invoice.status]}
                      />
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.fill(dict.admin.companyDetail.editTitle, { name: mover.name })}</DialogTitle>
            <DialogDescription>{dict.admin.companyDetail.editDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">{dict.admin.companyDetail.contactName}</Label>
              <Input
                id="edit-name"
                value={draft.contactName}
                onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">{dict.admin.companyDetail.contactEmail}</Label>
              <Input
                id="edit-email"
                type="email"
                value={draft.contactEmail}
                onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{dict.admin.companyDetail.contactPhone}</Label>
              <Input
                id="edit-phone"
                value={draft.contactPhone}
                onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">{dict.admin.companyDetail.internalNotes}</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">{dict.admin.common.cancel}</Button>
            </DialogClose>
            <Button onClick={saveEdit}>{dict.admin.common.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
