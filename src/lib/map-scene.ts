import type { GeoPermissibleObjects } from "d3-geo";
import { WORLD } from "@/lib/world-land";
import { getCity } from "@/lib/geo";
import type { City } from "@/lib/geo";

/**
 * Everything the coverage map draws.
 *
 * A flat world, turned so that Istanbul is the middle of it.
 *
 * That is not a flourish. `CORRIDORS` in `geo.ts` is overwhelmingly
 * Türkiye-centric — Türkiye to Western Europe, to Southern Europe, to the
 * Nordics, to the Balkans, to the Middle East, to the CIS, to Central Asia,
 * and the return leg of each. A map drawn on the Greenwich meridian puts the
 * hub every one of those lanes passes through a third of the way in from the
 * left and spends its middle on the Atlantic. Re-centred, the picture is what
 * the corridor table actually says: one hub, and the routes leaving it.
 */

/* ------------------------------------------------------------- the frame -- */

/**
 * The central meridian. Istanbul's own longitude, so the city lands on the
 * vertical centre line and the world wraps behind it — the cut falls in the
 * Pacific at 151°W, which costs us nothing.
 */
export const CENTRE_LON = 28.9784;

/** 360° of longitude across this many units. */
export const VIEW_W = 1440;

/**
 * The latitudes shown.
 *
 * Not the full 90°–to–90°: a sixth of a world map is ice nobody ships to, and
 * cropping it is what lifts the inhabited world — and Istanbul with it — into
 * the middle of the frame. The south stops where Tierra del Fuego and the
 * South Island do, so the crop never looks like a mistake.
 */
export const LAT_N = 76;
export const LAT_S = -50;

const SCALE = VIEW_W / 360;
export const VIEW_H = (LAT_N - LAT_S) * SCALE;

/* ------------------------------------------------------------- the world -- */

/**
 * The land, as two features rather than 177.
 *
 * Every country becomes one of two MultiPolygons — the ones a hub stands in,
 * and the rest. Four paths in the markup instead of seven hundred, and the
 * lit countries read as one shape rather than as scattered bright patches.
 */
function multiPolygon(shapes: typeof WORLD): GeoPermissibleObjects {
  const coordinates: number[][][][] = [];
  for (const shape of shapes) {
    const points: number[][] = [];
    for (let i = 0; i < shape.ring.length; i += 2) {
      points.push([shape.ring[i], shape.ring[i + 1]]);
    }
    // d3 wants the ring closed; rounding in the generator can drop the
    // repeated last point.
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) points.push([first[0], first[1]]);
    coordinates.push([points]);
  }
  return { type: "MultiPolygon", coordinates } as unknown as GeoPermissibleObjects;
}

export const LAND_QUIET = multiPolygon(WORLD.filter((s) => !s.served));
export const LAND_SERVED = multiPolygon(WORLD.filter((s) => s.served));

/* ------------------------------------------------------------- the lanes -- */

/** The hub everything is drawn around. */
export const HUB = "IST";

/**
 * One representative hub per corridor in `geo.ts`, plus the two lanes that
 * do not touch Türkiye at all.
 *
 * `bow` is how far the arc lifts off the straight line and which side it
 * lifts to. On a flat map two lanes leaving the same city at similar angles
 * lie on top of each other; bowing them apart is what keeps a fan of eight
 * readable as eight.
 */
const ROUTES: Array<{ from: string; to: string; bow: number }> = [
  // Türkiye ↔ Western Europe
  { from: "IST", to: "LON", bow: 0.16 },
  { from: "IST", to: "BER", bow: 0.1 },
  // Türkiye ↔ Southern Europe
  { from: "IST", to: "MAD", bow: 0.2 },
  // Türkiye ↔ the Nordics
  { from: "IST", to: "STO", bow: -0.12 },
  // Türkiye ↔ the CIS
  { from: "IST", to: "MOW", bow: -0.14 },
  // Türkiye ↔ Central Asia
  { from: "IST", to: "ALA", bow: -0.16 },
  // Türkiye ↔ the Middle East
  { from: "IST", to: "DXB", bow: 0.14 },
  // The two corridors that never see Istanbul.
  { from: "BER", to: "TAS", bow: -0.22 },
  { from: "MAD", to: "DXB", bow: 0.24 },
];

export interface Lane {
  id: string;
  from: City;
  to: City;
}

export const LANES: Lane[] = ROUTES.map((r) => {
  const from = getCity(r.from);
  const to = getCity(r.to);
  if (!from || !to) return null;
  return { id: `${r.from}-${r.to}`, from, to, bow: r.bow };
}).filter((l): l is Lane & { bow: number } => l !== null);

export const LANE_BOW = new Map(ROUTES.map((r) => [`${r.from}-${r.to}`, r.bow]));

/** Every city on a drawn lane gets a dot and a name. */
export const NODES: City[] = [
  ...new Map(
    LANES.flatMap((l) => [[l.from.code, l.from] as const, [l.to.code, l.to] as const]),
  ).values(),
];

/* ------------------------------------------------------------- the paint -- */

export const PAINT = {
  brand: "#9fe870",
  glow: "#b9f78a",
  land: "rgba(255,255,255,0.07)",
  landEdge: "rgba(255,255,255,0.16)",
  served: "rgba(159,232,112,0.17)",
  servedEdge: "rgba(159,232,112,0.46)",
  graticule: "rgba(255,255,255,0.045)",
  pill: "rgba(22,28,18,0.9)",
  pillEdge: "rgba(255,255,255,0.16)",
  label: "#ffffff",
} as const;

/**
 * Where each name sits relative to its dot.
 *
 * Placed by hand, because nine pills around one city is a packing problem
 * with no good general answer. Stockholm and Moscow take opposite sides so
 * their pills do not touch; Istanbul's sits above its own glow, clear of the
 * eight lanes leaving it.
 */
export const LABELS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  IST: { dx: 0, dy: -30, anchor: "middle" },
  STO: { dx: 0, dy: -20, anchor: "middle" },
  BER: { dx: 0, dy: -20, anchor: "middle" },
  LON: { dx: -14, dy: 0, anchor: "end" },
  MAD: { dx: -14, dy: 0, anchor: "end" },
  MOW: { dx: 14, dy: 0, anchor: "start" },
  ALA: { dx: 16, dy: 0, anchor: "start" },
  TAS: { dx: 0, dy: 24, anchor: "middle" },
  DXB: { dx: 14, dy: 0, anchor: "start" },
};
