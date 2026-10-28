import type { PlanId } from "@/lib/types";

/**
 * A partner's subscription, and any change queued against it.
 *
 * Plans do not change mid-month. A partner can ask for a different plan at
 * any time, but the current month keeps billing on the plan it started on
 * and the new one takes over on the first of the next month. That is partly
 * a billing nicety and mostly an integrity one: pay-per-seen bills per
 * unlock and Pro bills a flat fee, so a mid-month switch would leave a
 * month that is half one model and half the other, and no invoice that
 * honestly describes it.
 */
export interface PlanSubscription {
  partnerId: string;
  /** What they are on today, and what this month is billed on. */
  plan: PlanId;
  /** What they have asked to move to, if anything. */
  pendingPlan?: PlanId;
  /** Midnight UTC on the first of the month the pending plan takes over. */
  effectiveFrom?: string;
  /** When the change was requested. */
  requestedAt?: string;
}

/**
 * Midnight UTC on the first of the month after `nowMs`.
 *
 * UTC, not local: this is a billing boundary, and a partner in Tashkent and
 * one in Lisbon have to agree on which month an invoice belongs to.
 */
export function firstOfNextMonth(nowMs: number): string {
  const now = new Date(nowMs);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export interface PlanRepository {
  /** The subscription as of `nowMs`, with any due change already applied. */
  get(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription;
  /** Queue a move to `plan` from the first of next month. */
  requestChange(
    partnerId: string,
    fallback: PlanId,
    plan: PlanId,
    nowMs: number,
  ): PlanSubscription;
  /** Withdraw a queued change. The current plan is untouched. */
  cancelChange(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription;
}

class InMemoryPlanRepository implements PlanRepository {
  private readonly subs = new Map<string, PlanSubscription>();

  private load(partnerId: string, fallback: PlanId): PlanSubscription {
    const existing = this.subs.get(partnerId);
    if (existing) return existing;
    const fresh: PlanSubscription = { partnerId, plan: fallback };
    this.subs.set(partnerId, fresh);
    return fresh;
  }

  /**
   * The scheduled job, run lazily.
   *
   * In a deployed system a nightly cron would sweep every subscription whose
   * `effectiveFrom` has passed and promote the pending plan. There is no
   * scheduler in a single-process demo, so the sweep happens on read
   * instead — which produces the same answer for anyone looking, because
   * nobody can observe the subscription without going through here.
   */
  private applyDue(sub: PlanSubscription, nowMs: number): PlanSubscription {
    if (!sub.pendingPlan || !sub.effectiveFrom) return sub;
    if (Date.parse(sub.effectiveFrom) > nowMs) return sub;

    const promoted: PlanSubscription = { partnerId: sub.partnerId, plan: sub.pendingPlan };
    this.subs.set(sub.partnerId, promoted);
    return promoted;
  }

  get(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription {
    return this.applyDue(this.load(partnerId, fallback), nowMs);
  }

  requestChange(
    partnerId: string,
    fallback: PlanId,
    plan: PlanId,
    nowMs: number,
  ): PlanSubscription {
    const current = this.get(partnerId, fallback, nowMs);

    // Asking for the plan you are already on cancels any queued change
    // rather than queueing a no-op you would then have to cancel.
    if (plan === current.plan) return this.cancelChange(partnerId, fallback, nowMs);

    const next: PlanSubscription = {
      partnerId,
      plan: current.plan,
      pendingPlan: plan,
      effectiveFrom: firstOfNextMonth(nowMs),
      requestedAt: new Date(nowMs).toISOString(),
    };
    this.subs.set(partnerId, next);
    return next;
  }

  cancelChange(partnerId: string, fallback: PlanId, nowMs: number): PlanSubscription {
    const current = this.get(partnerId, fallback, nowMs);
    const next: PlanSubscription = { partnerId, plan: current.plan };
    this.subs.set(partnerId, next);
    return next;
  }
}

/**
 * Module-level singleton, stashed on globalThis so a hot reload in dev does
 * not silently cancel everybody's queued plan change.
 */
const globalForPlans = globalThis as unknown as { __rotamovePlans?: PlanRepository };

export const planRepository: PlanRepository =
  globalForPlans.__rotamovePlans ?? new InMemoryPlanRepository();

if (process.env.NODE_ENV !== "production") {
  globalForPlans.__rotamovePlans = planRepository;
}
