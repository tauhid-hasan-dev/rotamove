import type { DayRange } from "@/lib/admin/metrics";

/* Date-range presets shared by every filtered page. All math in UTC days,
   anchored on the dataset's "today". */

const DAY = 86_400_000;

export type RangePreset =
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "this_year"
  | "all"
  | "custom";

export const PRESET_LABELS: Record<Exclude<RangePreset, "custom">, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  this_month: "This month",
  this_year: "This year",
  all: "Last 12 months",
};

export const PRESETS: ReadonlyArray<Exclude<RangePreset, "custom">> = [
  "7d",
  "30d",
  "90d",
  "this_month",
  "this_year",
  "all",
];

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function presetRange(preset: Exclude<RangePreset, "custom">, anchorMs: number): DayRange {
  const end = iso(anchorMs);
  const anchor = new Date(anchorMs);
  switch (preset) {
    case "7d":
      return { start: iso(anchorMs - 6 * DAY), end };
    case "30d":
      return { start: iso(anchorMs - 29 * DAY), end };
    case "90d":
      return { start: iso(anchorMs - 89 * DAY), end };
    case "this_month":
      return { start: iso(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)), end };
    case "this_year":
      return { start: iso(Date.UTC(anchor.getUTCFullYear(), 0, 1)), end };
    case "all":
      return { start: iso(anchorMs - 364 * DAY), end };
  }
}

export function formatRangeLabel(range: DayRange): string {
  const fmt = (isoDay: string) =>
    new Date(Date.parse(`${isoDay}T00:00:00Z`)).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(range.start)} – ${fmt(range.end)}`;
}
