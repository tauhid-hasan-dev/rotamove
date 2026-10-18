import { addDaysIso, daysBetween } from "@/lib/calendar";
import type { DateFlexibility } from "@/lib/types";

/**
 * Translating between a picked date range and what a lead stores.
 *
 * The customer thinks in "sometime between these two dates". The matching
 * engine and every partner-facing surface think in "this date, give or take
 * this much". These two functions are the only place that conversion happens,
 * so the search bar and the wizard can never disagree about what a range meant.
 */

/** A collection window becomes a date plus a flexibility band. */
export function flexibilityForSpan(span: number): DateFlexibility {
  if (span <= 0) return "exact";
  if (span <= 6) return "plus_minus_3";
  if (span <= 16) return "within_2_weeks";
  return "flexible";
}

/**
 * And back again, for redisplay.
 *
 * Lossy on purpose: a band covers a range of spans, so this returns a
 * representative one. It exists so reopening the picker lands on roughly the
 * window the customer chose, not so the two round-trip exactly.
 */
export function spanForFlexibility(flexibility: DateFlexibility): number {
  switch (flexibility) {
    case "exact":
      return 0;
    case "plus_minus_3":
      return 3;
    case "within_2_weeks":
      return 14;
    case "flexible":
      return 30;
  }
}

export const windowFromLead = (moveDate: string, flexibility: DateFlexibility) => ({
  start: moveDate,
  end: addDaysIso(moveDate, spanForFlexibility(flexibility)),
});

export const leadFromWindow = (start: string, end: string | null) => ({
  moveDate: start,
  flexibility: flexibilityForSpan(end ? daysBetween(start, end) : 0),
});
