import { z } from "zod";
import { CITY_BY_CODE, type TransportMode } from "@/lib/geo";
import { addDaysIso } from "@/lib/calendar";
import { spanForFlexibility } from "@/lib/lead-dates";
import type { DateRange, Lead } from "@/lib/types";

/**
 * Lanes a carrier declares for itself.
 *
 * Region coverage (set once at onboarding) answers "could this partner ever
 * do this job". It cannot answer the question that actually decides a move:
 * *is a vehicle already going there, on these dates, with room left*. That is
 * the backload — the cheapest, fastest capacity in the trade, and the thing a
 * carrier knows about weeks before anyone else does.
 *
 * So lanes are declared by the partner, not derived from their profile, and
 * they come in two kinds:
 *
 *  - `standing` — a scheduled service they run all year. No dates.
 *  - `dated`    — one run, with a window. "A lorry goes Istanbul → Bratislava
 *                 between 10 and 16 November." This is the temporary route a
 *                 partner adds when a job happens to take a vehicle somewhere
 *                 new, and it expires on its own.
 *
 * Both feed matching. See `laneBonus` in lib/matching.ts.
 */

export const LANE_VEHICLES = ["lorry", "van"] as const;
export type LaneVehicle = (typeof LANE_VEHICLES)[number];

export const LANE_MODES = ["road", "sea", "air", "rail"] as const satisfies ReadonlyArray<TransportMode>;

export type LaneStatus = "active" | "paused";

export interface PartnerLane {
  id: string;
  moverId: string;
  /** Hub codes, both ends. */
  fromCode: string;
  toCode: string;
  /** The vehicle comes back loaded too, so the reverse leg matches as well. */
  bothWays: boolean;
  /** `null` for a standing service; ISO `[start, end]` for a single dated run. */
  window: DateRange | null;
  vehicle: LaneVehicle;
  mode: TransportMode;
  /** Space still unsold on this run, m³ — what a backload is actually sized by. */
  capacityM3: number;
  notes: string;
  status: LaneStatus;
  updatedAt: string;
}

/* ---------------------------------------------------------------- schema -- */

const cityCode = z
  .string()
  .trim()
  .toUpperCase()
  .refine((code) => CITY_BY_CODE.has(code), "Unknown hub code");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-mm-dd");

/**
 * What the dashboard may send.
 *
 * The window is validated as a pair or not at all: a start without an end is
 * a half-saved form, and storing it would quietly match for one day.
 */
const laneObjectSchema = z.object({
  fromCode: cityCode,
  toCode: cityCode,
  bothWays: z.boolean(),
  window: z.tuple([isoDate, isoDate]).nullable(),
  vehicle: z.enum(LANE_VEHICLES),
  mode: z.enum(LANE_MODES),
  capacityM3: z.number().int().min(1).max(5000),
  notes: z.string().trim().max(240),
  status: z.enum(["active", "paused"]),
});

export const laneInputSchema = laneObjectSchema
  .refine((lane) => lane.fromCode !== lane.toCode, {
    message: "Pick two different hubs",
    path: ["toCode"],
  })
  .refine((lane) => !lane.window || lane.window[0] <= lane.window[1], {
    message: "The run has to end after it starts",
    path: ["window"],
  });

export type LaneInput = z.infer<typeof laneInputSchema>;

/** Every field is optional on edit, so a pause is a one-key request. */
export const lanePatchSchema = laneObjectSchema.partial();

export type LanePatch = z.infer<typeof lanePatchSchema>;

/* --------------------------------------------------------------- matching -- */

export type LaneDirection = "forward" | "reverse";

/** Which way round the lane serves this route, if it serves it at all. */
export function laneDirection(
  lane: PartnerLane,
  fromCode: string,
  toCode: string,
): LaneDirection | null {
  if (lane.fromCode === fromCode && lane.toCode === toCode) return "forward";
  if (lane.bothWays && lane.fromCode === toCode && lane.toCode === fromCode) return "reverse";
  return null;
}

/**
 * Does the declared run overlap the dates the customer can move on?
 *
 * A standing lane always does. A dated one has to actually intersect — a
 * lorry leaving in November is no use to someone moving in March, and
 * pretending otherwise is the single fastest way to lose a partner's trust in
 * the leads we send them.
 */
export function laneCoversWindow(lane: PartnerLane, [start, end]: DateRange): boolean {
  if (!lane.window) return true;
  const [laneStart, laneEnd] = lane.window;
  return laneStart <= end && laneEnd >= start;
}

/** The span a lead can actually move in: its date plus its flexibility band. */
export function leadWindow(lead: Lead): DateRange {
  const slack = spanForFlexibility(lead.flexibility);
  return slack === 0
    ? [lead.moveDate, lead.moveDate]
    : [addDaysIso(lead.moveDate, -slack), addDaysIso(lead.moveDate, slack)];
}

export interface LaneMatch {
  lane: PartnerLane;
  direction: LaneDirection;
  /** A dated run on the customer's window is a stronger signal than a timetable. */
  dated: boolean;
  /** The lane has room for the whole load. */
  fits: boolean;
}

/**
 * The best lane a partner has for one lead.
 *
 * City-exact only. A partner whose lorry runs Istanbul → Munich is not
 * thereby running Istanbul → Berlin, and region coverage already gives them
 * credit for the wider area — counting it twice here would let a partner
 * inflate their ranking by declaring lanes they do not run.
 */
export function bestLaneFor(lanes: PartnerLane[], lead: Lead): LaneMatch | null {
  const window = leadWindow(lead);

  const matches = lanes.flatMap<LaneMatch>((lane) => {
    if (lane.status !== "active") return [];
    const direction = laneDirection(lane, lead.origin.cityCode, lead.destination.cityCode);
    if (!direction) return [];
    if (!laneCoversWindow(lane, window)) return [];
    return [
      {
        lane,
        direction,
        dated: lane.window !== null,
        fits: lane.capacityM3 >= lead.volumeM3,
      },
    ];
  });

  if (!matches.length) return null;

  // A dated run that fits the load beats a timetable entry; then prefer the
  // forward leg, then the roomiest vehicle.
  return matches.sort(
    (a, b) =>
      Number(b.dated) - Number(a.dated) ||
      Number(b.fits) - Number(a.fits) ||
      Number(a.direction === "reverse") - Number(b.direction === "reverse") ||
      b.lane.capacityM3 - a.lane.capacityM3,
  )[0];
}

/** The days both a customer's window and a declared run have in common. */
export function windowOverlap(a: DateRange, b: DateRange): DateRange | null {
  const start = a[0] > b[0] ? a[0] : b[0];
  const end = a[1] < b[1] ? a[1] : b[1];
  return start <= end ? [start, end] : null;
}

/* ------------------------------------------------------------------ view -- */

/** Has a dated run already finished? Used to grey it out rather than delete it. */
export function laneExpired(lane: PartnerLane, todayIso: string): boolean {
  return lane.window !== null && lane.window[1] < todayIso;
}

export function laneRouteLabel(lane: PartnerLane): string {
  const from = CITY_BY_CODE.get(lane.fromCode);
  const to = CITY_BY_CODE.get(lane.toCode);
  return `${from?.name ?? lane.fromCode} ${lane.bothWays ? "↔" : "→"} ${to?.name ?? lane.toCode}`;
}
