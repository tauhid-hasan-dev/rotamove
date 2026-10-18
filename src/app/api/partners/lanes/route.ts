import { NextRequest } from "next/server";
import { laneRepository } from "@/lib/lane-store";
import { laneInputSchema } from "@/lib/lanes";
import { signedInPartner, unauthorised } from "@/lib/partner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A partner's own lane board: list what they run, declare another run.
 *
 * Ownership comes from the session, so there is no `moverId` in the payload
 * for a caller to tamper with. See `lib/partner-auth.ts`.
 */
export async function GET() {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  return Response.json({ lanes: await laneRepository.list(moverId) });
}

export async function POST(request: NextRequest) {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = laneInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Lane is not valid",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  try {
    const lane = await laneRepository.create(moverId, parsed.data);
    return Response.json({ lane }, { status: 201 });
  } catch (error) {
    // The only throw the store makes is the per-partner cap.
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save the lane" },
      { status: 409 },
    );
  }
}
