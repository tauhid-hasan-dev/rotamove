import { partnerRepository } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The vetting queue: every partner application, newest first.
 *
 * Unlike the rest of the admin console this is not seeded client-side — the
 * rows are real submissions from the registration form, read from the partner
 * store. Submit the form in one tab and the application appears here in the
 * next refresh, which is the whole demonstration of the review flow.
 *
 * Unauthenticated like the rest of the admin console, which has no accounts.
 * In a deployed system this is behind the reviewer role, and the `score`
 * field in particular must never leave it — an applicant who can see the
 * number will tune the form until it goes up.
 */
export async function GET() {
  return Response.json({ applications: await partnerRepository.list() });
}
