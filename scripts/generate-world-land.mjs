/**
 * Build-time geometry for the coverage globe.
 *
 *   npm run generate:map
 *
 * Turns Natural Earth's country polygons (via `world-atlas`) into the compact
 * lon/lat rings `src/lib/world-land.ts` ships.
 *
 * Unprojected, deliberately. The globe re-projects every frame as it turns,
 * so what it needs is geography, not a picture of geography — the projection
 * is the renderer's job, on the server for the still frame and in the canvas
 * for the live one.
 *
 * Done at build time rather than in the component because the source topology
 * is megabytes of quantised arcs, none of which should reach a browser, and
 * because the output is a pure function of two files in this repo: re-running
 * this script reproduces it exactly.
 *
 * Hub coordinates are read out of the app's own source rather than restated
 * here. A globe that lit different countries from the ones the search can
 * quote is exactly the failure this avoids.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoCentroid, geoContains, geoDistance } from "d3-geo";
import { feature } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------- the app's own numbers -- */

/** Hub coordinates, straight out of `RAW_CITIES`. */
const geoSrc = readFileSync(join(root, "src/lib/geo.ts"), "utf8");
const HUBS = [
  ...geoSrc.matchAll(/\["[A-Z]{3}",\s*"[^"]+",\s*"[A-Z]{2}",\s*(-?[\d.]+),\s*(-?[\d.]+)/g),
].map((m) => [Number(m[2]), Number(m[1])]); // [lon, lat], the order d3 wants
if (HUBS.length === 0) throw new Error("no hubs parsed out of geo.ts");

/* ----------------------------------------------------------------- build -- */

/**
 * One decimal degree is about 11km, which is a third of a pixel on a globe
 * drawn 600px wide. Anything finer is bytes the visitor downloads and cannot
 * see. Rounding also collapses runs of near-identical coastline points, which
 * is where most of the saving actually comes from.
 */
const q = (n) => Math.round(n * 10) / 10;

/**
 * Islands too small to draw.
 *
 * At this scale a ring under about a quarter of a degree across lands inside
 * one pixel, so it costs bytes and renders as nothing. Kept regardless if a
 * hub stands on it — Bahrain and Singapore are small and are not optional.
 */
function ringWorthDrawing(ring, keepAnyway) {
  if (keepAnyway) return true;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return maxLon - minLon > 0.25 || maxLat - minLat > 0.25;
}

/** Flat `[lon, lat, lon, lat, …]`, with points the rounding made duplicates dropped. */
function flatten(ring) {
  const out = [];
  for (const [lon, lat] of ring) {
    const x = q(lon);
    const y = q(lat);
    if (out.length >= 2 && out[out.length - 2] === x && out[out.length - 1] === y) continue;
    out.push(x, y);
  }
  // A ring that collapsed to a line under rounding is not a shape any more.
  return out.length >= 8 ? out : null;
}

const topology = JSON.parse(
  readFileSync(join(root, "node_modules/world-atlas/countries-110m.json"), "utf8"),
);
const countries = feature(topology, topology.objects.countries).features;

/**
 * How far from a hub a separate landmass can be and still count as served.
 *
 * Lighting a whole country because one hub stands somewhere in it put a green
 * patch on South America: `world-atlas` draws French Guiana as part of
 * France, and France has Paris in it. Sicily, Northern Ireland and Jutland
 * have exactly the same shape of problem in reverse — no hub inside them
 * either, and obviously served.
 *
 * So the rule is per-landmass and the test is distance: a ring is lit if a
 * hub stands on it, or if its centroid is within this of one. Twenty degrees
 * is about 2,200km — far enough to reach a country's own islands, nowhere
 * near far enough to reach its other hemisphere.
 */
const RING_REACH = (20 * Math.PI) / 180;

const out = [];
let points = 0;

for (const country of countries) {
  // Tested against the geometry rather than matched on a country name or ISO
  // code: the hub list already knows where it is, and no two datasets agree
  // on what to call Türkiye.
  const hubsHere = HUBS.filter((hub) => geoContains(country, hub));

  const polygons =
    country.geometry.type === "Polygon"
      ? [country.geometry.coordinates]
      : country.geometry.coordinates;

  for (const polygon of polygons) {
    // Outer ring only. Holes at 110m are a handful of inland seas, and a
    // filled map reads perfectly well without them.
    const outer = polygon[0];
    const keep = hubsHere.length > 0 && outer.length < 40;
    if (!ringWorthDrawing(outer, keep)) continue;
    const flat = flatten(outer);
    if (!flat) continue;

    let served = false;
    if (hubsHere.length) {
      const poly = { type: "Polygon", coordinates: [outer] };
      served = hubsHere.some((hub) => geoContains(poly, hub));
      if (!served) {
        const centre = geoCentroid(poly);
        served = hubsHere.some((hub) => geoDistance(centre, hub) < RING_REACH);
      }
    }

    out.push({ name: country.properties?.name ?? "", served, ring: flat });
    points += flat.length / 2;
  }
}

out.sort((a, b) => a.name.localeCompare(b.name) || b.ring.length - a.ring.length);
const served = out.filter((c) => c.served).length;

const file = `/**
 * The world, as lon/lat rings. GENERATED — do not edit.
 *
 *   npm run generate:map
 *
 * Natural Earth 1:110m country polygons (public domain, via \`world-atlas\`),
 * rounded to a tenth of a degree and flattened to \`[lon, lat, lon, lat, …]\`.
 *
 * One entry per landmass, not per country, because \`served\` is a fact about
 * a landmass: a hub stands on it, or stands within reach of it. That is what
 * keeps French Guiana dark while Paris lights France, and lights Sicily
 * because Rome is 600km away. See \`RING_REACH\` in the generator.
 *
 * Unprojected on purpose — the map projects these itself.
 *
 * ${out.length} landmasses, ${served} served, ${points.toLocaleString("en-GB")} points.
 */

export interface LandShape {
  /** For debugging and for the generator's benefit. Never rendered. */
  name: string;
  /** True when a hub in \`geo.ts\` stands on this landmass or within reach of it. */
  served: boolean;
  /** The outer ring, flat: \`[lon, lat, lon, lat, …]\`. */
  ring: number[];
}

export const WORLD: LandShape[] = ${JSON.stringify(out)};
`;

const target = join(root, "src/lib/world-land.ts");
writeFileSync(target, file, "utf8");
console.log(
  `world-land.ts: ${out.length} landmasses (${served} served), ${points} points, ${(file.length / 1024).toFixed(0)} KB`,
);
