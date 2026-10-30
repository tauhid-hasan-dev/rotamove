"use client";

import { useMemo, useState } from "react";
import { PANEL } from "@/components/partners/dashboard/surface";
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
import type { PartnerHistory } from "@/lib/partner-history";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type ArchiveView = "invoices" | "leads";

/**
 * The archive: everything older than a year.
 *
 * Deliberately a separate section rather than more rows on the billing page
 * or the lead board. Those two answer "what is happening now", and a year of
 * settled invoices scrolling underneath the open one buries the only line on
 * the page that needs acting on. Here the opposite is true — nothing is
 * actionable, so the whole surface can be a table you sort through by year.
 *
 * The cut-off is stated on screen, not implied. "Older than a year" is a
 * moving boundary, and a partner who cannot find last March needs to be able
 * to see that last March is still live rather than missing.
 */
export function ArchivePanel({
  view,
  history,
}: {
  view: ArchiveView;
  history: PartnerHistory;
}) {
  const { dict, t } = useI18n();
  const ax = dict.partnerDashboard.archive;
  const [year, setYear] = useState("all");

  const invoices = useMemo(
    () => history.invoices.filter((i) => year === "all" || i.issued.startsWith(year)),
    [history.invoices, year],
  );
  const leads = useMemo(
    () => history.leads.filter((l) => year === "all" || l.received.startsWith(year)),
    [history.leads, year],
  );

  const invoiceTotal = invoices.reduce((sum, i) => sum + i.amountEur, 0);
  const feeTotal = leads.reduce((sum, l) => sum + l.feeEur, 0);
  const isInvoices = view === "invoices";

  return (
    <div className="mt-4 lg:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-[20px] tracking-[-0.03em]">
            {isInvoices ? ax.invoicesTitle : ax.leadsTitle}
          </h2>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
            {t.fill(isInvoices ? ax.invoicesBody : ax.leadsBody, {
              date: t.dateLong(history.archiveBefore),
            })}
          </p>
        </div>

        {/* The year is the only filter worth having here. A date range on a
            set that is already bounded at both ends is two more controls to
            answer a question nobody asks of an archive. */}
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[150px]">
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
      </div>

      <section className={cn(PANEL, "mt-5 p-6")}>
        <p className="text-[13px] text-muted-foreground">
          {isInvoices
            ? t.fill(ax.invoiceSummary, {
                n: t.number(invoices.length),
                total: t.eur(Math.round(invoiceTotal * 100) / 100),
              })
            : t.fill(ax.leadSummary, {
                n: t.number(leads.length),
                total: t.eur(Math.round(feeTotal * 100) / 100),
              })}
        </p>

        {(isInvoices ? invoices.length : leads.length) === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed p-10 text-center text-[13.5px] text-muted-foreground">
            {isInvoices ? ax.emptyInvoices : ax.emptyLeads}
          </p>
        ) : (
          /* The table sets its own minimum width and scrolls inside this
             box, so four columns of dates and money do not push the page
             sideways on a phone. */
          <div className="mt-5 -mx-2 overflow-x-auto px-2">
            {isInvoices ? (
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{ax.colRef}</TableHead>
                    <TableHead>{ax.colPeriod}</TableHead>
                    <TableHead>{ax.colIssued}</TableHead>
                    <TableHead className="text-end">{ax.colAmount}</TableHead>
                    <TableHead className="text-end">{ax.colStatus}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.ref}>
                      <TableCell className="text-[12.5px] tnum">{invoice.ref}</TableCell>
                      <TableCell className="text-[12.5px]">
                        {t.monthShort(invoice.periodStart)}
                      </TableCell>
                      <TableCell className="text-[12.5px]">
                        {t.dateLong(invoice.issued)}
                      </TableCell>
                      <TableCell className="text-end text-[12.5px] tnum">
                        {t.eur(invoice.amountEur)}
                      </TableCell>
                      <TableCell className="text-end">
                        <span className="rounded-full bg-verify/12 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-verify">
                          {ax.statusSettled}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{ax.colRoute}</TableHead>
                    <TableHead>{ax.colReceived}</TableHead>
                    <TableHead className="text-end">{ax.colFee}</TableHead>
                    <TableHead className="text-end">{ax.colOpened}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-[12.5px]">{lead.routeLabel}</TableCell>
                      <TableCell className="text-[12.5px]">{t.dateLong(lead.received)}</TableCell>
                      <TableCell className="text-end text-[12.5px] tnum">
                        {lead.feeEur > 0 ? t.eur(lead.feeEur) : "—"}
                      </TableCell>
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
            )}
          </div>
        )}

        <p className="mt-5 text-[12.5px] leading-relaxed text-muted-foreground">
          {ax.footnote}
        </p>
      </section>
    </div>
  );
}
