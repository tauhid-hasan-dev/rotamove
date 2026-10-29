"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  FileWarning,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, StatusBadge } from "@/components/admin/bits";
import { useAdminPageTitle } from "@/components/admin/page-title";
import { PaginationBar, usePagination } from "@/components/admin/table-bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STATUS_META } from "@/lib/admin/labels";
import {
  APPLICATION_STATUSES,
  REQUESTABLE_DOCUMENTS,
  type ApplicationStatus,
  type PartnerApplication,
  type RequestableDocument,
} from "@/lib/partner-application";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The vetting queue.
 *
 * Unlike every other admin list this is not seeded client-side: the rows are
 * real submissions from the registration form, read from the partner store
 * through `/api/admin/applications`. Submit the form in one tab and the
 * application appears here — that is the demonstration.
 *
 * Three actions, and they are not equivalent. Approve and decline are
 * terminal and each sends the applicant a message they will act on, so both
 * go through a confirmation that states what is about to be sent. Decline
 * additionally requires a reason, because a decline with no reason is one the
 * applicant cannot answer and the reviewer cannot defend later. Requesting
 * documents is the common case and the only one that leaves the application
 * in the queue.
 */

type Filter = ApplicationStatus | "open" | "all";

/** What the queue opens on: everything still needing a human. */
const DEFAULT_FILTER: Filter = "open";

type Decision = "approve" | "decline" | "request_documents";

export function PendingView() {
  const { dict, t } = useI18n();
  const ax = dict.admin.pending;
  useAdminPageTitle(ax.title);

  const [applications, setApplications] = useState<PartnerApplication[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [acting, setActing] = useState<{ application: PartnerApplication; decision: Decision } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/applications", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { applications: PartnerApplication[] };
      setApplications(data.applications);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // First fetch goes through a zero-delay timer rather than running in the
    // effect body — state updates then happen in a callback, which is the
    // shape the react-hooks/set-state-in-effect rule insists on.
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (applications ?? []).filter((a) => {
      if (filter === "open") {
        if (a.status !== "pending" && a.status !== "awaiting_documents") return false;
      } else if (filter !== "all" && a.status !== filter) {
        return false;
      }
      if (!q) return true;
      return (
        a.legalName.toLowerCase().includes(q) ||
        (a.tradingName ?? "").toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q)
      );
    });
  }, [applications, query, filter]);

  const pagination = usePagination(rows, 10);
  const openCount = (applications ?? []).filter(
    (a) => a.status === "pending" || a.status === "awaiting_documents",
  ).length;

  return (
    <div className="animate-rise">
      {/* One row: the count, the search, the filter, the refresh. Same
          arrangement as the leads toolbar, so the two queues behave the
          same way under the hands. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="me-1 text-[13.5px] text-muted-foreground">
          {t.fill(ax.openCount, { n: t.number(openCount) })}
        </p>

        <div className="relative ms-auto">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ax.searchPlaceholder}
            aria-label={ax.searchPlaceholder}
            /* Sized to its own placeholder, which was being clipped at w-56
               in English and would be worse in German. */
            className="w-72 ps-8"
          />
        </div>

        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-60" aria-label={ax.statusFilterAria}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{ax.filterOpen}</SelectItem>
            <SelectItem value="all">{dict.admin.common.allStatuses}</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {dict.admin.status.application[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden />
          {dict.admin.unlocks.refresh}
        </Button>
      </div>

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
                <TableHead>{ax.colCompany}</TableHead>
                <TableHead>{ax.colContact}</TableHead>
                <TableHead>{ax.colReference}</TableHead>
                <TableHead>{ax.colSubmitted}</TableHead>
                <TableHead className="text-end">{ax.colScore}</TableHead>
                <TableHead>{ax.colStatus}</TableHead>
                <TableHead className="text-end">{ax.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageRows.map((a) => {
                const decided = a.status === "approved" || a.status === "declined";
                return (
                  <TableRow key={a.reference}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Building2 className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {a.tradingName || a.legalName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {a.city} · {t.fill(ax.fleet, {
                              lorries: t.number(a.lorries),
                              vans: t.number(a.vans),
                            })}
                          </span>
                        </span>
                      </span>
                    </TableCell>

                    <TableCell className="text-[13px]">
                      <span className="block truncate">{a.contactName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {a.email}
                      </span>
                    </TableCell>

                    <TableCell className="code whitespace-nowrap text-[12.5px]">
                      {a.reference}
                    </TableCell>

                    <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                      {t.dateShort(a.submittedAt)}
                    </TableCell>

                    {/* Internal only. Never leaves the console — an applicant
                        who can see the number will tune the form until it
                        goes up. */}
                    <TableCell className="tnum text-end text-[13px]">
                      {t.number(a.score)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        meta={APPLICATION_STATUS_META[a.status]}
                        label={dict.admin.status.application[a.status]}
                      />
                      {a.status === "awaiting_documents" && a.requestedDocuments?.length ? (
                        <span className="mt-1 block text-[11.5px] text-muted-foreground">
                          {t.fill(ax.docsOutstanding, {
                            n: t.number(a.requestedDocuments.length),
                          })}
                        </span>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      {decided ? (
                        <span className="block text-end text-[12.5px] text-muted-foreground">
                          {ax.noActions}
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1.5">
                          <IconAction
                            label={ax.requestDocs}
                            onClick={() => setActing({ application: a, decision: "request_documents" })}
                          >
                            <FileWarning className="size-3.5" aria-hidden />
                          </IconAction>
                          <IconAction
                            label={ax.approve}
                            tone="approve"
                            onClick={() => setActing({ application: a, decision: "approve" })}
                          >
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          </IconAction>
                          <IconAction
                            label={ax.decline}
                            tone="decline"
                            onClick={() => setActing({ application: a, decision: "decline" })}
                          >
                            <X className="size-3.5" strokeWidth={3} aria-hidden />
                          </IconAction>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {applications === null && !failed ? (
          <p className="flex items-center justify-center gap-2 py-14 text-[13.5px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {dict.admin.pending.loading}
          </p>
        ) : failed ? (
          <EmptyState
            title={dict.admin.pending.errorTitle}
            description={dict.admin.pending.errorBody}
            className="m-4"
            action={
              <Button variant="outline" onClick={refresh}>
                {dict.common.tryAgain}
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title={query || filter !== DEFAULT_FILTER ? ax.emptyFiltered : ax.emptyNone}
            description={
              query || filter !== DEFAULT_FILTER
                ? dict.admin.common.loosenFilters
                : ax.emptyNoneBody
            }
            icon={<ShieldCheck className="size-5" aria-hidden />}
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

      {acting && (
        <DecisionDialog
          application={acting.application}
          decision={acting.decision}
          onClose={() => setActing(null)}
          onDone={(next) => {
            setApplications((all) =>
              (all ?? []).map((a) => (a.reference === next.reference ? next : a)),
            );
            setActing(null);
          }}
        />
      )}
    </div>
  );
}

function IconAction({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "approve" | "decline";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
        tone === "approve" && "text-verify hover:border-verify/40 hover:bg-verify/10",
        tone === "decline" && "text-destructive hover:border-destructive/40 hover:bg-destructive/10",
        tone === "neutral" && "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The confirmation.
 *
 * Every branch names the address the message is going to, because that is the
 * fact the reviewer needs and cannot otherwise see from the row: an approval
 * is irreversible from here and the email goes out with it.
 */
function DecisionDialog({
  application,
  decision,
  onClose,
  onDone,
}: {
  application: PartnerApplication;
  decision: Decision;
  onClose: () => void;
  onDone: (next: PartnerApplication) => void;
}) {
  const { dict, t } = useI18n();
  const ax = dict.admin.pending;

  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState<RequestableDocument[]>(
    // Pre-ticked with whatever is already outstanding, so a reviewer chasing
    // a second time does not have to remember what they asked for.
    () => [...(application.requestedDocuments ?? [])] as RequestableDocument[],
  );
  const [working, setWorking] = useState(false);

  const ready =
    decision === "approve" ||
    (decision === "decline" && reason.trim().length >= 4) ||
    (decision === "request_documents" && documents.length > 0);

  const submit = async () => {
    if (!ready) return;
    setWorking(true);
    try {
      const response = await fetch("/api/admin/applications/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: application.reference,
          decision,
          ...(decision === "decline" ? { reason: reason.trim() } : {}),
          ...(decision === "request_documents"
            ? { documents, note: note.trim() || undefined }
            : {}),
        }),
      });
      if (!response.ok) throw new Error();
      const { application: next } = (await response.json()) as {
        application: PartnerApplication;
      };

      toast.success(
        decision === "approve"
          ? ax.toastApproved
          : decision === "decline"
            ? ax.toastDeclined
            : ax.toastRequested,
        { description: t.fill(ax.toastEmailed, { email: application.email }) },
      );
      onDone(next);
    } catch {
      toast.error(ax.toastFailed);
    } finally {
      setWorking(false);
    }
  };

  const title =
    decision === "approve" ? ax.approveTitle : decision === "decline" ? ax.declineTitle : ax.docsTitle;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t.fill(ax.forCompany, {
              company: application.tradingName || application.legalName,
              reference: application.reference,
            })}
          </DialogDescription>
        </DialogHeader>

        {decision === "approve" && (
          <p className="rounded-xl border bg-surface p-4 text-[13px] leading-relaxed text-muted-foreground">
            {ax.approveBody}
          </p>
        )}

        {decision === "decline" && (
          <div>
            <Label htmlFor="decline-reason" className="mb-2 block text-[13.5px]">
              {ax.reasonLabel}
            </Label>
            <Textarea
              id="decline-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ax.reasonPlaceholder}
              className="rounded-xl"
            />
            {/* Stated plainly: the reviewer's words are quoted verbatim to
                the applicant, so this is not an internal note. */}
            <p className="mt-2 text-[12px] text-muted-foreground">{ax.reasonHint}</p>
          </div>
        )}

        {decision === "request_documents" && (
          <div>
            <p className="text-[13.5px] font-medium">{ax.docsLabel}</p>
            <div className="mt-3 space-y-1">
              {REQUESTABLE_DOCUMENTS.map((doc) => {
                const checked = documents.includes(doc);
                return (
                  <label
                    key={doc}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setDocuments((list) =>
                          next ? [...list, doc] : list.filter((d) => d !== doc),
                        )
                      }
                      className="mt-0.5"
                    />
                    <span className="text-[13.5px] leading-snug">
                      {dict.admin.pending.documents[doc]}
                    </span>
                  </label>
                );
              })}
            </div>

            <Label htmlFor="docs-note" className="mb-2 mt-5 block text-[13.5px]">
              {ax.noteLabel}
            </Label>
            <Textarea
              id="docs-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={ax.notePlaceholder}
              className="rounded-xl"
            />
          </div>
        )}

        <p className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground">
          <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{t.fill(ax.willEmail, { email: application.email })}</span>
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={working}>
            {dict.admin.common.cancel}
          </Button>
          <Button
            onClick={submit}
            disabled={working || !ready}
            variant={decision === "decline" ? "destructive" : "default"}
          >
            {working && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {decision === "approve"
              ? ax.approve
              : decision === "decline"
                ? ax.decline
                : ax.sendRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
