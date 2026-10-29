import type { PlanId } from "@/lib/types";

/**
 * Billing-period arithmetic.
 *
 * Split out from `plan-store.ts` so the dashboard can do this maths without
 * importing the repository. The store carries a module-level singleton and a
 * class the browser has no use for; a client component that wanted to count
 * the days left on a cycle used to drag both into the bundle.
 *
 * Periods run thirty days from the day the plan was activated, not from the
 * first of the calendar month. A carrier who signed up on the 18th of
 * November has bought a period that runs to the 18th of December, and billing
 * them again on the 1st would charge twice for the same fortnight.
 */

export const CYCLE_DAYS = 30;
export const DAY_MS = 86_400_000;

/**
 * Boundaries land on midnight UTC, not local midnight: a partner in Tashkent
 * and one in Lisbon have to agree on which period an invoice belongs to, and
 * they cannot if the boundary moves with the reader.
 */
export function utcMidnight(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * The last day of a period that opened on `cycleStartMs`.
 *
 * Thirty days on, and inclusive: a period opened on 18 November runs *to* 18
 * December, which is the date the partner is told and the one their invoice
 * covers.
 */
export function cycleEndMs(cycleStartMs: number): number {
  return cycleStartMs + CYCLE_DAYS * DAY_MS;
}

/** The day the next period — and any plan queued for it — begins. */
export function nextCycleStartMs(cycleStartMs: number): number {
  return cycleEndMs(cycleStartMs) + DAY_MS;
}

/**
 * Whole days from `nowMs` until `targetIso`, never negative.
 *
 * Rounded up, because a partner told "1 day remaining" on the evening before
 * a change should not read "0 days" while the change still has not happened.
 */
export function daysUntil(nowMs: number, targetIso: string): number {
  const diff = Date.parse(targetIso) - nowMs;
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
}

/**
 * Is moving from `from` to `to` an upgrade?
 *
 * Only one direction counts: onto Pro Unlimited from either metered plan.
 * Upgrades take effect immediately, and the asymmetry is deliberate rather
 * than generous. Making a partner wait three weeks to start paying us more is
 * a bad deal for both sides, and the integrity argument that justifies
 * queueing every other change does not apply — Pro is a flat fee, so starting
 * one today opens a clean new period rather than splicing two pricing models
 * into a period no invoice could honestly describe.
 *
 * Downgrades stay queued. A partner who could drop to pay-per-seen on day 29
 * of a flat month would have had that month for nothing.
 */
export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return to === "pro_unlimited" && from !== "pro_unlimited";
}
