import { NextRequest } from "next/server";
import { partnerRepository } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One application, in full.
 *
 * Separate from the list route because the detail page needs everything —
 * cover amounts, fleet composition, document metadata, the review trail —
 * and loading all of that for every row of a queue that only shows six
 * columns would be paying for it a hundred times over.
 *
 * Unauthenticated like the rest of the admin console. In a deployed system
 * this is behind the reviewer role: the body carries an applicant's contact
 * details, their licence numbers and their internal readiness score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const application = await partnerRepository.get(decodeURIComponent(reference));
  if (!application) {
    return Response.json({ error: "Unknown application" }, { status: 404 });
  }
  return Response.json({ application });
}
