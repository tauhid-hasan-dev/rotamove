"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { PANEL } from "@/components/partners/dashboard/surface";
import { Input } from "@/components/ui/input";
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
import { buildInvoicePdf, invoiceFilename, type InvoicePartner } from "@/lib/invoice-pdf";
import { PLAN_IDS } from "@/lib/plans";
import type { ArchivedInvoice, PartnerHistory } from "@/lib/partner-history";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type ArchiveView = "invoices" | "leads";

/** How many rows a page of the lead archive holds. */
const PAGE_SIZE = 50;

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

/**
 * The archive: everything older than a year.
 *
 * Deliberately a separate section rather than more rows on the billing page
 * or the lead board. Those two answer "what is happening now", and a year of
 * settled invoices scrolling underneath the open one buries the only line on
 * the page that needs acting on. Here the opposite is true — nothing is
 * actionable, so the whole surface can be a table you sort through.
 *
 * The cut-off is stated on screen, not implied. "Older than a year" is a
 * moving boundary, and a partner who cannot find last March needs to be able
 * to see that last March is still live rather than missing.
 */
export function ArchivePanel({
  view,
  history,
  partner,
}: {
  view: ArchiveView;
  history: PartnerHistory;
  /** Who the downloaded invoice is addressed to. */
  partner: InvoicePartner;
}) {
  return view === "invoices" ? (
    <InvoiceArchive history={history} partner={partner} />
  ) : (
    <LeadArchive history={history} />
  );
}

/* ---------------------------------------------------------------- shared -- */

/**
 * The lede and the filter row.
 *
 * No heading: the bar carries it. What is left is the sentence that says
 * what "archived" means on this particular day, which is the part a partner
 * has to read rather than the part they already clicked.
 */
function ArchiveHead({ lede, children }: { lede: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <p className="min-w-0 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
        {lede}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * The table's own scroll box.
 *
 * Seven columns of references, dates and money do not fit a phone, and a
 * page that scrolls sideways as a whole loses the sidebar off the edge. The
 * table sets a minimum width and this scrolls it.
 */
const TableScroll = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 -mx-2 overflow-x-auto px-2">{children}</div>
);

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="mt-5 rounded-xl border border-dashed p-10 text-center text-[13.5px] text-muted-foreground">
    {children}
  </p>
);

/**
 * Hand a generated file to the browser.
 *
 * The anchor is attached before it is clicked and the object URL is released
 * on the next tick rather than immediately: a detached anchor does nothing in
 * Firefox, and revoking the URL in the same turn as the click cancels the
 * download in Safari before it has read a byte.
 */
function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* -------------------------------------------------------------- invoices -- */

function InvoiceArchive({
  history,
  partner,
}: {
  history: PartnerHistory;
  partner: InvoicePartner;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const ax = pd.archive;
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [plan, setPlan] = useState("all");

  /*
   * Year and month match the **period**, not the issue date.
   *
   * An invoice for August is issued on 1 September, so filtering the two
   * dates differently — or filtering on the issue date at all — hands you
   * July's invoice when you ask for August. The period is what a partner
   * means by "the August invoice", and it is the column they are reading.
   */
  const invoices = useMemo(
    () =>
      history.invoices.filter(
        (i) =>
          (year === "all" || i.periodStart.startsWith(year)) &&
          (month === "all" || i.periodStart.slice(5, 7) === month) &&
          (plan === "all" || i.plan === plan),
      ),
    [history.invoices, year, month, plan],
  );

  const total = invoices.reduce((sum, i) => sum + i.amountEur, 0);
  const download = (invoice: ArchivedInvoice) =>
    downloadBytes(buildInvoicePdf(invoice, partner), invoiceFilename(invoice), "application/pdf");

  return (
    <div className="mt-4 lg:mt-0">
      <ArchiveHead lede={t.fill(ax.invoicesBody, { date: t.dateLong(history.archiveBefore) })}>
        {/* Every plan, not only the ones the archive happens to hold. An
            account that has never been on a plan still gets it offered, so
            the menu is the same three everywhere in the product. */}
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={ax.planAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.planAll}</SelectItem>
            {PLAN_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {pd.planNames[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={ax.yearAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.yearAll}</SelectItem>
            {history.years.map((y) => (
              <SelectItem key={y} value={y}>
                {t.year(Number(y))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={ax.monthAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.monthAll}</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {t.monthName(Number(m))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ArchiveHead>

      <section className={cn(PANEL, "mt-5 p-6")}>
        <p className="text-[13px] text-muted-foreground">
          {t.fill(ax.invoiceSummary, {
            invoices: t.count(ax.nInvoices, invoices.length),
            total: t.eur(Math.round(total * 100) / 100),
          })}
        </p>

        {invoices.length === 0 ? (
          <Empty>{ax.noMatch}</Empty>
        ) : (
          <TableScroll>
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{ax.colNo}</TableHead>
                  <TableHead>{ax.colRef}</TableHead>
                  <TableHead>{ax.colPeriod}</TableHead>
                  <TableHead>{ax.colIssued}</TableHead>
                  <TableHead>{ax.colPlan}</TableHead>
                  <TableHead className="text-end">{ax.colAmount}</TableHead>
                  <TableHead className="text-end">{ax.colStatus}</TableHead>
                  <TableHead className="text-end">{ax.colPdf}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice, i) => (
                  <TableRow key={invoice.ref}>
                    <TableCell className="text-[12.5px] text-muted-foreground tnum">
                      {t.number(i + 1)}
                    </TableCell>
                    <TableCell className="text-[12.5px] tnum">{invoice.ref}</TableCell>
                    <TableCell className="text-[12.5px]">
                      {t.monthShort(invoice.periodStart)}
                    </TableCell>
                    <TableCell className="text-[12.5px]">{t.dateLong(invoice.issued)}</TableCell>
                    <TableCell className="text-[12.5px]">{pd.planNames[invoice.plan]}</TableCell>
                    <TableCell className="text-end text-[12.5px] tnum">
                      {t.eur(invoice.amountEur)}
                    </TableCell>
                    <TableCell className="text-end">
                      <span className="rounded-full bg-verify/12 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-verify">
                        {ax.statusSettled}
                      </span>
                    </TableCell>
                    <TableCell className="text-end">
                      {/* Built in the browser from the row beside it, so the
                          total on the page is the total in the file. */}
                      <button
                        type="button"
                        onClick={() => download(invoice)}
                        aria-label={t.fill(ax.downloadInvoice, { ref: invoice.ref })}
                        className="inline-flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                      >
                        <Download className="size-3.5" aria-hidden />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroll>
        )}

        <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">{ax.footnote}</p>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- leads -- */

/**
 * Every archived lead, not a sample of them.
 *
 * The count under the filters is the point of this view: a partner asking
 * "how many came in August 2024" sets year and month and reads it off. That
 * only works if the list holds every lead, so it does — which is why this is
 * the one table in the product that pages.
 */
function LeadArchive({ history }: { history: PartnerHistory }) {
  const { dict, t } = useI18n();
  const ax = dict.partnerDashboard.archive;

  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("all");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [page, setPage] = useState(1);

  /** Any filter change puts you back on the first page of the new result. */
  const reset = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  const leads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return history.leads.filter((lead) => {
      if (year !== "all" && !lead.received.startsWith(year)) return false;
      if (month !== "all" && lead.received.slice(5, 7) !== month) return false;
      if (route !== "all" && lead.routeKey !== route) return false;
      // Matches the reference or the corridor, so the one box answers both
      // "find LD-202408-0137" and "find the Tashkent runs".
      if (
        needle &&
        !lead.ref.toLowerCase().includes(needle) &&
        !lead.routeLabel.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [history.leads, query, route, year, month]);

  const fees = leads.reduce((sum, l) => sum + l.feeEur, 0);
  const pageCount = Math.max(1, Math.ceil(leads.length / PAGE_SIZE));
  // Clamped rather than reset: a filter that shrinks the result while you are
  // on page nine should show you page one of it, not an empty page nine.
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const rows = leads.slice(start, start + PAGE_SIZE);

  return (
    <div className="mt-4 lg:mt-0">
      <ArchiveHead lede={t.fill(ax.leadsBody, { date: t.dateLong(history.archiveBefore) })}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
            placeholder={ax.searchLeads}
            aria-label={ax.searchLeads}
            className="w-[190px] ps-9"
          />
        </div>

        <Select value={route} onValueChange={reset(setRoute)}>
          <SelectTrigger className="w-[230px]">
            <SelectValue placeholder={ax.routeAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.routeAll}</SelectItem>
            {history.leadRoutes.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={reset(setYear)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={ax.yearAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.yearAll}</SelectItem>
            {history.years.map((y) => (
              <SelectItem key={y} value={y}>
                {t.year(Number(y))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={reset(setMonth)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={ax.monthAll} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{ax.monthAll}</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {t.monthName(Number(m))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ArchiveHead>

      <section className={cn(PANEL, "mt-5 p-6")}>
        <p className="text-[13px] text-muted-foreground">
          {t.fill(ax.leadSummary, {
            leads: t.count(ax.nLeads, leads.length),
            total: t.eur(Math.round(fees * 100) / 100),
          })}
        </p>

        {leads.length === 0 ? (
          <Empty>{ax.noMatch}</Empty>
        ) : (
          <>
            <TableScroll>
              {/* No fee column. What a lead cost is a billing fact, and
                  billing states it per period on the invoice beside this —
                  per row it was a column of near-identical small numbers
                  that never added up to anything on screen. The range total
                  is still in the line above the table. */}
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{ax.colNo}</TableHead>
                    <TableHead>{ax.colLeadId}</TableHead>
                    <TableHead>{ax.colRoute}</TableHead>
                    <TableHead>{ax.colReceived}</TableHead>
                    <TableHead className="text-end">{ax.colOpened}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((lead, i) => (
                    <TableRow key={lead.ref}>
                      {/* Position in the whole filtered set, not in the page:
                          row 51 is the 51st result, not the 1st of page two. */}
                      <TableCell className="text-[12.5px] text-muted-foreground tnum">
                        {t.number(start + i + 1)}
                      </TableCell>
                      <TableCell className="text-[12.5px] tnum">{lead.ref}</TableCell>
                      <TableCell className="text-[12.5px]">{lead.routeLabel}</TableCell>
                      <TableCell className="text-[12.5px]">{t.dateLong(lead.received)}</TableCell>
                      <TableCell className="text-end">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em]",
                            lead.opened
                              ? "bg-verify/12 text-verify"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {lead.opened ? ax.openedYes : ax.openedNo}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>

            {pageCount > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-[12.5px] text-muted-foreground tnum">
                  {t.fill(ax.showing, {
                    from: t.number(start + 1),
                    to: t.number(start + rows.length),
                    n: t.number(leads.length),
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <PageButton
                    label={ax.pagePrev}
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
                  </PageButton>
                  <span className="text-[12.5px] text-muted-foreground tnum">
                    {t.fill(ax.pageOf, {
                      page: t.number(current),
                      pages: t.number(pageCount),
                    })}
                  </span>
                  <PageButton
                    label={ax.pageNext}
                    disabled={current === pageCount}
                    onClick={() => setPage(current + 1)}
                  >
                    <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
                  </PageButton>
                </div>
              </div>
            )}
          </>
        )}

        <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">{ax.footnote}</p>
      </section>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
