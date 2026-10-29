/**
 * Calendar maths.
 *
 * Everything here works in **local** time and talks in `yyyy-mm-dd` strings,
 * which is the format the rest of the product already uses for dates.
 *
 * The local part matters: `new Date().toISOString().slice(0, 10)` gives the
 * *UTC* date, so a visitor in Istanbul at 01:00 would be told that today is
 * yesterday — and a calendar that greys out today is a calendar nobody trusts.
 */

/** `yyyy-mm-dd` for a local Date, with no timezone round-trip. */
export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses `yyyy-mm-dd` into a local Date at midnight. */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const todayLocalIso = (): string => toIso(new Date());

export function addDaysIso(iso: string, days: number): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  const ms = fromIso(b).getTime() - fromIso(a).getTime();
  return Math.round(ms / 86_400_000);
}

export const isSameDay = (a: string | null, b: string | null) => Boolean(a && b && a === b);

export function isWithin(iso: string, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  return iso > start && iso < end;
}

/**
 * Which weekday a locale starts its week on, 1 = Monday … 7 = Sunday.
 *
 * `getWeekInfo` is the right answer and is widely supported; Monday is the
 * fallback because every locale this product ships bar Arabic uses it.
 */
export function firstWeekday(bcp47: string): number {
  try {
    const locale = new Intl.Locale(bcp47) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    return info?.firstDay ?? 1;
  } catch {
    return 1;
  }
}

/** JS `getDay()` is 0 = Sunday; CLDR is 7 = Sunday. */
const cldrDay = (date: Date) => (date.getDay() === 0 ? 7 : date.getDay());

export interface MonthGrid {
  /** First of the month, local. */
  month: Date;
  /** Six rows of seven, padded with nulls outside the month. */
  weeks: Array<Array<string | null>>;
}

/**
 * A month as a padded 6×7 grid.
 *
 * Fixed at six rows so the popover does not change height between months —
 * a calendar that resizes as you page through it is unpleasant to use.
 */
export function monthGrid(year: number, month: number, weekStart: number): MonthGrid {
  const first = new Date(year, month, 1);
  const lead = (cldrDay(first) - weekStart + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<string | null> = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(year, month, i + 1))),
  ];
  while (cells.length < 42) cells.push(null);

  return {
    month: first,
    weeks: Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7)),
  };
}

/**
 * Weekday headers in the locale's own order: a narrow initial plus the full
 * name for the tooltip.
 *
 * `weekday: "narrow"` rather than `"short"` truncated by hand. Every Arabic
 * short name begins with the definite article — الأحد, الاثنين, الثلاثاء —
 * so taking the first two characters produced seven identical "ال" columns.
 * Narrow is the form CLDR publishes for exactly this purpose.
 */
export function weekdayHeaders(bcp47: string, weekStart: number): Array<{ narrow: string; long: string }> {
  const narrow = new Intl.DateTimeFormat(bcp47, { weekday: "narrow" });
  const long = new Intl.DateTimeFormat(bcp47, { weekday: "long" });
  // 2024-01-01 was a Monday, so it anchors the CLDR numbering cleanly.
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + ((weekStart - 1 + i) % 7));
    return { narrow: narrow.format(date), long: long.format(date) };
  });
}

export const monthLabel = (bcp47: string, date: Date) =>
  new Intl.DateTimeFormat(bcp47, { month: "long", year: "numeric" }).format(date);

/** Just the month name, for a month menu where the year is chosen separately. */
export const monthName = (bcp47: string, month: number) =>
  new Intl.DateTimeFormat(bcp47, { month: "long" }).format(new Date(2000, month, 1));

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}
