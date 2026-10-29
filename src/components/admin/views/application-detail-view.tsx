"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  FileWarning,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/admin/bits";
import { DecisionDialog, type Decision } from "@/components/admin/decision-dialog";
import { useAdminPageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_META } from "@/lib/admin/labels";
import { COUNTRY_BY_ISO } from "@/lib/geo";
import {
  MEMBERSHIP_LABELS,
  type DocumentMeta,
  type Membership,
  type PartnerApplication,
  type RequestableDocument,
} from "@/lib/partner-application";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import type { RegionId } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * One application, in full.
 *
 * The queue shows six columns; a decision turns on things that do not fit in
 * six columns — what the cargo cover actually is, whether the licence was
 * attached, how long they have been trading, what a previous reviewer already
 * asked for. Before this page the only way to see any of that was to read the
 * JSON.
 *
 * Laid out in the order the applicant filled it in, which is also the order a
 * reviewer works through it: who they are, who we deal with, what they can
 * prove, what they can move, where they run.
 */

export function ApplicationDetailView({ reference }: { reference: string }) {
  const { dict, t } = useI18n();
  const ax = dict.admin.pending;
  const R = dict.register;

  const [application, setApplication] = useState<PartnerApplication | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [acting, setActing] = useState<Decision | null>(null);

  useAdminPageTitle(application ? application.tradingName || application.legalName : ax.title);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/applications/${encodeURIComponent(reference)}`,
        { cache: "no-store" },
      );
      if (response.status === 404) {
        setState("missing");
        return;
      }
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { application: PartnerApplication };
      setApplication(data.application);
      setState("ready");
    } catch {
      setState("failed");
    }
  }, [reference]);

  useEffect(() => {
    // Through a timer, so the state update lands in a callback rather than in
    // the effect body — the shape the react-hooks rules insist on.
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  if (state === "loading") {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-[13.5px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {ax.loading}
      </p>
    );
  }

  if (state !== "ready" || !application) {
    return (
      <EmptyState
        title={state === "missing" ? ax.notFoundTitle : ax.errorTitle}
        description={state === "missing" ? ax.notFoundBody : ax.errorBody}
        action={
          <Button variant="outline" asChild>
            <Link href="/admin/companies/pending">{ax.backToQueue}</Link>
          </Button>
        }
      />
    );
  }

  const a = application;
  const decided = a.status === "approved" || a.status === "declined";
  const country = COUNTRY_BY_ISO.get(a.countryIso);
  const sizeLabel: Record<string, string> = {
    micro: R.sizeMicro,
    small: R.sizeSmall,
    medium: R.sizeMedium,
    large: R.sizeLarge,
  };
  const ownLabel: Record<string, string> = {
    owned: R.ownOwned,
    leased: R.ownLeased,
    mixed: R.ownMixed,
    subcontracted: R.ownSubcontracted,
  };
  const availLabel: Record<string, string> = {
    immediate: R.availImmediate,
    within_week: R.availWeek,
    within_month: R.availMonth,
  };
  const accreditations = a.memberships.filter((m) => m !== "none");

  return (
    <div className="animate-rise">
      <Link
        href="/admin/companies/pending"
        className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
        {ax.backToQueue}
      </Link>

      {/* header ---------------------------------------------------- */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[22px] tracking-[-0.03em]">
              {a.tradingName || a.legalName}
            </h2>
            <StatusBadge
              meta={APPLICATION_STATUS_META[a.status]}
              label={dict.admin.status.application[a.status]}
            />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="code">{a.reference}</span>
            <span>
              {t.fill(ax.submittedOn, { date: t.dateLong(a.submittedAt) })}
            </span>
            {/* Internal only — never shown to an applicant. */}
            <span className="tnum">{t.fill(ax.scoreOf, { n: t.number(a.score) })}</span>
          </p>
        </div>

        {!decided && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setActing("request_documents")} className="gap-2">
              <FileWarning className="size-3.5" aria-hidden />
              {ax.requestDocs}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActing("decline")}
              className="gap-2 text-destructive hover:bg-destructive/10"
            >
              <X className="size-3.5" strokeWidth={3} aria-hidden />
              {ax.decline}
            </Button>
            <Button onClick={() => setActing("approve")} className="gap-2">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
              {ax.approve}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title={R.s1}>
            <Row label={R.legalName} value={a.legalName} />
            <Row label={R.tradingName} value={a.tradingName || "—"} />
            <Row label={R.country} value={country?.name ?? a.countryIso} />
            <Row label={R.city} value={a.city} />
            {/* `t.year`, not `t.number` — a grouped year reads "2,011". */}
            <Row label={R.foundedYear} value={t.year(a.foundedYear)} />
            <Row
              label={R.website}
              value={
                a.website ? (
                  /* `rel` on an outbound link to an unvetted applicant's site:
                     this page is behind the console and the referrer is not
                     theirs to have. */
                  <a
                    href={a.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-brand decoration-2 underline-offset-4"
                  >
                    {a.website}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Row label={R.size} value={sizeLabel[a.size] ?? a.size} />
          </Section>

          <Section title={R.s2}>
            <Row label={R.contactName} value={a.contactName} />
            <Row label={R.contactRole} value={a.contactRole} />
            <Row
              label={R.email}
              value={
                <span className="inline-flex items-center gap-2">
                  <a href={`mailto:${a.email}`} className="underline underline-offset-4">
                    {a.email}
                  </a>
                  {a.emailVerified && <Confirmed label={dict.verify.verified} />}
                </span>
              }
            />
            <Row
              label={R.phone}
              value={
                <span className="inline-flex items-center gap-2 tnum">
                  {a.phone}
                  {a.phoneVerified && <Confirmed label={dict.verify.verified} />}
                </span>
              }
            />
            <Row label={R.altPhone} value={a.altPhone || "—"} />
            <Row label={R.languages} value={a.languages.join(", ").toUpperCase()} />
          </Section>

          <Section title={R.s3}>
            <Row label={R.registrationNumber} value={a.registrationNumber} />
            <Row label={R.vatNumber} value={a.vatNumber || "—"} />
            <Row label={R.transportLicence} value={a.transportLicence} />
            {/* `€{number}` rather than a currency formatter, matching how
                the application form states the same two figures back to the
                applicant — the reviewer and the carrier should be reading
                the same string. */}
            <Row label={R.cargoCover} value={<span className="tnum">€{t.number(a.cargoCoverEur)}</span>} />
            <Row
              label={R.liabilityCover}
              value={<span className="tnum">€{t.number(a.liabilityCoverEur)}</span>}
            />
            <Row
              label={R.memberships}
              value={
                accreditations.length
                  ? accreditations.map((m) => MEMBERSHIP_LABELS[m as Membership]).join(" · ")
                  : "—"
              }
            />
          </Section>

          <Section title={R.s4}>
            <Row label={R.lorries} value={t.number(a.lorries)} />
            <Row label={R.vans} value={t.number(a.vans)} />
            <Row label={R.ownership} value={ownLabel[a.ownership] ?? a.ownership} />
            <Row label={R.capacity} value={t.volume(a.weeklyCapacityM3)} />
            <Row
              label={R.modes}
              value={a.modes.map((m) => dict.enums.modes[m as "road"].label).join(" · ")}
            />
            <Row
              label={R.services}
              value={
                /* `filters.services`, the same short labels the application
                   form offered — not `moverProfile.services`, which are the
                   long customer-facing descriptions. */
                a.services.length
                  ? a.services.map((s) => dict.filters.services[s as "packing"]).join(" · ")
                  : "—"
              }
            />
          </Section>

          <Section title={R.s5}>
            <Row
              label={R.regions}
              value={a.regions.map((r) => regionName(dict, r as RegionId)).join(" · ")}
            />
            <Row label={R.availability} value={availLabel[a.availability] ?? a.availability} />
            <Row label={R.notes} value={a.notes || "—"} />
            <Row label={R.s6} value={dict.partnerDashboard.planNames[a.plan]} />
          </Section>
        </div>

        {/* documents + history ------------------------------------- */}
        <div className="space-y-4">
          <Section title={R.documents}>
            <div className="space-y-2">
              <DocumentRow label={R.docRegistration} doc={a.registrationDoc} />
              <DocumentRow label={R.docInsurance} doc={a.insuranceDoc} />
              <DocumentRow label={R.docLicence} doc={a.licenceDoc ?? null} />
            </div>
            {/* The honest note. The bytes were validated in the browser and
                deliberately never transmitted, so there is nothing to open —
                and a download button that did nothing would be worse than
                saying so. */}
            <p className="mt-3 rounded-lg border border-dashed bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
              {R.docDemoNote}
            </p>
          </Section>

          {a.status === "awaiting_documents" && a.requestedDocuments?.length ? (
            <Section title={ax.outstandingTitle}>
              <ul className="space-y-1.5">
                {a.requestedDocuments.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-[13px] leading-snug">
                    <FileWarning className="mt-0.5 size-3.5 shrink-0 text-lastcall-accent" aria-hidden />
                    {ax.documents[d as RequestableDocument] ?? d}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title={ax.historyTitle}>
            {a.review.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{ax.historyEmpty}</p>
            ) : (
              <ol className="space-y-3">
                {[...a.review].reverse().map((event, i) => (
                  <li key={`${event.at}-${i}`} className="border-s-2 border-brand/30 ps-3">
                    <p className="text-[13px] font-medium">
                      {dict.admin.status.application[event.status]}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground tnum">
                      {t.dateLong(event.at)} · {event.by}
                    </p>
                    {event.note && (
                      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                        {event.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      </div>

      {acting && (
        <DecisionDialog
          application={a}
          decision={acting}
          onClose={() => setActing(null)}
          onDone={(next) => {
            setApplication(next);
            setActing(null);
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border bg-card p-5 shadow-soft">
      <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * A label/value pair on one line.
 *
 * `sm:grid-cols-[180px_1fr]` rather than a `<dl>` with floats: the labels are
 * a ragged set of lengths and a fixed first column is what stops the values
 * from stepping in and out as the eye runs down them.
 */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-[13.5px]">{value}</dd>
    </div>
  );
}

function Confirmed({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-verify">
      <Check className="size-3" strokeWidth={3} aria-hidden />
      {label}
    </span>
  );
}

function DocumentRow({ label, doc }: { label: string; doc: DocumentMeta | null }) {
  const { dict, t } = useI18n();
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
        doc ? "bg-surface" : "border-dashed",
      )}
    >
      {doc ? (
        <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
      ) : (
        <Paperclip className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
        {doc ? (
          <>
            <p className="mt-0.5 truncate text-[13px] font-medium">{doc.name}</p>
            {/* KB via `t.number`, the same way the upload field reports it
                back to the applicant. */}
            <p className="mt-0.5 text-[11.5px] text-muted-foreground tnum">
              {t.fill(dict.admin.pending.docMeta, {
                size: `${t.number(Math.max(1, Math.round(doc.sizeBytes / 1024)))} KB`,
                type: doc.mimeType.replace(/^(application|image)\//, "").toUpperCase(),
              })}
            </p>
          </>
        ) : (
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {dict.admin.pending.docMissing}
          </p>
        )}
      </div>
    </div>
  );
}
