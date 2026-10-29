import { NextRequest } from "next/server";
import { z } from "zod";
import { signedInAccount, unauthorised } from "@/lib/partner-auth";
import { mailRepository, planActivatedMail, planQueuedMail } from "@/lib/mail";
import { partnerNotificationRepository } from "@/lib/partner-notifications";
import { daysUntil } from "@/lib/plan-cycle";
import { planRepository } from "@/lib/plan-store";
import { PLAN_IDS, PLAN_NAMES_EN } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The partner's subscription.
 *
 * `POST` moves the plan. An upgrade onto Pro Unlimited takes effect at once;
 * anything else is queued for the day after the current thirty-day period
 * ends, and nothing here can change what the period in progress bills on —
 * which is the whole point. A client that could would be a client that could
 * rewrite an invoice.
 *
 * Either outcome is confirmed by email and in the dashboard. The two say
 * different things, so which one is sent comes from the repository's
 * `activated` flag rather than from anything the caller asked for.
 *
 * Identity comes from the session cookie, never the payload.
 */

const planInputSchema = z.object({
  plan: z.enum(PLAN_IDS),
});

/** Billing dates in mail read as "19 December 2026", in UTC like the boundary. */
const mailDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export async function GET() {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  return Response.json({
    subscription: planRepository.get(account.mover.id, account.plan, Date.now()),
  });
}

export async function POST(request: NextRequest) {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = planInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Unknown plan" }, { status: 422 });
  }

  const now = Date.now();
  const before = planRepository.get(account.mover.id, account.plan, now);
  const { subscription, activated } = planRepository.requestChange(
    account.mover.id,
    account.plan,
    parsed.data.plan,
    now,
  );

  const context = {
    to: account.email,
    name: account.mover.name,
    companyName: account.mover.name,
    ref: account.partnerId,
  };

  if (activated) {
    await mailRepository.send(
      planActivatedMail({
        ...context,
        toPlan: PLAN_NAMES_EN[subscription.plan],
        cycleEnds: mailDate(subscription.cycleEnds),
      }),
    );
    await partnerNotificationRepository.add({
      subjectId: account.mover.id,
      kind: "plan_activated",
      fromPlan: before.plan,
      toPlan: subscription.plan,
    });
  } else if (subscription.pendingPlan && subscription.effectiveFrom) {
    await mailRepository.send(
      planQueuedMail({
        ...context,
        fromPlan: PLAN_NAMES_EN[subscription.plan],
        toPlan: PLAN_NAMES_EN[subscription.pendingPlan],
        effectiveOn: mailDate(subscription.effectiveFrom),
        daysLeft: daysUntil(now, subscription.effectiveFrom),
      }),
    );
    await partnerNotificationRepository.add({
      subjectId: account.mover.id,
      kind: "plan_queued",
      fromPlan: subscription.plan,
      toPlan: subscription.pendingPlan,
      effectiveFrom: subscription.effectiveFrom,
    });
  }

  return Response.json({ subscription, activated });
}

/** Withdraw a queued change. The plan in force and its period are untouched. */
export async function DELETE() {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  return Response.json({
    subscription: planRepository.cancelChange(account.mover.id, account.plan, Date.now()),
    activated: false,
  });
}
