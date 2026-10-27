"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Mail,
  MoveRight,
  Phone,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { MoverLogo } from "@/components/common/mover-logo";
import { DetailRow, EmptyState, PageHeader, StatusBadge } from "@/components/admin/bits";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cityLabel } from "@/lib/geo";
import { formatDateLong, formatDateShort, formatUsdPrecise, formatVolume } from "@/lib/format";
import { ACCESS_OPTIONS, SPECIAL_ITEM_LABELS } from "@/lib/pricing";
import {
  DELIVERY_META,
  FLEXIBILITY_LABELS,
  LEAD_STATUS_META,
  PROPERTY_SIZE_LABELS,
  SERVICE_LEVEL_LABELS,
} from "@/lib/admin/labels";
import { eligibleCompanies } from "@/lib/admin/metrics";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  CHANNEL_LABELS,
  LEAD_STATUSES,
  type DeliveryStatus,
  type LeadStatus,
} from "@/lib/admin/types";

const EXTRA_LABELS = {
  packing: "Packing",
  unpacking: "Unpacking",
  dismantling: "Dismantling",
  insurance: "Insurance",
  customsClearance: "Customs clearance",
  cleaning: "End-of-tenancy cleaning",
} as const;

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDateShort(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const [assignOpen, setAssignOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const adminLead = data.leads.find((l) => l.lead.id === leadId);
  const companiesById = useMemo(
    () => new Map(data.companies.map((c) => [c.mover.id, c])),
    [data.companies],
  );

  const sameContact = useMemo(() => {
    if (!adminLead) return [];
    const email = adminLead.lead.contact.email.toLowerCase();
    return data.leads.filter(
      (l) => l.lead.id !== leadId && l.lead.contact.email.toLowerCase() === email,
    );
  }, [data.leads, adminLead, leadId]);

  if (!adminLead) {
    return (
      <EmptyState
        title="Lead not found"
        description={`No lead with ID ${leadId} exists in this dataset.`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/leads">Back to leads</Link>
          </Button>
        }
      />
    );
  }

  const { lead, status, source, assignments } = adminLead;
  const assignable = eligibleCompanies(lead, data.companies).filter(
    (c) => !assignments.some((a) => a.companyId === c.mover.id),
  );

  const setStatus = (next: LeadStatus) => {
    dispatch({ type: "lead/status", id: leadId, status: next });
    toast.success(`Lead marked ${LEAD_STATUS_META[next].label.toLowerCase()}`);
  };

  const confirmAssign = () => {
    if (picked.size === 0) return;
    dispatch({ type: "lead/assign", id: leadId, companyIds: [...picked] });
    toast.success(`Lead assigned to ${picked.size} ${picked.size === 1 ? "company" : "companies"}`);
    setPicked(new Set());
    setAssignOpen(false);
  };

  const specials = Object.entries(lead.specialItems)
    .filter(([, v]) => v)
    .map(([k]) => SPECIAL_ITEM_LABELS[k as keyof typeof SPECIAL_ITEM_LABELS]);
  const extras: string[] = Object.entries(EXTRA_LABELS)
    .filter(([k]) => lead.extras[k as keyof typeof EXTRA_LABELS])
    .map(([, label]) => label);
  if (lead.extras.storageWeeks > 0) extras.push(`Storage (${lead.extras.storageWeeks} wk)`);

  const accessLabel = (id: string) => ACCESS_OPTIONS.find((o) => o.id === id)?.label ?? id;

  return (
    <div className="animate-rise">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ms-2 gap-1.5 text-muted-foreground">
        <Link href="/admin/leads">
          <ArrowLeft aria-hidden />
          All leads
        </Link>
      </Button>

      <PageHeader
        title={lead.contact.fullName}
        description={`Lead ${lead.id} · created ${formatDateLong(lead.createdAt)}`}
        actions={
          <>
            {adminLead.duplicateOf ? (
              <Badge variant="outline" className="gap-1 border-dashed text-muted-foreground">
                <Copy aria-hidden />
                Duplicate of {adminLead.duplicateOf}
              </Badge>
            ) : null}
            <StatusBadge meta={LEAD_STATUS_META[status]} />
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger className="w-40" aria-label="Change lead status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    Mark {LEAD_STATUS_META[s].label.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Left: the enquiry itself */}
        <div className="space-y-4 xl:col-span-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="code">{lead.origin.cityCode}</span>
                <MoveRight className="size-4 text-muted-foreground" aria-hidden />
                <span className="code">{lead.destination.cityCode}</span>
                <span className="ms-1 text-sm font-normal text-muted-foreground">
                  {cityLabel(lead.origin.cityCode)} to {cityLabel(lead.destination.cityCode)}
                </span>
              </CardTitle>
              <CardDescription>
                {lead.moveType === "international" ? "International" : "Domestic"} ·{" "}
                {SERVICE_LEVEL_LABELS[lead.serviceLevel]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <DetailRow label="Move date">
                  {formatDateLong(lead.moveDate)}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {FLEXIBILITY_LABELS[lead.flexibility]}
                  </span>
                </DetailRow>
                <DetailRow label="Property">
                  {PROPERTY_SIZE_LABELS[lead.propertySize]} · {formatVolume(lead.volumeM3)}
                </DetailRow>
                <DetailRow label="Origin access">
                  {accessLabel(lead.origin.access)}
                  {lead.origin.easyParking ? " · easy parking" : " · difficult parking"}
                </DetailRow>
                <DetailRow label="Destination access">
                  {accessLabel(lead.destination.access)}
                  {lead.destination.easyParking ? " · easy parking" : " · difficult parking"}
                </DetailRow>
                <DetailRow label="Special items">
                  {specials.length > 0 ? specials.join(", ") : "None"}
                </DetailRow>
                <DetailRow label="Extra services">
                  {extras.length > 0 ? extras.join(", ") : "None"}
                </DetailRow>
                <DetailRow label="Preferred matches">
                  {lead.preferredMatches === null ? "All matches" : lead.preferredMatches}
                </DetailRow>
                <DetailRow label="Quality score">
                  <span className="tnum">{adminLead.qualityScore} / 100</span>
                </DetailRow>
              </dl>
              {lead.notes ? (
                <>
                  <Separator className="my-3" />
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Customer note: </span>
                    {lead.notes}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-[13px]">
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  {lead.contact.email}
                  {lead.contact.emailVerified ? (
                    <BadgeCheck className="size-4 text-verify" aria-label="Email verified" />
                  ) : null}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  <span className="tnum">{lead.contact.phone}</span>
                  {lead.contact.phoneVerified ? (
                    <BadgeCheck className="size-4 text-verify" aria-label="Phone verified" />
                  ) : null}
                </p>
                <p className="text-muted-foreground">
                  Prefers {lead.contact.channel === "all" ? "any channel" : lead.contact.channel} ·
                  speaks {lead.contact.locale.toUpperCase()}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <DetailRow label="Channel">{CHANNEL_LABELS[source.channel]}</DetailRow>
                  {source.campaignId ? (
                    <DetailRow label="Campaign">
                      {data.campaigns.find((c) => c.id === source.campaignId)?.name ??
                        source.campaignId}
                    </DetailRow>
                  ) : null}
                  <DetailRow label="Landing page">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{source.landingPage}</span>
                  </DetailRow>
                  <DetailRow label="Visitor country">{source.country}</DetailRow>
                  <DetailRow label="Lead fee">{formatUsdPrecise(adminLead.feeUsd)}</DetailRow>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Duplicates */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Duplicate check</CardTitle>
              <CardDescription>
                Other enquiries from {lead.contact.email}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sameContact.length === 0 && !adminLead.duplicateOf ? (
                <p className="text-[13px] text-muted-foreground">
                  No other enquiry shares this contact. Nothing to review.
                </p>
              ) : (
                <>
                  {sameContact.map((other) => (
                    <div
                      key={other.lead.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="text-[13px]">
                        <Link
                          href={`/admin/leads/${other.lead.id}`}
                          className="code text-[12px] underline-offset-4 hover:underline"
                        >
                          {other.lead.id}
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          {formatDateShort(other.lead.createdAt)} ·{" "}
                          {cityLabel(other.lead.origin.cityCode)} to{" "}
                          {cityLabel(other.lead.destination.cityCode)}
                        </span>
                      </span>
                      {adminLead.duplicateOf !== other.lead.id ? (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="xs">
                              Mark this one as duplicate
                            </Button>
                          }
                          title="Mark as duplicate?"
                          description={`${lead.id} will be flagged as a repeat of ${other.lead.id}. Companies will not be charged twice for duplicates.`}
                          confirmLabel="Mark duplicate"
                          onConfirm={() => {
                            dispatch({
                              type: "lead/duplicate",
                              id: leadId,
                              duplicateOf: other.lead.id,
                            });
                            toast.success("Marked as duplicate");
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                  {adminLead.duplicateOf ? (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <TriangleAlert aria-hidden />
                          Clear duplicate flag
                        </Button>
                      }
                      title="Clear duplicate flag?"
                      description="This lead will count as a distinct enquiry again."
                      confirmLabel="Clear flag"
                      onConfirm={() => {
                        dispatch({ type: "lead/duplicate", id: leadId, duplicateOf: undefined });
                        toast.success("Duplicate flag cleared");
                      }}
                    />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: pipeline + deliveries */}
        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Assigned companies</CardTitle>
              <CardDescription>
                Who received this lead, and whether it reached them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  Not offered to any company yet.
                </p>
              ) : (
                assignments.map((a) => {
                  const company = companiesById.get(a.companyId);
                  if (!company) return null;
                  return (
                    <div key={a.companyId} className="flex items-center gap-3">
                      <MoverLogo mover={company.mover} size="sm" />
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/admin/companies/${a.companyId}`}
                          className="block truncate text-[13.5px] font-medium underline-offset-4 hover:underline"
                        >
                          {company.mover.name}
                        </Link>
                        <span className="tnum block text-xs text-muted-foreground">
                          {fmtDateTime(a.assignedAt)} ·{" "}
                          {a.feeUsd > 0 ? formatUsdPrecise(a.feeUsd) : "included in Pro"}
                        </span>
                      </span>
                      <Select
                        value={a.delivery}
                        onValueChange={(v) => {
                          dispatch({
                            type: "lead/delivery",
                            id: leadId,
                            companyId: a.companyId,
                            delivery: v as DeliveryStatus,
                          });
                          toast.success(`Delivery marked ${v}`);
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-28"
                          aria-label={`Delivery status for ${company.mover.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DELIVERY_META) as DeliveryStatus[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {DELIVERY_META[d].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })
              )}

              <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5" disabled={assignable.length === 0}>
                    <Plus aria-hidden />
                    {assignable.length === 0 ? "No eligible companies left" : "Assign to companies"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assign lead</DialogTitle>
                    <DialogDescription>
                      Active companies covering {cityLabel(lead.origin.cityCode)} to{" "}
                      {cityLabel(lead.destination.cityCode)}. Pay-per-lead partners are charged{" "}
                      {formatUsdPrecise(adminLead.feeUsd)} on assignment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {assignable.map((c) => (
                      <label
                        key={c.mover.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                      >
                        <Checkbox
                          checked={picked.has(c.mover.id)}
                          onCheckedChange={(checked) => {
                            setPicked((prevSet) => {
                              const next = new Set(prevSet);
                              if (checked === true) next.add(c.mover.id);
                              else next.delete(c.mover.id);
                              return next;
                            });
                          }}
                        />
                        <MoverLogo mover={c.mover} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">
                            {c.mover.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {c.mover.plan === "pro_unlimited" ? "Pro Unlimited" : "Pay per lead"} ·
                            response ~{c.mover.responseMins} min
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={confirmAssign} disabled={picked.size === 0}>
                      Assign {picked.size > 0 ? `(${picked.size})` : ""}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 before:absolute before:inset-y-1 before:start-[5px] before:w-px before:bg-border">
                {[...adminLead.statusHistory].reverse().map((event, i) => (
                  <li key={`${event.status}-${event.at}-${i}`} className="relative ps-6">
                    <span
                      className={`absolute start-0 top-1 size-2.5 rounded-full ring-2 ring-background ${LEAD_STATUS_META[event.status].dotClassName}`}
                      aria-hidden
                    />
                    <p className="text-[13px] font-medium">
                      {LEAD_STATUS_META[event.status].label}
                    </p>
                    <p className="tnum text-xs text-muted-foreground">
                      {fmtDateTime(event.at)} · {event.by}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
