import { nanoid } from "nanoid";
import { addDaysIso, todayLocalIso } from "@/lib/calendar";
import { DEMO_PARTNER } from "@/lib/partner-session";
import type { LaneInput, LanePatch, PartnerLane } from "@/lib/lanes";

/**
 * Lane repository.
 *
 * Same contract as `leadRepository` and `partnerRepository`: a process-local
 * Map behind an interface, so the move to a real table is this one file. The
 * demo's lanes therefore live as long as the server process does — which is
 * also why `index()` exists, and why matching takes the index as an argument
 * rather than importing this module. Matching runs in the browser too.
 */

/** Lanes grouped by the partner that declared them. */
export type LaneIndex = ReadonlyMap<string, PartnerLane[]>;

export interface LaneRepository {
  list(moverId: string): Promise<PartnerLane[]>;
  create(moverId: string, input: LaneInput): Promise<PartnerLane>;
  update(moverId: string, laneId: string, patch: LanePatch): Promise<PartnerLane | null>;
  remove(moverId: string, laneId: string): Promise<boolean>;
  /** Every active partner's lanes, for one matching run. */
  index(): Promise<LaneIndex>;
}

class InMemoryLaneRepository implements LaneRepository {
  private readonly lanes = new Map<string, PartnerLane>();
  /** A partner cannot declare an unbounded number of runs. */
  private readonly perPartnerCap = 40;

  constructor(seed: PartnerLane[] = []) {
    for (const lane of seed) this.lanes.set(lane.id, lane);
  }

  private own(moverId: string): PartnerLane[] {
    return [...this.lanes.values()].filter((lane) => lane.moverId === moverId);
  }

  async list(moverId: string): Promise<PartnerLane[]> {
    // Dated runs first, soonest departure at the top — that is the order a
    // dispatcher thinks in. Standing services are a timetable and sit below.
    return this.own(moverId).sort((a, b) => {
      if (a.window && b.window) return a.window[0].localeCompare(b.window[0]);
      if (a.window) return -1;
      if (b.window) return 1;
      return a.fromCode.localeCompare(b.fromCode) || a.toCode.localeCompare(b.toCode);
    });
  }

  async create(moverId: string, input: LaneInput): Promise<PartnerLane> {
    if (this.own(moverId).length >= this.perPartnerCap) {
      throw new Error(`A partner may declare at most ${this.perPartnerCap} lanes`);
    }
    const lane: PartnerLane = {
      ...input,
      id: `ln_${nanoid(10)}`,
      moverId,
      updatedAt: new Date().toISOString(),
    };
    this.lanes.set(lane.id, lane);
    return lane;
  }

  async update(moverId: string, laneId: string, patch: LanePatch): Promise<PartnerLane | null> {
    const existing = this.lanes.get(laneId);
    // Ownership is checked here, not in the route: it is the invariant of the
    // store, so it cannot be forgotten by a future caller.
    if (!existing || existing.moverId !== moverId) return null;

    const next: PartnerLane = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.lanes.set(laneId, next);
    return next;
  }

  async remove(moverId: string, laneId: string): Promise<boolean> {
    const existing = this.lanes.get(laneId);
    if (!existing || existing.moverId !== moverId) return false;
    return this.lanes.delete(laneId);
  }

  async index(): Promise<LaneIndex> {
    const byMover = new Map<string, PartnerLane[]>();
    for (const lane of this.lanes.values()) {
      const bucket = byMover.get(lane.moverId);
      if (bucket) bucket.push(lane);
      else byMover.set(lane.moverId, [lane]);
    }
    return byMover;
  }
}

/* ------------------------------------------------------------------ seed -- */

const lane = (
  id: string,
  partial: Omit<PartnerLane, "id" | "moverId" | "updatedAt" | "notes" | "status"> &
    Partial<Pick<PartnerLane, "notes" | "status">>,
): PartnerLane => ({
  id,
  moverId: DEMO_PARTNER.id,
  notes: "",
  status: "active",
  updatedAt: new Date().toISOString(),
  ...partial,
});

/**
 * What the demo account already runs.
 *
 * Three standing services and one dated run, because that mix is the point:
 * the timetable is the business, and the dated run is the lorry that happens
 * to be going somewhere next month with space left in it. Dates are relative
 * to today so the seeded run is never in the past.
 */
function seedLanes(): PartnerLane[] {
  const today = todayLocalIso();
  return [
    lane("ln_seed_ber", {
      fromCode: "IST",
      toCode: "BER",
      bothWays: true,
      window: null,
      vehicle: "lorry",
      mode: "road",
      capacityM3: 92,
      notes: "Weekly groupage, departs Thursdays.",
    }),
    lane("ln_seed_muc", {
      fromCode: "IST",
      toCode: "MUC",
      bothWays: true,
      window: null,
      vehicle: "lorry",
      mode: "road",
      capacityM3: 76,
      notes: "Weekly groupage, departs Mondays.",
    }),
    lane("ln_seed_vie", {
      fromCode: "IST",
      toCode: "VIE",
      bothWays: true,
      window: null,
      vehicle: "van",
      mode: "road",
      capacityM3: 26,
      notes: "Small loads and part-moves.",
    }),
    lane("ln_seed_bud", {
      fromCode: "IST",
      toCode: "BUD",
      bothWays: false,
      window: [addDaysIso(today, 24), addDaysIso(today, 30)],
      vehicle: "lorry",
      mode: "road",
      capacityM3: 44,
      notes: "Delivering a job in Budapest — space left on the outbound leg.",
    }),
  ];
}

export const laneRepository: LaneRepository = new InMemoryLaneRepository(seedLanes());
