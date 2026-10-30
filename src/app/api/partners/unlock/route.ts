import { NextRequest } from "next/server";
import { z } from "zod";
import { generateLeadBoard } from "@/lib/demo-leads";
import { signedInAccount, signedInPartner, unauthorised } from "@/lib/partner-auth";
import { planRepository } from "@/lib/plan-store";
import { seesMaskedLeads } from "@/lib/plans";
import { unlockRepository } from "@/lib/unlock-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pay-per-seen unlocks.
 *
 * The other plans reveal client-side; this one charges per click, so the
 * click is a server event. The fee is computed here from the same seeded
 * board the dashboard renders — the server's number is the billable one, not
 * whatever the client claims. Identity comes from the session cookie, never
 * from the payload.
 */

const unlockInputSchema = z.object({
  leadId: z.string().min(1, "leadId is required"),
});

export async function GET() {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  return Response.json({ unlocks: await unlockRepository.listForPartner(moverId) });
}

export async function POST(request: NextRequest) {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  // Only the per-unlock plan has anything to unlock. The other two are
  // billed when the lead is matched, so charging them again here would be
  // billing twice for one lead — and the client asking nicely is not a
  // reason to do it.
  if (!seesMaskedLeads(planRepository.get(account.mover.id, account.plan, Date.now()).plan)) {
    return Response.json(
      { error: "Your plan already includes this lead in full" },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = unlockInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Unlock request is not valid",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  // The board is deterministic per index, so regenerating it here resolves
  // the same lead the dashboard showed — and prices it with the same formula.
  const item = generateLeadBoard(Date.now(), 18).find(
    (b) => b.lead.id === parsed.data.leadId,
  );
  if (!item) {
    return Response.json({ error: "No such lead on the board" }, { status: 404 });
  }

  const { record, created } = await unlockRepository.record({
    partnerId: account.mover.id,
    partnerName: account.mover.name,
    partnerPublicId: account.partnerId,
    leadId: item.lead.id,
    routeLabel: item.routeLabel,
    volumeM3: item.lead.volumeM3,
    feeEur: item.feeEur,
    // The address the full lead goes to — this account's, not a constant.
    emailTo: account.email,
  });

  return Response.json({ unlock: record, created }, { status: created ? 201 : 200 });
}
