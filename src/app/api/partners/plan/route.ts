import { NextRequest } from "next/server";
import { z } from "zod";
import { signedInPartner, unauthorised } from "@/lib/partner-auth";
import { DEMO_PARTNER } from "@/lib/partner-session";
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
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  return Response.json({
    subscription: planRepository.get(moverId, DEMO_PARTNER.plan, Date.now()),
  });
}

export async function POST(request: NextRequest) {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

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
      moverId,
      DEMO_PARTNER.plan,
      parsed.data.plan,
      Date.now(),
    ),
  });
}

/** Withdraw a queued change. The plan in force is untouched. */
export async function DELETE() {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  return Response.json({
    subscription: planRepository.cancelChange(moverId, DEMO_PARTNER.plan, Date.now()),
  });
}
