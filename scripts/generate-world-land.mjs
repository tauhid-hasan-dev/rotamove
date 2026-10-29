/**
 * Build-time geometry for the coverage map.
 *
 *   node scripts/generate-world-land.mjs
 *
 * Turns Natural Earth's country polygons (via `world-atlas`) into the SVG
 * paths `src/lib/world-land.ts` ships, already projected into the map's own
 * frame and clipped to it. The map used to draw a hand-written dot mask of
 * land; this is the real coastline instead.
 *
 * Done at build time rather than in the component for three reasons: the
 * source topology is megabytes and none of it should reach the browser, the
 * projection maths wants a real geo library that the app otherwise has no
 * use for, and the output is a pure function of two files in this repo — so
 * the committed result is reproducible by re-running this script.
 *
 * Frame constants and hub coordinates are read out of the app's own source,
 * not restated here. A map whose land and whose lanes were plotted from two
 * different sets of numbers is exactly the failure this avoids.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { geoIdentity, geoPath, geoContains } from "d3-geo";
import { feature } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------- the app's own numbers -- */

function readConst(source, name) {
  const match = source.match(new RegExp(`${name}\\s*=\\s*(-?[\\d.]+)`));
  if (!match) throw new Error(`could not find ${name} in map-projection.ts`);
  return Number(match[1]);
}

const projectionSrc = readFileSync(join(root, "src/lib/map-projection.ts"), "utf8");
const LON_W = readConst(projectionSrc, "LON_W");
const LON_E = readConst(projectionSrc, "LON_E");
const LAT_N = readConst(projectionSrc, "LAT_N");
const LAT_S = readConst(projectionSrc, "LAT_S");
const VIEW_W = readConst(projectionSrc, "VIEW_W");
const VIEW_H = (VIEW_W * (LAT_N - LAT_S)) / (LON_E - LON_W);

/** Hub coordinates, straight out of `RAW_CITIES`. */
const geoSrc = readFileSync(join(root, "src/lib/geo.ts"), "utf8");
const HUBS = [...geoSrc.matchAll(/\["[A-Z]{3}",\s*"[^"]+",\s*"[A-Z]{2}",\s*(-?[\d.]+),\s*(-?[\d.]+)/g)].map(
  (m) => [Number(m[2]), Number(m[1])], // [lon, lat], the order d3 wants
);
if (HUBS.length === 0) throw new Error("no hubs parsed out of geo.ts");

/* ------------------------------------------------------------ projection -- */

/*
 * Equirectangular is linear in both axes, so it is just a uniform scale with
 * the y axis flipped — which means `geoIdentity` can express it, and unlike a
 * hand-rolled transform it brings `clipExtent` with it. Clipping at source is
 * what keeps Siberia and the Sahara out of the shipped file instead of
 * shipping them to be thrown away by the SVG viewport.
 */
const scale = VIEW_W / (LON_E - LON_W);
const projection = geoIdentity()
  .reflectY(true)
  .scale(scale)
  .translate([-LON_W * scale, LAT_N * scale])
  .clipExtent([
    [0, 0],
    [VIEW_W, VIEW_H],
  ]);

const toPath = geoPath(projection);

/** Six significant figures of a 1400-unit viewBox is noise. One decimal is not. */
const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

/* ----------------------------------------------------------------- build -- */

const topology = JSON.parse(
  readFileSync(join(root, "node_modules/world-atlas/countries-110m.json"), "utf8"),
);
const countries = feature(topology, topology.objects.countries).features;

const shapes = [];
for (const country of countries) {
  const d = toPath(country);
  if (!d) continue; // entirely outside the frame

  shapes.push({
    name: country.properties?.name ?? "",
    // Served if a hub stands on it. Tested against the polygon rather than
    // matched on a country name or ISO code: the hub list already knows where
    // it is, and no two datasets agree on what to call Türkiye.
    served: HUBS.some((hub) => geoContains(country, hub)),
    d: round(d),
  });
}

shapes.sort((a, b) => a.name.localeCompare(b.name));

const served = shapes.filter((s) => s.served).length;

const out = `/**
 * Real country outlines for the coverage map. GENERATED — do not edit.
 *
 *   node scripts/generate-world-land.mjs
 *
 * Natural Earth 1:50m country polygons (public domain, via \`world-atlas\`),
 * projected into the frame declared in \`map-projection.ts\` and clipped to it.
 * \`served\` is true where one of the hubs in \`geo.ts\` stands on the country,
 * so the shading cannot claim a country the search cannot quote.
 *
 * ${shapes.length} countries in frame, ${served} of them served.
 */

export interface LandShape {
  /** Country name, for the generator's benefit and for debugging. Not rendered. */
  name: string;
  /** True when a hub in \`geo.ts\` falls inside this country. */
  served: boolean;
  /** SVG path data, already in \`map-projection.ts\` view units. */
  d: string;
}

export const LAND_SHAPES: LandShape[] = [
${shapes.map((s) => `  { name: ${JSON.stringify(s.name)}, served: ${s.served}, d: ${JSON.stringify(s.d)} },`).join("\n")}
];
`;

const target = join(root, "src/lib/world-land.ts");
writeFileSync(target, out, "utf8");
console.log(
  `world-land.ts: ${shapes.length} countries (${served} served), ${(out.length / 1024).toFixed(0)} KB`,
);
