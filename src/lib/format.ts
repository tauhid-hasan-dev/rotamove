import { addDaysIso, todayLocalIso } from "@/lib/calendar";

const eur = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurPrecise = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("en-GB");

export const formatEur = (value: number) => eur.format(value);

/** Cents only when there are cents: "€1,234" for a round total, "€1,234.56" otherwise. */
export const formatEurPrecise = (value: number) =>
  Number.isInteger(value) ? eur.format(value) : eurPrecise.format(value);

export const formatCompact = (value: number) => compact.format(value);
export const formatNumber = (value: number) => plain.format(value);

export function formatKm(value: number) {
  return `${plain.format(Math.round(value))} km`;
}

export function formatDays([min, max]: [number, number]) {
  return min === max ? `${min} days` : `${min}–${max} days`;
}

export function formatVolume(m3: number) {
  return `${m3} m³`;
}

export function formatDateLong(iso: string, locale = "en-GB") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateShort(iso: string, locale = "en-GB") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

/**
 * Date arithmetic in local time.
 *
 * These used to go through `toISOString()`, which returns the *UTC* date: east
 * of Greenwich, "today" before mid-morning came back as yesterday, and the
 * wizard would reject a move date the calendar had just offered. Both now
 * delegate to the calendar helpers so every date in the product agrees.
 */
export const addDays = addDaysIso;
export const todayIso = todayLocalIso;

export function formatResponseTime(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

export function formatRelative(from: number, now = Date.now()) {
  const secs = Math.max(0, Math.round((now - from) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function pct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
