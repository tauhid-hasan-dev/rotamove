import { unlockRepository } from "@/lib/unlock-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The admin's live unlock feed: every pay-per-seen unlock, newest first.
 *
 * Unauthenticated like the rest of the admin console — the demo has no admin
 * accounts, and the records carry no customer contact details.
 */
export async function GET() {
  return Response.json({ unlocks: await unlockRepository.listAll() });
}
