import { PAGE_HEIGHT, writePdf, type PdfItem } from "@/lib/pdf";
import { PLAN_NAMES_EN, paysPerUnlock } from "@/lib/plans";
import type { ArchivedInvoice } from "@/lib/partner-history";

/**
 * A partner's archived invoice, as a downloadable document.
 *
 * **Written in English, on purpose.** The rest of the product follows the
 * reader's locale, and this does not, for two reasons. The base-14 fonts a
 * dependency-free PDF can use are WinAnsi-encoded, so Cyrillic and Arabic
 * come out as question marks — localising this would work for six of the
 * eight languages and visibly break for two. And an invoice is a document
 * that leaves the product: it gets filed, mailed to a bookkeeper, attached
 * to a tax return. `PLAN_NAMES_EN` exists for the same reason and is used
 * here. The *button* that produces it is translated; the paper is not.
 *
 * Everything on it comes from the archive record. Nothing is recomputed, so
 * the total on the page is the total in the table it was downloaded from.
 */

const LEFT = 56;
const RIGHT = 539;
/** Where the three numeric columns end. Right-aligned, so these are edges. */
const COL_QTY = 352;
const COL_UNIT = 444;

const date = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const month = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** `yyyy-mm-dd` is a calendar date, so it is read and written in one zone. */
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export interface InvoicePartner {
  /** Trading name the invoice is addressed to. */
  companyName: string;
  /** Account number, as shown in the dashboard. */
  partnerId: string;
  email: string;
}

export function invoiceFilename(invoice: ArchivedInvoice): string {
  return `rotamove-${invoice.ref}.pdf`;
}

export function buildInvoicePdf(invoice: ArchivedInvoice, partner: InvoicePartner): Uint8Array {
  const perUnlock = paysPerUnlock(invoice.plan);
  const items: PdfItem[] = [];
  const text = (
    x: number,
    y: number,
    value: string,
    opts: Partial<Omit<PdfItem & { kind: "text" }, "kind" | "x" | "y" | "text">> = {},
  ) => items.push({ kind: "text", x, y, text: value, ...opts });
  const rule = (y: number, gray = 0.8) =>
    items.push({ kind: "rule", x1: LEFT, x2: RIGHT, y, gray });

  /* ---- masthead ---- */
  let y = PAGE_HEIGHT - 72;
  text(LEFT, y, "Rotamove", { size: 20, font: "sansBold" });
  text(RIGHT, y, invoice.ref, { size: 12, align: "right" });
  y -= 14;
  text(LEFT, y, "Freight and relocation marketplace", { size: 9, gray: 0.45 });
  y -= 18;
  rule(y);

  /* ---- the two address blocks, side by side ---- */
  y -= 26;
  const blockTop = y;
  text(LEFT, y, "BILLED TO", { size: 8, gray: 0.45 });
  text(330, y, "INVOICE DETAILS", { size: 8, gray: 0.45 });

  y -= 15;
  text(LEFT, y, partner.companyName, { size: 11, font: "sansBold" });
  y -= 14;
  text(LEFT, y, partner.partnerId, { size: 10, gray: 0.35 });
  y -= 14;
  text(LEFT, y, partner.email, { size: 10, gray: 0.35 });

  let right = blockTop - 15;
  const detail = (label: string, value: string) => {
    text(330, right, label, { size: 10, gray: 0.45 });
    text(RIGHT, right, value, { size: 10, align: "right" });
    right -= 14;
  };
  detail("Issued", date.format(day(invoice.issued)));
  detail("Period", month.format(day(invoice.periodStart)));
  detail("Plan", PLAN_NAMES_EN[invoice.plan]);
  detail("Status", invoice.paid ? "Settled" : "Open");

  /* ---- line items ---- */
  y = Math.min(y, right) - 26;
  text(LEFT, y, "DESCRIPTION", { size: 8, gray: 0.45 });
  text(COL_QTY, y, "QTY", { size: 8, gray: 0.45, align: "right" });
  text(COL_UNIT, y, "UNIT", { size: 8, gray: 0.45, align: "right" });
  text(RIGHT, y, "AMOUNT", { size: 8, gray: 0.45, align: "right" });
  y -= 8;
  rule(y);

  y -= 20;
  if (perUnlock) {
    // The quantity is the thing a partner checks an invoice against, so it
    // is the count of leads they actually opened, not a derived figure.
    text(LEFT, y, "Lead unlocks", { size: 11 });
    text(COL_QTY, y, String(invoice.units), { size: 10, align: "right" });
    text(COL_UNIT, y, money.format(invoice.unitEur), { size: 10, align: "right" });
    text(RIGHT, y, money.format(invoice.amountEur), { size: 10, align: "right" });
    y -= 16;
    text(LEFT, y, `Billed on ${PLAN_NAMES_EN[invoice.plan]}, capped per lead`, {
      size: 9,
      gray: 0.45,
    });
  } else {
    text(LEFT, y, `${PLAN_NAMES_EN[invoice.plan]} subscription`, { size: 11 });
    text(COL_QTY, y, "1", { size: 10, align: "right" });
    text(COL_UNIT, y, money.format(invoice.amountEur), { size: 10, align: "right" });
    text(RIGHT, y, money.format(invoice.amountEur), { size: 10, align: "right" });
    y -= 16;
    text(LEFT, y, "Monthly fee. Every matched lead included.", { size: 9, gray: 0.45 });
  }

  /* ---- total ---- */
  y -= 18;
  rule(y);
  y -= 22;
  text(COL_UNIT, y, "Total", { size: 11, font: "sansBold" });
  text(RIGHT, y, money.format(invoice.amountEur), { size: 12, align: "right" });
  y -= 16;
  text(RIGHT, y, invoice.paid ? "Paid in full" : "Payment due", { size: 9, align: "right" });

  /* ---- footer ---- */
  rule(120, 0.88);
  text(LEFT, 102, "Platform fees only. Rotamove never takes a share of the job revenue.", {
    size: 9,
    gray: 0.45,
  });
  text(LEFT, 88, "Billed in EUR in all 53 partner countries.", { size: 9, gray: 0.45 });
  text(LEFT, 70, "Demo document, generated from the partner archive.", {
    size: 8,
    gray: 0.6,
  });

  return writePdf(items);
}
