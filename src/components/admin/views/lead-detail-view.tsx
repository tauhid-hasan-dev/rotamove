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
import { useI18n } from "@/i18n/provider";
import { cityLabel } from "@/lib/geo";
import { DELIVERY_META, LEAD_STATUS_META } from "@/lib/admin/labels";
import { eligibleCompanies } from "@/lib/admin/metrics";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  LEAD_STATUSES,
  type DeliveryStatus,
  type LeadStatus,
} from "@/lib/admin/types";

/** Extra-service ids; their labels live in dict.admin.leadDetail.extras. */
const EXTRA_IDS = [
  "packing",
  "unpacking",
  "dismantling",
  "insurance",
  "customsClearance",
  "cleaning",
] as const;

export function LeadDetailView({ leadId }: { leadId: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const { dict, t } = useI18n();
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
        title={dict.admin.leadDetail.notFoundTitle}
        description={t.fill(dict.admin.leadDetail.notFoundBody, { id: leadId })}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/leads">{dict.admin.leadDetail.backToLeads}</Link>
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
    toast.success(
      t.fill(dict.admin.leadDetail.toastStatus, {
        status: dict.admin.status.lead[next].toLowerCase(),
      }),
    );
  };

  const confirmAssign = () => {
    if (picked.size === 0) return;
    dispatch({ type: "lead/assign", id: leadId, companyIds: [...picked] });
    toast.success(
      picked.size === 1
        ? dict.admin.leadDetail.toastAssignedOne
        : t.fill(dict.admin.leadDetail.toastAssignedMany, { n: picked.size }),
    );
    setPicked(new Set());
    setAssignOpen(false);
  };

  const specials = Object.entries(lead.specialItems)
    .filter(([, v]) => v)
    .map(([k]) => dict.enums.specialItems[k as keyof typeof dict.enums.specialItems]);
  const extras: string[] = EXTRA_IDS.filter((k) => lead.extras[k]).map(
    (k) => dict.admin.leadDetail.extras[k],
  );
  if (lead.extras.storageWeeks > 0) {
    extras.push(t.fill(dict.admin.leadDetail.storageWeeks, { n: lead.extras.storageWeeks }));
  }

  const accessLabel = (id: string) =>
    dict.enums.access[id as keyof typeof dict.enums.access]?.label ?? id;

  return (
    <div className="animate-rise">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ms-2 gap-1.5 text-muted-foreground">
        <Link href="/admin/leads">
          <ArrowLeft aria-hidden />
          {dict.admin.leadDetail.allLeads}
        </Link>
      </Button>

      <PageHeader
        title={lead.contact.fullName}
        description={t.fill(dict.admin.leadDetail.headerDescription, {
          id: lead.id,
          date: t.dateLong(lead.createdAt),
        })}
        actions={
          <>
            {adminLead.duplicateOf ? (
              <Badge variant="outline" className="gap-1 border-dashed text-muted-foreground">
                <Copy aria-hidden />
                {t.fill(dict.admin.leadDetail.duplicateOf, { id: adminLead.duplicateOf })}
              </Badge>
            ) : null}
            <StatusBadge meta={LEAD_STATUS_META[status]} label={dict.admin.status.lead[status]} />
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger className="w-40" aria-label={dict.admin.leadDetail.changeStatusAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t.fill(dict.admin.leadDetail.markStatus, {
                      status: dict.admin.status.lead[s].toLowerCase(),
                    })}
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
                  {t.fill(dict.admin.leadDetail.routeSummary, {
                    origin: cityLabel(lead.origin.cityCode),
                    destination: cityLabel(lead.destination.cityCode),
                  })}
                </span>
              </CardTitle>
              <CardDescription>
                {dict.enums.moveType[lead.moveType]} ·{" "}
                {dict.enums.serviceLevel[lead.serviceLevel].label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <DetailRow label={dict.admin.leadDetail.moveDate}>
                  {t.dateLong(lead.moveDate)}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {dict.enums.flexibility[lead.flexibility]}
                  </span>
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.property}>
                  {dict.enums.propertySize[lead.propertySize].label} · {t.volume(lead.volumeM3)}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.originAccess}>
                  {accessLabel(lead.origin.access)}
                  {" · "}
                  {lead.origin.easyParking
                    ? dict.admin.leadDetail.easyParking
                    : dict.admin.leadDetail.difficultParking}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.destinationAccess}>
                  {accessLabel(lead.destination.access)}
                  {" · "}
                  {lead.destination.easyParking
                    ? dict.admin.leadDetail.easyParking
                    : dict.admin.leadDetail.difficultParking}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.specialItems}>
                  {specials.length > 0 ? specials.join(", ") : dict.admin.leadDetail.none}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.extraServices}>
                  {extras.length > 0 ? extras.join(", ") : dict.admin.leadDetail.none}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.preferredMatches}>
                  {lead.preferredMatches === null
                    ? dict.admin.leadDetail.allMatches
                    : lead.preferredMatches}
                </DetailRow>
                <DetailRow label={dict.admin.leadDetail.qualityScore}>
                  <span className="tnum">{adminLead.qualityScore} / 100</span>
                </DetailRow>
              </dl>
              {lead.notes ? (
                <>
                  <Separator className="my-3" />
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {dict.admin.leadDetail.customerNote}{" "}
                    </span>
                    {lead.notes}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>{dict.admin.leadDetail.contactTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-[13px]">
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  {lead.contact.email}
                  {lead.contact.emailVerified ? (
                    <BadgeCheck
                      className="size-4 text-verify"
                      aria-label={dict.admin.leadDetail.emailVerified}
                    />
                  ) : null}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  <span className="tnum">{lead.contact.phone}</span>
                  {lead.contact.phoneVerified ? (
                    <BadgeCheck
                      className="size-4 text-verify"
                      aria-label={dict.admin.leadDetail.phoneVerified}
                    />
                  ) : null}
                </p>
                <p className="text-muted-foreground">
                  {t.fill(dict.admin.leadDetail.prefersLine, {
                    channel:
                      lead.contact.channel === "all"
                        ? dict.admin.leadDetail.anyChannel
                        : lead.contact.channel,
                    locale: lead.contact.locale.toUpperCase(),
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>{dict.admin.leadDetail.acquisitionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <DetailRow label={dict.admin.leadDetail.channel}>
                    {dict.admin.labels.channel[source.channel]}
                  </DetailRow>
                  {source.campaignId ? (
                    <DetailRow label={dict.admin.leadDetail.campaign}>
                      {data.campaigns.find((c) => c.id === source.campaignId)?.name ??
                        source.campaignId}
                    </DetailRow>
                  ) : null}
                  <DetailRow label={dict.admin.leadDetail.landingPage}>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{source.landingPage}</span>
                  </DetailRow>
                  <DetailRow label={dict.admin.leadDetail.visitorCountry}>{source.country}</DetailRow>
                  <DetailRow label={dict.admin.leadDetail.leadFee}>{t.usd(adminLead.feeUsd)}</DetailRow>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Duplicates */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.leadDetail.duplicateCheckTitle}</CardTitle>
              <CardDescription>
                {t.fill(dict.admin.leadDetail.duplicateCheckDescription, {
                  email: lead.contact.email,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sameContact.length === 0 && !adminLead.duplicateOf ? (
                <p className="text-[13px] text-muted-foreground">
                  {dict.admin.leadDetail.noDuplicates}
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
                          {t.dateShort(other.lead.createdAt)} ·{" "}
                          {t.fill(dict.admin.leadDetail.routeSummary, {
                            origin: cityLabel(other.lead.origin.cityCode),
                            destination: cityLabel(other.lead.destination.cityCode),
                          })}
                        </span>
                      </span>
                      {adminLead.duplicateOf !== other.lead.id ? (
                        <ConfirmDialog
                          trigger={
                            <Button variant="outline" size="xs">
                              {dict.admin.leadDetail.markDuplicateButton}
                            </Button>
                          }
                          title={dict.admin.leadDetail.markDuplicateTitle}
                          description={t.fill(dict.admin.leadDetail.markDuplicateBody, {
                            id: lead.id,
                            otherId: other.lead.id,
                          })}
                          confirmLabel={dict.admin.leadDetail.markDuplicateConfirm}
                          onConfirm={() => {
                            dispatch({
                              type: "lead/duplicate",
                              id: leadId,
                              duplicateOf: other.lead.id,
                            });
                            toast.success(dict.admin.leadDetail.toastMarkedDuplicate);
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
                          {dict.admin.leadDetail.clearDuplicateButton}
                        </Button>
                      }
                      title={dict.admin.leadDetail.clearDuplicateTitle}
                      description={dict.admin.leadDetail.clearDuplicateBody}
                      confirmLabel={dict.admin.leadDetail.clearDuplicateConfirm}
                      onConfirm={() => {
                        dispatch({ type: "lead/duplicate", id: leadId, duplicateOf: undefined });
                        toast.success(dict.admin.leadDetail.toastDuplicateCleared);
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
              <CardTitle>{dict.admin.leadDetail.assignedTitle}</CardTitle>
              <CardDescription>{dict.admin.leadDetail.assignedDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  {dict.admin.leadDetail.notOffered}
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
                          {t.dateTime(a.assignedAt)} ·{" "}
                          {a.feeUsd > 0 ? t.usd(a.feeUsd) : dict.admin.leadDetail.includedInPro}
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
                          toast.success(
                            t.fill(dict.admin.leadDetail.toastDelivery, {
                              status: dict.admin.status.delivery[v as DeliveryStatus].toLowerCase(),
                            }),
                          );
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-28"
                          aria-label={t.fill(dict.admin.leadDetail.deliveryStatusAria, {
                            name: company.mover.name,
                          })}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DELIVERY_META) as DeliveryStatus[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {dict.admin.status.delivery[d]}
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
                    {assignable.length === 0
                      ? dict.admin.leadDetail.noEligibleCompanies
                      : dict.admin.leadDetail.assignToCompanies}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{dict.admin.leadDetail.assignTitle}</DialogTitle>
                    <DialogDescription>
                      {t.fill(dict.admin.leadDetail.assignDescription, {
                        origin: cityLabel(lead.origin.cityCode),
                        destination: cityLabel(lead.destination.cityCode),
                        fee: t.usd(adminLead.feeUsd),
                      })}
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
                            {dict.admin.labels.plan[c.mover.plan]} ·{" "}
                            {t.fill(dict.admin.leadDetail.responseTime, {
                              mins: c.mover.responseMins,
                            })}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">{dict.admin.leadDetail.cancel}</Button>
                    </DialogClose>
                    <Button onClick={confirmAssign} disabled={picked.size === 0}>
                      {dict.admin.leadDetail.assign}
                      {picked.size > 0 ? ` (${picked.size})` : ""}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{dict.admin.leadDetail.timelineTitle}</CardTitle>
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
                      {dict.admin.status.lead[event.status]}
                    </p>
                    <p className="tnum text-xs text-muted-foreground">
                      {t.dateTime(event.at)} · {event.by}
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
