import type { GeoPermissibleObjects } from "d3-geo";
import { WORLD } from "@/lib/world-land";
import { getCity } from "@/lib/geo";
import type { City } from "@/lib/geo";

/**
 * Everything the coverage globe draws, independent of how it is drawn.
 *
 * Two renderers share this: a server component that paints one still frame
 * as SVG into the HTML, and a canvas that takes over and turns. Keeping the
 * scene in one place is what stops the frame the visitor sees first from
 * disagreeing with the frame that replaces it.
 */

/* ------------------------------------------------------------- the world -- */

/**
 * One coordinate space, shared by both renderers.
 *
 * The still frame is an SVG with this viewBox; the canvas scales its context
 * so that one canvas unit is one viewBox unit. That is not tidiness — it is
 * what makes the cross-fade work. When the canvas sized its text and its
 * strokes in CSS pixels while the SVG sized them in viewBox units, the two
 * pictures agreed about every coastline and disagreed about every label, and
 * blending them printed each hub name twice.
 *
 * It also means a hub dot and a lane are the same weight relative to the
 * globe at every panel size, instead of a phone getting a small globe with
 * desktop-sized type on it.
 */
export const VIEW = 900;
export const RADIUS = VIEW * 0.46;

/** Where the globe is pointing before it starts turning. */
export const START_LON = 32;

/**
 * The tilt.
 *
 * The globe leans its northern hemisphere towards the viewer, because that is
 * where this network is — a globe presented square-on spends its middle third
 * on an ocean nobody here ships across.
 */
export const TILT = 16;

/** Degrees of longitude per second. A full turn takes three minutes. */
export const SPIN_PER_SECOND = 2;

/**
 * The land, as two features rather than 177.
 *
 * Every country becomes one of two MultiPolygons, so a frame is two fills and
 * two strokes instead of seven hundred path calls. At 30fps that is the
 * difference between a globe that turns and a tab that heats up.
 */
function multiPolygon(countries: typeof WORLD): GeoPermissibleObjects {
  const coordinates: number[][][][] = [];
  for (const country of countries) {
    for (const ring of country.rings) {
      const points: number[][] = [];
      for (let i = 0; i < ring.length; i += 2) points.push([ring[i], ring[i + 1]]);
      // d3 wants the ring closed; the source rings are, but rounding can
      // land the last point on the first and `flatten` then drops it.
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) points.push([first[0], first[1]]);
      coordinates.push([points]);
    }
  }
  return { type: "MultiPolygon", coordinates } as unknown as GeoPermissibleObjects;
}

export const LAND_QUIET = multiPolygon(WORLD.filter((c) => !c.served));
export const LAND_SERVED = multiPolygon(WORLD.filter((c) => c.served));

/* ------------------------------------------------------------- the lanes -- */

/**
 * Six real corridors.
 *
 * On a sphere they need no bowing to keep them apart: a great circle between
 * two hubs already takes its own path across the face, and d3 resamples each
 * one along the geodesic, so these draw as the routes an aircraft or a lorry
 * convoy would actually trace rather than as decorative swoops.
 */
const ROUTES: Array<[from: string, to: string]> = [
  ["LON", "IST"],
  ["STO", "IST"],
  ["MAD", "DXB"],
  ["BER", "TAS"],
  ["MOW", "ALA"],
  ["IST", "DXB"],
];

export interface Lane {
  id: string;
  from: City;
  to: City;
  a: [number, number];
  b: [number, number];
}

export const LANES: Lane[] = ROUTES.map(([from, to]) => {
  const a = getCity(from);
  const b = getCity(to);
  if (!a || !b) return null;
  return {
    id: `${from}-${to}`,
    from: a,
    to: b,
    a: [a.lon, a.lat] as [number, number],
    b: [b.lon, b.lat] as [number, number],
  };
}).filter((lane): lane is Lane => lane !== null);

/** Every city on a drawn lane gets a dot, and its name. */
export const NODES: City[] = [
  ...new Map(LANES.flatMap((l) => [[l.from.code, l.from] as const, [l.to.code, l.to] as const])).values(),
];

/** One `MultiLineString`, so the six lanes are a single stroke. */
export const LANE_LINES: GeoPermissibleObjects = {
  type: "MultiLineString",
  coordinates: LANES.map((l) => [l.a, l.b]),
} as unknown as GeoPermissibleObjects;

/* ------------------------------------------------------------- the paint -- */

/**
 * The palette, as plain rgba.
 *
 * Canvas cannot read a CSS custom property, and the panel behind the globe is
 * the one surface in the system that is dark in both themes — so these are
 * fixed rather than themed, and the brand green is the literal token value.
 */
export const PAINT = {
  brand: "#9fe870",
  glow: "#b9f78a",
  ocean: "#0a1007",
  oceanRim: "#121d0d",
  land: "rgba(255,255,255,0.1)",
  landEdge: "rgba(255,255,255,0.2)",
  served: "rgba(159,232,112,0.2)",
  servedEdge: "rgba(159,232,112,0.55)",
  graticule: "rgba(255,255,255,0.06)",
  label: "#ffffff",
  labelRim: "#0b0e0a",
} as const;

/**
 * Labels, placed greedily.
 *
 * Nine hub names on a sphere will collide — London and Berlin are four
 * hundred miles apart and about eleven pixels apart at this scale. There is
 * no hand-placing them the way a flat map can, because the arrangement
 * changes every frame as the globe turns.
 *
 * So: the hubs nearest the centre of the face claim their space first, and a
 * name that would land on top of one already placed is dropped for that
 * frame. Dropping is the right failure — a hub whose name is hidden still
 * has its dot, and two names printed over each other costs both of them.
 */
export interface Placed {
  x: number;
  y: number;
  text: string;
  fade: number;
}

export function placeLabels(
  candidates: Array<{ x: number; y: number; text: string; fade: number }>,
  measure: (text: string) => number,
  lineHeight: number,
): Placed[] {
  const taken: Array<[number, number, number, number]> = [];
  const placed: Placed[] = [];

  for (const c of [...candidates].sort((a, b) => b.fade - a.fade)) {
    const w = measure(c.text);
    const box: [number, number, number, number] = [
      c.x + 5,
      c.y - lineHeight / 2,
      c.x + 9 + w,
      c.y + lineHeight / 2,
    ];
    const clash = taken.some(
      ([l, t, r, b]) => box[0] < r && box[2] > l && box[1] < b && box[3] > t,
    );
    if (clash) continue;
    taken.push(box);
    placed.push(c);
  }
  return placed;
}
