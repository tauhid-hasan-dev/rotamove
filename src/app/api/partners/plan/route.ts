import { NextRequest } from "next/server";
import { z } from "zod";
import { signedInAccount, unauthorised } from "@/lib/partner-auth";
import { planRepository } from "@/lib/plan-store";
import { PLAN_IDS } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The partner's subscription.
 *
 * A plan change is a request, not a switch: `POST` queues the new plan for
 * the first of next month and returns the subscription with the pending
 * change attached. Nothing here can change what the current month bills on,
 * which is the whole point — a client that could would be a client that
 * could rewrite an invoice.
 *
 * Identity comes from the session cookie, never the payload.
 */

const planInputSchema = z.object({
  plan: z.enum(PLAN_IDS),
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

  return Response.json({
    subscription: planRepository.requestChange(
      account.mover.id,
      account.plan,
      parsed.data.plan,
      Date.now(),
    ),
  });
}

/** Withdraw a queued change. The plan in force is untouched. */
export async function DELETE() {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  return Response.json({
    subscription: planRepository.cancelChange(account.mover.id, account.plan, Date.now()),
  });
}
