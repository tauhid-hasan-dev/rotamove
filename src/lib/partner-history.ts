import { cityCountry, getCity } from "@/lib/geo";
import {
  AVG_LEAD_FEE_EUR,
  LEAD_FEE_CAP_EUR,
  LEAD_FEE_FLOOR_EUR,
  PRO_MONTHLY_EUR,
  paysPerUnlock,
} from "@/lib/plans";
import { DEMO_LANES } from "@/lib/demo-leads";
import { createRng } from "@/lib/rand";
import type { PlanId } from "@/lib/types";

/**
 * A partner's own history: what the board sent them before today.
 *
 * The live board (`demo-leads`) is what is in front of a partner right now.
 * This is the record behind it — the daily lead counts the trend chart draws,
 * and the invoices and leads old enough to have been filed away. Same
 * deterministic seeding as the board, for the same reason: the server and the
 * client have to produce the same page.
 *
 * Nothing here claims an outcome. The platform knows how many enquiries it
 * matched to a partner, which of them the partner opened, and what it charged
 * for them. It does not know whether any of them turned into a job, so there
 * is no won/lost column and there is not going to be one.
 */

const DAY_MS = 86_400_000;

/**
 * Calendar maths in UTC, deliberately.
 *
 * `now` is a server timestamp that gets rendered on both sides of hydration.
 * Read in local time it names a different day either side of midnight for a
 * reader east or west of the server, and React then reports every label on
 * the axis as a mismatch. UTC is the one clock the two agree on, and a
 * history chart does not care which side of midnight a boundary falls.
 *
 * Everything below therefore talks in `yyyy-mm-dd`, and every bucket key is
 * taken by slicing that string rather than by going back through a Date.
 */
const isoDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** How far back the dashboard keeps anything: the year in progress plus three. */
const HISTORY_DAYS = 365 * 4;

/** A record is archived once it is older than this. */
export const ARCHIVE_AFTER_DAYS = 365;

/* ------------------------------------------------------------ daily flow -- */

export interface PartnerDay {
  /** `yyyy-mm-dd`, UTC. */
  date: string;
  /** Enquiries matched to this partner that day. */
  leads: number;
  /** How many of them they opened. On Pro every lead arrives open. */
  opened: number;
}

/**
 * Leads per month on each plan today, which the history is scaled against.
 *
 * Taken from the same figures `generatePartnerMetrics` reports, so the last
 * month of the chart agrees with the "Leads this month" card above it.
 */
const MONTHLY_NOW: Record<PlanId, number> = {
  pro_unlimited: 312,
  pay_per_lead: 47,
  pay_per_seen: 54,
};

/** Share of the board each plan opens. Pro opens everything by definition. */
const OPEN_RATE: Record<PlanId, number> = {
  pro_unlimited: 1,
  pay_per_lead: 0.66,
  pay_per_seen: 0.35,
};

/**
 * Seasonality, by calendar month.
 *
 * Households move in summer and around the start of the school year, and
 * almost nobody moves between Christmas and February. A flat series would be
 * the one shape a real lead board never has.
 */
const SEASON = [0.74, 0.78, 0.9, 1.02, 1.14, 1.3, 1.34, 1.24, 1.12, 0.98, 0.84, 0.7];

export function generatePartnerDays(plan: PlanId, now: number): PartnerDay[] {
  const base = MONTHLY_NOW[plan] / 30;
  const rate = OPEN_RATE[plan];
  const today = Math.floor(now / DAY_MS) * DAY_MS;

  return Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const ageDays = HISTORY_DAYS - 1 - i;
    const ms = today - ageDays * DAY_MS;
    const date = isoDay(ms);
    const rng = createRng("history", plan, date);

    // The account has grown, so further back is thinner. Capped so three
    // years ago is quieter than today rather than empty.
    const growth = 1 - Math.min(0.5, (ageDays / 365) * 0.15);
    const season = SEASON[Number(date.slice(5, 7)) - 1];
    // Enquiries arrive on working days. Saturday and Sunday are a trickle.
    const weekday = new Date(ms).getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.4 : 1.12;

    const leads = Math.max(0, Math.round(base * growth * season * weekend * rng.range(0.55, 1.5)));
    return {
      date,
      leads,
      // Never more than arrived — the ratio is a rate, not a count, and
      // rounding it up on a two-lead day produced three opens out of two.
      opened: Math.min(leads, Math.round(leads * rate * rng.range(0.8, 1.15))),
    };
  });
}

/* --------------------------------------------------------------- buckets -- */

export type TrendGrain = "day" | "month" | "quarter" | "year";

export const TREND_GRAINS: readonly TrendGrain[] = ["day", "month", "quarter", "year"];

/** How many buckets each grain shows. */
export const GRAIN_BUCKETS: Record<TrendGrain, number> = {
  day: 30,
  month: 12,
  quarter: 8,
  year: 4,
};

export interface TrendPoint {
  /** Stable React key and bucket identity: `2026-07`, `2026-Q3`, `2026`. */
  key: string;
  /** First day of the bucket, `yyyy-mm-dd` — what the axis label formats. */
  start: string;
  /** Calendar quarter, 1–4. Only set when the grain is `quarter`. */
  quarter?: number;
  leads: number;
  opened: number;
}

/** Which bucket a `yyyy-mm-dd` falls in, and where that bucket starts. */
function bucketOf(date: string, grain: TrendGrain): { key: string; start: string; quarter?: number } {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));
  switch (grain) {
    case "day":
      return { key: date, start: date };
    case "month":
      return { key: date.slice(0, 7), start: `${date.slice(0, 7)}-01` };
    case "quarter": {
      const quarter = Math.floor((month - 1) / 3) + 1;
      const first = `${(quarter - 1) * 3 + 1}`.padStart(2, "0");
      return { key: `${year}-Q${quarter}`, start: `${year}-${first}-01`, quarter };
    }
    case "year":
      return { key: year, start: `${year}-01-01` };
  }
}

/** Roll the daily series up to a grain, oldest first, keeping every bucket. */
export function bucketDays(days: PartnerDay[], grain: TrendGrain): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();
  for (const day of days) {
    const { key, start, quarter } = bucketOf(day.date, grain);
    const point = buckets.get(key);
    if (point) {
      point.leads += day.leads;
      point.opened += day.opened;
    } else {
      buckets.set(key, { key, start, quarter, leads: day.leads, opened: day.opened });
    }
  }
  return [...buckets.values()];
}

/**
 * What the chart draws: the most recent buckets at this grain.
 *
 * Aggregating the whole series and slicing the tail, rather than slicing a
 * window of days first: a 365-day window ends on a half-finished month at
 * the far end, and a chart whose oldest bar is a third of a month tall
 * invites the reader to conclude the business collapsed and recovered.
 */
export function aggregateDays(days: PartnerDay[], grain: TrendGrain): TrendPoint[] {
  return bucketDays(days, grain).slice(-GRAIN_BUCKETS[grain]);
}

/* --------------------------------------------------------------- archive -- */

export interface ArchivedInvoice {
  ref: string;
  /** Month the invoice covers, `yyyy-mm-dd` on the 1st. */
  periodStart: string;
  /** The day it was issued: the first of the month after the period. */
  issued: string;
  amountEur: number;
  paid: boolean;
}

export interface ArchivedLead {
  id: string;
  routeLabel: string;
  /** `yyyy-mm-dd`. */
  received: string;
  /** What the partner was charged. Zero on Pro, where it is included. */
  feeEur: number;
  opened: boolean;
}

export interface PartnerHistory {
  days: PartnerDay[];
  /**
   * The archive cut: a record dated before this is filed, on or after it is
   * still live. Exposed so the views can say what "older than a year" means
   * on this particular day rather than each deciding for itself.
   */
  archiveBefore: string;
  invoices: ArchivedInvoice[];
  leads: ArchivedLead[];
  /** Every year the archive holds something for, newest first. */
  years: string[];
}

/** First of the month, `n` whole months before the month `from` falls in. */
function monthStart(from: string, back: number): string {
  const year = Number(from.slice(0, 4));
  const month = Number(from.slice(5, 7)) - 1 - back;
  const y = year + Math.floor(month / 12);
  const m = `${((month % 12) + 12) % 12 + 1}`.padStart(2, "0");
  return `${y}-${m}-01`;
}

/**
 * Everything the dashboard needs about a partner's past, in one pass.
 *
 * One call rather than four so the chart and the two archive views are built
 * from the same daily series: an archived invoice for March states the fees
 * for the leads the chart shows in March, instead of being a second
 * invention that happens to sit on the same screen.
 */
export function generatePartnerHistory(plan: PlanId, now: number): PartnerHistory {
  const days = generatePartnerDays(plan, now);
  const archiveBefore = isoDay(Math.floor(now / DAY_MS) * DAY_MS - ARCHIVE_AFTER_DAYS * DAY_MS);
  const today = isoDay(now);
  const billed = paysPerUnlock(plan);

  // Every month, not the twelve the chart shows — an invoice from three years
  // ago has to find its own period in here.
  const byMonth = new Map(bucketDays(days, "month").map((m) => [m.key, m]));

  /* ----- invoices: one a month, issued the day the period closed ----- */

  const invoices: ArchivedInvoice[] = [];
  // Month 1 back is the earliest that can have closed; month 48 is the far
  // edge of what the history holds.
  for (let back = 1; back <= 47; back++) {
    const periodStart = monthStart(today, back);
    const issued = monthStart(today, back - 1);
    if (issued >= archiveBefore) continue;

    const point = byMonth.get(periodStart.slice(0, 7));
    const amountEur = billed
      ? Math.round((point?.opened ?? 0) * AVG_LEAD_FEE_EUR * 100) / 100
      : PRO_MONTHLY_EUR;
    // A period with nothing opened on a per-unlock plan was never invoiced.
    if (amountEur <= 0) continue;

    invoices.push({
      // Descending with age, the way a real sequence runs, and unique because
      // `back` is: two periods can share a year but never a number.
      ref: `INV-${periodStart.slice(0, 4)}-${String(400 - back * 7).padStart(4, "0")}`,
      periodStart,
      issued,
      amountEur,
      // Everything this old has been settled. The one unpaid invoice a
      // partner can have is the open one, and that is not in the archive.
      paid: true,
    });
  }

  /* ----- leads: a sample of what each archived month actually sent ----- */

  const leads: ArchivedLead[] = [];
  for (const day of days) {
    if (day.date >= archiveBefore || day.leads === 0) continue;
    const rng = createRng("archive-lead", plan, day.date);
    // One row per lead would be thousands; this keeps a readable sample of
    // each month while staying consistent with that day's totals.
    if (!rng.bool(0.1)) continue;

    const [fromCode, toCode] = rng.pick(DEMO_LANES);
    const from = getCity(fromCode);
    const to = getCity(toCode);
    if (!from || !to) continue;

    const opened = rng.next() < day.opened / day.leads;
    leads.push({
      id: `ld_arc_${day.date}_${leads.length}`,
      routeLabel: `${from.name}, ${cityCountry(from).iso} → ${to.name}, ${cityCountry(to).iso}`,
      received: day.date,
      feeEur:
        billed && opened
          ? Math.round(rng.gauss(LEAD_FEE_FLOOR_EUR, LEAD_FEE_CAP_EUR) * 100) / 100
          : 0,
      opened,
    });
  }

  // Newest first in both tables. The invoice loop already counts backwards
  // from the cut-off, so only the leads — walked forward through `days` —
  // need turning round.
  leads.reverse();

  const years = [
    ...new Set([
      ...invoices.map((i) => i.issued.slice(0, 4)),
      ...leads.map((l) => l.received.slice(0, 4)),
    ]),
  ].sort((a, b) => b.localeCompare(a));

  return { days, archiveBefore, invoices, leads, years };
}
