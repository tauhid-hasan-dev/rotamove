"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Mail,
  MoveRight,
  Phone,
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
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n/provider";
import { cityLabel } from "@/lib/geo";
import { DELIVERY_META } from "@/lib/admin/labels";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";

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

  // `status` is deliberately not destructured: the pipeline stage is derived
  // from what carriers do with the lead, and showing it on this page invited
  // operators to treat it as something they maintain by hand.
  const { lead, source, assignments } = adminLead;

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

        {/* Right: who the lead went to, and how the mail landed */}
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
                      {/* Delivery reports itself as the mail is sent and
                          opened, so it reads as a badge. An operator setting
                          it by hand was recording an opinion, not an event. */}
                      <StatusBadge
                        meta={DELIVERY_META[a.delivery]}
                        label={dict.admin.status.delivery[a.delivery]}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
