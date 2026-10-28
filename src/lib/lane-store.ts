import { nanoid } from "nanoid";
import { addDaysIso, todayLocalIso } from "@/lib/calendar";
import { DEFAULT_ACCOUNT } from "@/lib/partner-session";
import {
  lastCallActive,
  lastCallEndAt,
  lastCallWindow,
  type LaneInput,
  type LanePatch,
  type LastCallHours,
  type PartnerLane,
} from "@/lib/lanes";
import { MOVERS } from "@/lib/movers";

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
  /** One lane by id, regardless of owner — the public board links by id. */
  get(laneId: string): Promise<PartnerLane | null>;
  create(moverId: string, input: LaneInput): Promise<PartnerLane>;
  update(moverId: string, laneId: string, patch: LanePatch): Promise<PartnerLane | null>;
  remove(moverId: string, laneId: string): Promise<boolean>;
  /** Every active partner's lanes, for one matching run. */
  index(): Promise<LaneIndex>;
  /**
   * Live last-call offers across every partner, soonest to expire first.
   *
   * Takes the clock as an argument for the same reason the lead board does:
   * the server and the client have to agree on which offers are still open.
   */
  activeLastCall(nowMs: number): Promise<PartnerLane[]>;
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

  async get(laneId: string): Promise<PartnerLane | null> {
    return this.lanes.get(laneId) ?? null;
  }

  async activeLastCall(nowMs: number): Promise<PartnerLane[]> {
    return [...this.lanes.values()]
      .filter((lane) => lastCallActive(lane, nowMs))
      .sort(
        (a, b) =>
          Date.parse(lastCallEndAt(a.lastCall!)) - Date.parse(lastCallEndAt(b.lastCall!)),
      );
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
  partial: Omit<
    PartnerLane,
    "id" | "moverId" | "updatedAt" | "notes" | "status" | "lastCall"
  > &
    Partial<Pick<PartnerLane, "notes" | "status" | "lastCall">>,
): PartnerLane => ({
  id,
  moverId: DEFAULT_ACCOUNT.mover.id,
  notes: "",
  status: "active",
  lastCall: null,
  updatedAt: new Date().toISOString(),
  ...partial,
});

/**
 * A last-call lane that is genuinely live right now.
 *
 * Anchored on the current clock rather than a fixed date: the seed has to be
 * inside its own window on every restart, or the public last-call page opens
 * empty and the feature looks broken.
 */
function lastCallLane(
  id: string,
  partial: Omit<
    PartnerLane,
    "id" | "moverId" | "updatedAt" | "notes" | "status" | "lastCall" | "window"
  > & { notes?: string },
  hours: LastCallHours,
  startOffsetHours: number,
  moverId: string = DEFAULT_ACCOUNT.mover.id,
): PartnerLane {
  const startAt = new Date(Date.now() + startOffsetHours * 3_600_000).toISOString();
  const lastCall = { hours, startAt };
  return {
    id,
    moverId,
    notes: "",
    status: "active",
    lastCall,
    window: lastCallWindow(lastCall),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

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

    // Live last-call offers. Spread across partners and durations so the
    // public board has something real to show on a cold start; the page
    // never names the carrier, which is why other movers appear here.
    lastCallLane(
      "ln_lc_ber",
      {
        fromCode: "IST",
        toCode: "BER",
        bothWays: false,
        vehicle: "lorry",
        mode: "road",
        capacityM3: 38,
        notes: "Trailer loads tomorrow morning — 38 m³ still open.",
      },
      24,
      2,
    ),
    lastCallLane(
      "ln_lc_mil",
      {
        fromCode: "IST",
        toCode: "MIL",
        bothWays: false,
        vehicle: "lorry",
        mode: "road",
        capacityM3: 62,
        notes: "Groupage to Milan, part-load space.",
      },
      48,
      6,
      MOVERS[3]?.id ?? DEFAULT_ACCOUNT.mover.id,
    ),
    lastCallLane(
      "ln_lc_ams",
      {
        fromCode: "IST",
        toCode: "AMS",
        bothWays: false,
        vehicle: "van",
        mode: "road",
        capacityM3: 18,
        notes: "Van returning via Amsterdam, small loads only.",
      },
      72,
      12,
      MOVERS[6]?.id ?? DEFAULT_ACCOUNT.mover.id,
    ),
    lastCallLane(
      "ln_lc_sof",
      {
        fromCode: "SOF",
        toCode: "IST",
        bothWays: false,
        vehicle: "lorry",
        mode: "road",
        capacityM3: 50,
        notes: "Backload from Sofia, departs this evening.",
      },
      24,
      5,
      MOVERS[9]?.id ?? DEFAULT_ACCOUNT.mover.id,
    ),
  ];
}

export const laneRepository: LaneRepository = new InMemoryLaneRepository(seedLanes());
