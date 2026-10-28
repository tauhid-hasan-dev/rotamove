import { laneRepository } from "@/lib/lane-store";
import { toOffer } from "@/lib/last-call-offers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live last-call offers, carrier-anonymous.
 *
 * Public and unauthenticated: this is the same data the `/last-call` board
 * shows, exposed so the promotional strip — which sits in a statically
 * prerendered layout and therefore cannot read the store — can report a
 * real count instead of a guess.
 */
export async function GET() {
  const now = Date.now();
  const lanes = await laneRepository.activeLastCall(now);
  const offers = lanes.map(toOffer).filter((offer) => offer !== null);
  return Response.json({ now, count: offers.length, offers });
}
