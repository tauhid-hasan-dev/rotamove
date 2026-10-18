import { NextRequest } from "next/server";
import { laneRepository } from "@/lib/lane-store";
import { lanePatchSchema } from "@/lib/lanes";
import { signedInPartner, unauthorised } from "@/lib/partner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One lane: change it, or take it off the board.
 *
 * PATCH rather than PUT because the common edits are single-field — pausing a
 * run, or dropping the free capacity after selling part of it — and a partner
 * should not have to resend a whole lane to say "this one is full now".
 *
 * A missing lane and someone else's lane are both 404. Distinguishing them
 * would confirm that an id exists, which is not something a lane board needs
 * to tell the world.
 */

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/partners/lanes/[laneId]">,
) {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = lanePatchSchema.safeParse(body);
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

  const { laneId } = await params;
  const lane = await laneRepository.update(moverId, laneId, parsed.data);
  if (!lane) return Response.json({ error: "Lane not found" }, { status: 404 });

  return Response.json({ lane });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext<"/api/partners/lanes/[laneId]">,
) {
  const moverId = await signedInPartner();
  if (!moverId) return unauthorised();

  const { laneId } = await params;
  const removed = await laneRepository.remove(moverId, laneId);
  if (!removed) return Response.json({ error: "Lane not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
