import {
  lastCallEndAt,
  type LaneVehicle,
  type LastCallHours,
  type PartnerLane,
} from "@/lib/lanes";

/**
 * One last-call offer, stripped of everything that identifies the carrier.
 *
 * The public board carries the route, the space and the clock — never the
 * partner's name. Identity is revealed once a request is actually sent,
 * which is the whole reason a carrier is willing to post spare capacity at
 * short notice in the first place.
 *
 * Lives in `lib` rather than beside the board component because the page
 * shapes these on the server and the board renders them on the client.
 */
export interface LastCallOffer {
  id: string;
  fromCode: string;
  toCode: string;
  hours: LastCallHours;
  startAt: string;
  endAt: string;
  capacityM3: number;
  vehicle: LaneVehicle;
  notes: string;
}

export function toOffer(lane: PartnerLane): LastCallOffer | null {
  if (!lane.lastCall) return null;
  return {
    id: lane.id,
    fromCode: lane.fromCode,
    toCode: lane.toCode,
    hours: lane.lastCall.hours,
    startAt: lane.lastCall.startAt,
    endAt: lastCallEndAt(lane.lastCall),
    capacityM3: lane.capacityM3,
    vehicle: lane.vehicle,
    notes: lane.notes,
  };
}
