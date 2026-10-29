import { NextRequest } from "next/server";
import { z } from "zod";
import { signedInAccount, unauthorised } from "@/lib/partner-auth";
import { partnerNotificationRepository } from "@/lib/partner-notifications";
import { partnerRepository } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What the partner needs to see: document requests, decisions, plan changes.
 *
 * A partner has two identities — the mover id their account runs on and any
 * application reference filed under their address — and notifications can be
 * addressed to either. Both are resolved here, from the session, so a request
 * the reviewer raised against an application in vetting is visible to the
 * account that application belongs to.
 */
async function subjectIdsFor(moverId: string, email: string): Promise<string[]> {
  const wanted = email.trim().toLowerCase();
  const applications = await partnerRepository.list();
  const references = applications
    .filter((a) => a.email.trim().toLowerCase() === wanted)
    .map((a) => a.reference);
  return [moverId, ...references];
}

export async function GET() {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  const subjects = await subjectIdsFor(account.mover.id, account.email);
  return Response.json({
    notifications: await partnerNotificationRepository.listFor(subjects),
  });
}

const readSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

/** Mark notifications read. Scoped to the caller's own subject ids. */
export async function POST(request: NextRequest) {
  const account = await signedInAccount();
  if (!account) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = readSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Expected ids" }, { status: 422 });

  const subjects = await subjectIdsFor(account.mover.id, account.email);
  const changed = await partnerNotificationRepository.markRead(subjects, parsed.data.ids);
  return Response.json({ changed });
}
