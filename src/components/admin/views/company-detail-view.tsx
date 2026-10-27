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
import { REGIONS } from "@/lib/geo";
import { formatDateShort, formatNumber, formatUsd, formatUsdPrecise, pct } from "@/lib/format";
import {
  COMPANY_STATUS_META,
  DELIVERY_META,
  INVOICE_STATUS_META,
  LEAD_STATUS_META,
  PLAN_LABELS,
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

export function CompanyDetailView({ companyId }: { companyId: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();

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

  if (!company) {
    return (
      <EmptyState
        title="Company not found"
        description={`No company with ID ${companyId} exists in this dataset.`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/companies">Back to companies</Link>
          </Button>
        }
      />
    );
  }

  const { mover } = company;

  const setStatus = (status: CompanyStatus, reason?: string) => {
    dispatch({ type: "company/status", id: companyId, status, reason });
    toast.success(`${mover.name} is now ${COMPANY_STATUS_META[status].label.toLowerCase()}`);
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
    toast.success("Company profile updated");
    setEditOpen(false);
  };

  const grantCredit = () => {
    const amount = Number.parseFloat(creditAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a positive credit amount.");
      return;
    }
    dispatch({
      type: "credit/add",
      companyId,
      amountUsd: Math.round(amount * 100) / 100,
      reason: creditReason.trim() || "Manual credit",
    });
    toast.success(`${formatUsd(amount)} credit granted`);
    setCreditOpen(false);
    setCreditReason("");
  };

  const deliveredRate =
    perf && perf.leadsReceived > 0 ? perf.delivered / perf.leadsReceived : undefined;

  return (
    <div className="animate-rise">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ms-2 gap-1.5 text-muted-foreground">
        <Link href="/admin/companies">
          <ArrowLeft aria-hidden />
          All companies
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <MoverLogo mover={mover} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.035em]">{mover.name}</h1>
            <StatusBadge meta={COMPANY_STATUS_META[company.status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {mover.legalName} · {mover.hqCity} · partner since {company.joinedAt} ·{" "}
            {PLAN_LABELS[mover.plan]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5" onClick={openEdit}>
            <Pencil aria-hidden />
            Edit profile
          </Button>
          {company.status !== "active" ? (
            <ConfirmDialog
              trigger={
                <Button className="gap-1.5">
                  <CircleCheck aria-hidden />
                  Activate
                </Button>
              }
              title={`Activate ${mover.name}?`}
              description="The company starts receiving matched leads again immediately."
              confirmLabel="Activate"
              onConfirm={() => setStatus("active")}
            />
          ) : (
            <>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" className="gap-1.5">
                    <CirclePause aria-hidden />
                    Suspend
                  </Button>
                }
                title={`Suspend ${mover.name}?`}
                description="Lead delivery pauses until the account is re-activated. Open invoices stay due."
                confirmLabel="Suspend"
                destructive
                onConfirm={() => setStatus("suspended", "Suspended from the admin console.")}
              />
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" className="gap-1.5">
                    <Ban aria-hidden />
                    Deactivate
                  </Button>
                }
                title={`Deactivate ${mover.name}?`}
                description="The account is closed and removed from matching. This is reversible in the prototype, but would be a heavyweight action in production."
                confirmLabel="Deactivate"
                destructive
                onConfirm={() => setStatus("deactivated", "Account deactivated.")}
              />
            </>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Leads (12 mo)"
          value={formatNumber(perf?.leadsReceived ?? 0)}
          hint={perf?.lastAssignedAt ? `last ${formatDateShort(perf.lastAssignedAt)}` : "none yet"}
        />
        <KpiCard
          label="Delivery rate"
          value={deliveredRate === undefined ? "—" : pct(deliveredRate)}
          hint={perf ? `${perf.bounced} bounced` : undefined}
        />
        <KpiCard
          label="Fees paid (12 mo)"
          value={mover.plan === "pay_per_lead" ? formatUsd(perf?.feesUsd ?? 0) : "Pro plan"}
          hint={mover.plan === "pay_per_lead" ? "lead unlocks" : `$${data.settings.proMonthlyUsd}/mo subscription`}
        />
        <KpiCard
          label="Credit balance"
          value={formatUsd(company.creditBalanceUsd)}
          hint="prepaid lead credit"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Profile */}
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Rating">
                  <Stars rating={mover.rating} count={mover.reviewCount} />
                </DetailRow>
                <DetailRow label="Completed moves">
                  <span className="tnum">{formatNumber(mover.completedMoves)}</span>
                </DetailRow>
                <DetailRow label="On-time rate">
                  <span className="tnum">{pct(mover.onTimeRate)}</span>
                </DetailRow>
                <DetailRow label="Median response">
                  <span className="tnum">{mover.responseMins} min</span>
                </DetailRow>
                <DetailRow label="Fleet">
                  {mover.fleetTrucks} trucks · crew of {mover.crewSize}
                </DetailRow>
                <DetailRow label="Insurance up to">
                  <span className="tnum">€{formatNumber(mover.insuranceUpToEur)}</span>
                </DetailRow>
                <DetailRow label="Certifications">
                  {mover.certifications.length > 0 ? mover.certifications.join(", ") : "—"}
                </DetailRow>
              </dl>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mover.regions.map((r) => (
                  <Badge key={r} variant="secondary">
                    {REGIONS[r].name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
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
              <CardTitle>Lead credits</CardTitle>
              <CardDescription>Prepaid balance applied before card charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {credits.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No credit activity.</p>
              ) : (
                credits.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="min-w-0">
                      <span className="block truncate">{entry.reason}</span>
                      <span className="tnum text-xs text-muted-foreground">
                        {formatDateShort(entry.at)} · {entry.by}
                      </span>
                    </span>
                    <span
                      className={`tnum font-semibold ${entry.deltaUsd >= 0 ? "text-verify" : "text-destructive"}`}
                    >
                      {entry.deltaUsd >= 0 ? "+" : ""}
                      {formatUsdPrecise(entry.deltaUsd)}
                    </span>
                  </div>
                ))
              )}
              <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Plus aria-hidden />
                    Grant credit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Grant lead credit</DialogTitle>
                    <DialogDescription>
                      Added to {mover.name}&apos;s balance and logged in the audit trail.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="credit-amount">Amount (USD)</Label>
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
                      <Label htmlFor="credit-reason">Reason</Label>
                      <Input
                        id="credit-reason"
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        placeholder="e.g. Make-good for bounced lead"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={grantCredit}>Grant credit</Button>
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
              <CardTitle>Lead history</CardTitle>
              <CardDescription>Every lead offered to this company, newest first.</CardDescription>
            </CardHeader>
            {history.length === 0 ? (
              <CardContent className="pb-6">
                <EmptyState
                  title="No leads assigned yet"
                  description="Assignments from the lead pages appear here."
                />
              </CardContent>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead className="text-end">Fee</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Pipeline</TableHead>
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
                              {formatDateShort(assignment.assignedAt)}
                            </TableCell>
                            <TableCell className="tnum text-end text-[13px]">
                              {assignment.feeUsd > 0 ? formatUsdPrecise(assignment.feeUsd) : "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge meta={DELIVERY_META[assignment.delivery]} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge meta={LEAD_STATUS_META[l.status]} />
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
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>
                Full billing lives in the <Link href="/admin/billing" className="underline underline-offset-4">Billing</Link> module.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoices.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No invoices issued.</p>
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
                        {formatUsdPrecise(invoice.totalUsd)}
                      </span>
                      <StatusBadge meta={INVOICE_STATUS_META[invoice.status]} />
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
            <DialogTitle>Edit {mover.name}</DialogTitle>
            <DialogDescription>
              Contact and internal notes. Commercial profile fields (fleet, coverage) are managed
              by the partner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Contact name</Label>
              <Input
                id="edit-name"
                value={draft.contactName}
                onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Contact email</Label>
              <Input
                id="edit-email"
                type="email"
                value={draft.contactEmail}
                onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Contact phone</Label>
              <Input
                id="edit-phone"
                value={draft.contactPhone}
                onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Internal notes</Label>
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
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
