import { intlLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { plural } from "@/i18n/plural";

/**
 * Locale-aware formatting.
 *
 * Everything user-facing routes through here so a German sees "1.234" where an
 * English speaker sees "1,234" and a French speaker sees "1 234", without any
 * component having to know. Partner-side money stays USD — platform billing is
 * USD by design — but the *formatting* still follows the reader's locale.
 */

type Cache<T> = Map<string, T>;

const numberCache: Cache<Intl.NumberFormat> = new Map();
const dateCache: Cache<Intl.DateTimeFormat> = new Map();

function numberFormat(locale: Locale, options: Intl.NumberFormatOptions = {}) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let cached = numberCache.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(intlLocale(locale), options);
    numberCache.set(key, cached);
  }
  return cached;
}

function dateFormat(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let cached = dateCache.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(intlLocale(locale), options);
    dateCache.set(key, cached);
  }
  return cached;
}

/** Fills `{name}` placeholders. The only templating the dictionary needs. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/* ---------------------------------------------------------------- numbers -- */

export const formatNumber = (locale: Locale, value: number) =>
  numberFormat(locale).format(value);

export const formatCompact = (locale: Locale, value: number) =>
  numberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatPercent = (locale: Locale, ratio: number, digits = 0) =>
  numberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio);

/**
 * A calendar year.
 *
 * Plain `formatNumber` groups thousands, which turned "since 1998" into
 * "since 1,998". A year is an identifier, not a quantity.
 */
export const formatYear = (locale: Locale, year: number) =>
  numberFormat(locale, { useGrouping: false, maximumFractionDigits: 0 }).format(year);

export const formatDecimal = (locale: Locale, value: number, digits = 1) =>
  numberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

/**
 * Platform billing is USD; only the presentation is localised.
 *
 * Two deliberate departures from the default output:
 *
 * `currencyDisplay: "narrowSymbol"` — the default disambiguates the dollar
 * against every other dollar, so en-GB renders "US$100", fr "100 $US" and it
 * "100 USD". There is only one currency anywhere in this product, so the
 * disambiguation buys nothing and just adds noise to a price.
 *
 * The replace afterwards — Arabic has no narrow symbol in CLDR and keeps
 * "US$" regardless of the option, so the prefix is stripped explicitly rather
 * than leaving one locale inconsistent with the other seven.
 */
export const formatUsd = (locale: Locale, value: number) =>
  numberFormat(locale, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  })
    .format(value)
    .replace("US$", "$");

/* ------------------------------------------------------------------ dates -- */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Read an ISO string the way its shape says it should be read.
 *
 * A bare "yyyy-mm-dd" is a calendar date, not a moment: a move booked for
 * 28 October is the 28th wherever you are reading from. `new Date("2026-10-28")`
 * resolves it to UTC midnight, which then renders as the 27th anywhere west
 * of Greenwich — so date-only strings are built at *local* midnight and stay
 * on the day they name. Anything carrying a time is a real instant and is
 * parsed as one.
 */
function toDate(iso: string): Date {
  if (DATE_ONLY.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

/**
 * Which clock the dates are rendered against.
 *
 * Instants are shown in the reader's own timezone, which the server cannot
 * know while it renders. Passing "UTC" for the server pass and the first
 * client render keeps both sides producing the same string, so hydration
 * matches; the provider then drops the override and React repaints the
 * handful of affected nodes in local time. See `useViewerTimeZone`.
 */
export type TimeZone = string | undefined;

export function formatDateLong(locale: Locale, iso: string, timeZone?: TimeZone): string {
  const date = toDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatDateShort(locale: Locale, iso: string, timeZone?: TimeZone): string {
  const date = toDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormat(locale, { day: "numeric", month: "short", timeZone }).format(date);
}

/**
 * Thin and narrow no-break spaces, which ICU puts either side of the dash in
 * a formatted range.
 *
 * Which one it picks depends on the ICU build, and Node and the browser do
 * not ship the same one: Node 24 returns "28 Sept – 27 Oct" where
 * Chromium returns plain spaces. Same date, same locale, two strings — which
 * React reports as a hydration mismatch on a node whose two versions look
 * identical in the diff. Flattening them to an ordinary space costs a
 * hair of typographic polish and makes the two runtimes agree.
 *
 * Written as escapes on purpose — the literal characters are invisible in a
 * diff, and a reader would have no way to tell what the character class holds.
 */
const THIN_SPACES = /[\u2009\u202f]/g;

/**
 * A collection or delivery window.
 *
 * `formatRange` is what makes this worth doing properly: it collapses the
 * shared parts the way each locale expects — "29 Nov – 5 Dec" in English,
 * "29. Nov. – 5. Dez." in German — and picks the right dash and order. A
 * hand-built `a – b` gets all three wrong somewhere.
 */
export function formatDateRange(
  locale: Locale,
  [from, to]: [string, string],
  timeZone?: TimeZone,
): string {
  const start = toDate(from);
  const end = toDate(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${from} – ${to}`;
  if (from === to) return formatDateShort(locale, from, timeZone);
  return dateFormat(locale, { day: "numeric", month: "short", timeZone })
    .formatRange(start, end)
    .replace(THIN_SPACES, " ");
}

export function formatDateTime(locale: Locale, iso: string, timeZone?: TimeZone): string {
  const date = toDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

const relativeCache: Cache<Intl.RelativeTimeFormat> = new Map();

/**
 * "5 min ago" in the reader's language.
 *
 * Takes the clock as an argument rather than reading it, for the same reason
 * the lead board does: the server and the client must render the same string.
 */
export function formatRelative(locale: Locale, timestamp: number, now: number): string {
  let rtf = relativeCache.get(locale);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "always", style: "narrow" });
    relativeCache.set(locale, rtf);
  }
  const diffMins = Math.round((timestamp - now) / 60_000);
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(Math.round(diffHours / 24), "day");
}

/* ------------------------------------------------------------------ units -- */

export const formatVolume = (locale: Locale, dict: Dictionary, m3: number) =>
  fill(dict.units.cubicMetres, { n: formatNumber(locale, m3) });

/**
 * "6–11 days".
 *
 * The plural category comes from the governing number — 11, not 6 — which is
 * what Russian and Arabic need to agree correctly; the text still shows the
 * whole range.
 */
export function formatDays(locale: Locale, dict: Dictionary, [min, max]: [number, number]) {
  const range =
    min === max ? formatNumber(locale, min) : `${formatNumber(locale, min)}–${formatNumber(locale, max)}`;
  return plural(locale, dict.units.days, max, range);
}

export function formatWeeks(locale: Locale, dict: Dictionary, weeks: number) {
  if (weeks === 0) return dict.units.none;
  return plural(locale, dict.units.weeks, weeks, formatNumber(locale, weeks));
}

export function formatResponseTime(locale: Locale, dict: Dictionary, mins: number) {
  if (mins < 60) return fill(dict.units.minutesShort, { n: formatNumber(locale, mins) });
  const hours = Math.round(mins / 60);
  if (hours < 24) return fill(dict.units.hoursShort, { n: formatNumber(locale, hours) });
  return fill(dict.units.daysShort, { n: formatNumber(locale, Math.round(hours / 24)) });
}

export const formatCount = (
  locale: Locale,
  forms: Parameters<typeof plural>[1],
  count: number,
) => plural(locale, forms, count, formatNumber(locale, count));

/* ----------------------------------------------------------------- places -- */

const regionNameCache: Cache<Intl.DisplayNames> = new Map();

/**
 * Country names from the ICU data rather than the dictionary.
 *
 * 53 countries × 8 languages is 424 strings the platform already knows, and
 * knows better than we would — "Türkiye", "Turquie", "تركيا" all come out
 * right, and a new country needs no translation work at all.
 */
export function countryName(locale: Locale, iso: string, fallback: string): string {
  let names = regionNameCache.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([intlLocale(locale)], { type: "region", fallback: "none" });
    regionNameCache.set(locale, names);
  }
  try {
    return names.of(iso.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

/** "Istanbul, Türkiye" in the reader's language. */
export function cityLabel(
  locale: Locale,
  city: { name: string; country: string },
  countryFallback: string,
): string {
  return `${city.name}, ${countryName(locale, city.country, countryFallback)}`;
}

export function formatList(locale: Locale, items: string[]): string {
  try {
    return new Intl.ListFormat(intlLocale(locale), {
      style: "long",
      type: "conjunction",
    }).format(items);
  } catch {
    return items.join(", ");
  }
}
