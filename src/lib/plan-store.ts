import {
  CYCLE_DAYS,
  DAY_MS,
  cycleEndMs,
  isUpgrade,
  nextCycleStartMs,
  utcMidnight,
} from "@/lib/plan-cycle";
import { serverSingleton } from "@/lib/server-singleton";
import type { PlanId } from "@/lib/types";

/**
 * A partner's subscription, and any change queued against it.
 *
 * Billing periods run thirty days from the day the plan was activated, not
 * from the first of the calendar month. A carrier who signs up on the 18th of
 * November has paid for a period that runs to the 18th of December, and
 * billing them again on the 1st would be charging twice for the same
 * fortnight. The calendar month is a convenience for whoever is reconciling
 * the books; the thirty days are what the partner actually bought.
 *
 * A change still does not take effect mid-period, and for the same reason it
 * never did: pay-per-seen bills per unlock and Pro bills a flat fee, so a
 * period split across both would produce an invoice that no honest sentence
 * describes. The request is queued for the day after the current period ends.
 *
 * Upgrades are the exception — see `isUpgrade`.
 */

export interface PlanSubscription {
  partnerId: string;
  /** What they are on today, and what this period is billed on. */
  plan: PlanId;
  /** Midnight UTC on the day the current period opened. */
  cycleStart: string;
  /** Midnight UTC on the last day of the current period. */
  cycleEnds: string;
  /** What they have asked to move to, if anything. */
  pendingPlan?: PlanId;
  /** Midnight UTC on the day the pending plan takes over. */
  effectiveFrom?: string;
  /** When the change was requested. */
  requestedAt?: string;
}

export interface PlanChangeResult {
  subscription: PlanSubscription;
  /**
   * True when the change is already in force rather than queued, which the
   * caller needs in order to send the right email — "your plan changes on the
   * 19th" and "your plan changed just now" are not the same message.
   */
  activated: boolean;
}

const iso = (ms: number) => new Date(ms).toISOString();

export interface PlanRepository {
  /** The subscription as of `nowMs`, with any due change already applied. */
  get(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription;
  /**
   * Move to `plan` — immediately if it is an upgrade, otherwise queued for
   * the day after the current period ends.
   */
  requestChange(
    partnerId: string,
    fallback: PlanId,
    plan: PlanId,
    nowMs: number,
  ): PlanChangeResult;
  /** Withdraw a queued change. The current plan and period are untouched. */
  cancelChange(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription;
}

/**
 * How far through its first period a brand-new demo subscription starts.
 *
 * Zero would be truthful for a real signup and useless for a demonstration:
 * every account would read "30 days remaining", and the queued-change
 * countdown — the entire point of the feature — would never be visible
 * without waiting a fortnight. Derived from the partner id so it is stable
 * across renders and across restarts rather than jittering on reload.
 */
function seedOffsetDays(partnerId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < partnerId.length; i += 1) {
    hash ^= partnerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % CYCLE_DAYS;
}

function cycle(partnerId: string, plan: PlanId, startMs: number): PlanSubscription {
  return {
    partnerId,
    plan,
    cycleStart: iso(startMs),
    cycleEnds: iso(cycleEndMs(startMs)),
  };
}

class InMemoryPlanRepository implements PlanRepository {
  private readonly subs = new Map<string, PlanSubscription>();

  private load(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription {
    const existing = this.subs.get(partnerId);
    if (existing) return existing;
    const start = utcMidnight(nowMs) - seedOffsetDays(partnerId) * DAY_MS;
    const fresh = cycle(partnerId, fallback, start);
    this.subs.set(partnerId, fresh);
    return fresh;
  }

  /**
   * The scheduled job, run lazily.
   *
   * In a deployed system a nightly cron would sweep every subscription whose
   * period had lapsed, renew it and promote any plan queued against it. There
   * is no scheduler in a single-process demo, so the sweep happens on read —
   * which produces the same answer for anyone looking, because nobody can
   * observe a subscription without coming through here.
   *
   * It loops rather than handling one period, so a subscription nobody has
   * read for three months lands on the right plan and the right period
   * instead of one boundary past where it was.
   */
  private applyDue(sub: PlanSubscription, nowMs: number): PlanSubscription {
    let current = sub;

    // Bounded so a clock that jumps years cannot spin here. Ten years of
    // thirty-day periods is far more than any reachable state.
    for (let guard = 0; guard < 128; guard += 1) {
      const nextStart = nextCycleStartMs(Date.parse(current.cycleStart));
      if (nowMs < nextStart) break;
      // The period has lapsed. Anything queued was queued for exactly this
      // boundary, so it takes over now; otherwise the same plan renews.
      current = cycle(current.partnerId, current.pendingPlan ?? current.plan, nextStart);
    }

    if (current !== sub) this.subs.set(current.partnerId, current);
    return current;
  }

  get(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription {
    return this.applyDue(this.load(partnerId, fallback, nowMs), nowMs);
  }

  requestChange(
    partnerId: string,
    fallback: PlanId,
    plan: PlanId,
    nowMs: number,
  ): PlanChangeResult {
    const current = this.get(partnerId, fallback, nowMs);

    // Asking for the plan you are already on withdraws any queued change
    // rather than queueing a no-op you would then have to cancel.
    if (plan === current.plan) {
      return { subscription: this.cancelChange(partnerId, fallback, nowMs), activated: false };
    }

    if (isUpgrade(current.plan, plan)) {
      // In force now, on a period that opens today — the partner starts
      // paying the flat fee from the day they asked for it.
      const next = cycle(partnerId, plan, utcMidnight(nowMs));
      this.subs.set(partnerId, next);
      return { subscription: next, activated: true };
    }

    const next: PlanSubscription = {
      ...current,
      pendingPlan: plan,
      effectiveFrom: iso(nextCycleStartMs(Date.parse(current.cycleStart))),
      requestedAt: iso(nowMs),
    };
    this.subs.set(partnerId, next);
    return { subscription: next, activated: false };
  }

  cancelChange(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription {
    const current = this.get(partnerId, fallback, nowMs);
    // The period is untouched: withdrawing a request is not a renewal, and
    // resetting `cycleStart` here would hand the partner a free fortnight.
    const next: PlanSubscription = {
      partnerId,
      plan: current.plan,
      cycleStart: current.cycleStart,
      cycleEnds: current.cycleEnds,
    };
    this.subs.set(partnerId, next);
    return next;
  }
}

/**
 * One instance per process, so a queued plan change is not silently cancelled
 * by a hot reload — or lost between the route that writes it and the page
 * that reads it. See `server-singleton.ts`.
 */
export const planRepository: PlanRepository = serverSingleton(
  "__rotamovePlans",
  () => new InMemoryPlanRepository(),
);
