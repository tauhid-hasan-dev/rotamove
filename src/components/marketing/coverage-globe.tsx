import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { Shell } from "@/components/common/section";
import { GlobeMount } from "@/components/marketing/globe-mount";
import { CITIES, CORRIDORS } from "@/lib/geo";
import {
  LANE_LINES,
  LAND_QUIET,
  LAND_SERVED,
  NODES,
  PAINT,
  RADIUS,
  START_LON,
  TILT,
  VIEW,
  placeLabels,
} from "@/lib/globe-scene";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * The coverage globe.
 *
 * The whole world, turning, with the corridors this network runs drawn on it
 * and a shipment travelling each one. It was a flat map of one region — which
 * was honest about where the lanes are but could not show a route as the
 * curve it actually is, and quietly implied the world stopped at the Tian
 * Shan.
 *
 * What the server sends is this: one still frame of the sphere, as SVG, at
 * the rotation the canvas starts from. It is a complete picture on its own —
 * it survives JavaScript being off, it paints with the HTML, and it holds the
 * panel's height so nothing moves when the live globe arrives. `GlobeMount`
 * then fades the canvas in over it. See `globe-canvas.tsx` for what the live
 * one costs and when it refuses to spend it.
 *
 * Both renderers read `globe-scene.ts`, so the frame that arrives first and
 * the frame that replaces it cannot disagree.
 *
 * The countries lit are the ones a hub in `geo.ts` physically stands in. No
 * route and no shading here is decoration.
 */

/* ------------------------------------------------------------ still frame -- */

const projection = geoOrthographic()
  .clipAngle(90)
  .precision(0.4)
  .translate([VIEW / 2, VIEW / 2])
  .scale(RADIUS)
  .rotate([-START_LON, -TILT]);

const rawPath = geoPath(projection);

/**
 * One decimal, not six.
 *
 * `geoPath` writes full float precision, which on a 900-unit viewBox means
 * ten characters to place something to within a billionth of a pixel. Over a
 * hemisphere of coastline that was 120KB of HTML on every page, for a globe
 * drawn at most 620px wide. Rounding costs nothing visible and takes the
 * still frame back under half its size.
 */
const toPath = (object: Parameters<typeof rawPath>[0]) =>
  (rawPath(object) ?? "").replace(/\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

/** Where the globe is looking, for the facing test. */
const CENTRE: [number, number] = [START_LON, TILT];

const facing = (lon: number, lat: number) =>
  geoDistance([lon, lat], CENTRE) < Math.PI / 2 - 0.02;

/** Hubs on this side of the sphere, with their screen positions. */
const visibleNodes = NODES.flatMap((city) => {
  if (!facing(city.lon, city.lat)) return [];
  const xy = projection([city.lon, city.lat]);
  if (!xy) return [];
  const away = geoDistance([city.lon, city.lat], CENTRE) / (Math.PI / 2);
  const fade = Math.max(0, Math.min(1, (1 - away) * 2.6));
  return [{ city, x: xy[0], y: xy[1], fade }];
});

/**
 * Which names fit, by the same rule the canvas uses.
 *
 * There is no `measureText` on a server, so the width is estimated from the
 * glyph count at this size. It only has to be close: the rule is "does this
 * name land on one already placed", and a few pixels either way changes the
 * answer for no pair of hubs on this face.
 */
const stillLabels = placeLabels(
  visibleNodes
    .filter((n) => n.fade > 0.45)
    .map((n) => ({ x: n.x, y: n.y, text: n.city.name, fade: n.fade })),
  (text) => text.length * 6.6,
  14,
);
const labelled = new Set(stillLabels.map((l) => l.text));

/* ------------------------------------------------------------------ view -- */

export function CoverageGlobe({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const wm = dict.worldMap;

  const countries = new Set(CITIES.map((c) => c.country)).size;
  const stats = [
    { value: formatNumber(locale, CITIES.length), label: wm.statCities },
    { value: formatNumber(locale, countries), label: wm.statCountries },
    { value: formatNumber(locale, CORRIDORS.length), label: wm.statCorridors },
  ];

  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{wm.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.02]">{wm.title}</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">{wm.lede}</p>
        </div>

        <figure className="relative mt-12 overflow-hidden rounded-3xl bg-map-ink">
          {/* The panel's height is set here and nowhere else, so the still
              frame and the canvas that replaces it occupy exactly the same
              box and the swap costs no layout. */}
          <div className="relative mx-auto aspect-square w-full max-w-[620px] sm:aspect-[4/3] sm:max-w-none lg:aspect-[16/9]">
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 block size-full"
              role="img"
              aria-label={wm.mapLabel}
            >
              <defs>
                {/* Lit from the upper left, so the disc reads as a sphere. */}
                <radialGradient id="globe-sea" cx="33%" cy="30%" r="78%">
                  <stop offset="0%" stopColor={PAINT.oceanRim} />
                  <stop offset="100%" stopColor={PAINT.ocean} />
                </radialGradient>
                {/* A hairline of atmosphere hugging the limb, not a halo. */}
                <radialGradient id="globe-air" cx="50%" cy="50%" r="50%">
                  <stop offset="93%" stopColor="rgba(159,232,112,0)" />
                  <stop offset="94.5%" stopColor="rgba(159,232,112,0.17)" />
                  <stop offset="100%" stopColor="rgba(159,232,112,0)" />
                </radialGradient>
              </defs>

              {/* atmosphere */}
              <circle cx={VIEW / 2} cy={VIEW / 2} r={RADIUS * 1.06} fill="url(#globe-air)" />

              {/* ocean */}
              <path d={toPath({ type: "Sphere" })} fill="url(#globe-sea)" />

              {/* graticule */}
              <path
                d={toPath(geoGraticule10())}
                fill="none"
                stroke={PAINT.graticule}
                strokeWidth="1"
              />

              {/* land */}
              <path
                d={toPath(LAND_QUIET)}
                fill={PAINT.land}
                stroke={PAINT.landEdge}
                strokeWidth="0.7"
              />
              <path
                d={toPath(LAND_SERVED)}
                fill={PAINT.served}
                stroke={PAINT.servedEdge}
                strokeWidth="0.9"
              />

              {/* lanes */}
              <path
                d={toPath(LANE_LINES)}
                fill="none"
                stroke="rgba(159,232,112,0.55)"
                strokeWidth="1.6"
              />

              {/* hubs */}
              {visibleNodes.map(({ city, x, y, fade }) => (
                <g key={city.code} opacity={Math.max(0.25, fade)}>
                  <circle cx={x} cy={y} r="3.2" fill={PAINT.brand} />
                  {labelled.has(city.name) && (
                    <text
                      x={x + 7}
                      y={y}
                      dominantBaseline="middle"
                      fontSize="12"
                      fontWeight="500"
                      fill={PAINT.label}
                      stroke={PAINT.labelRim}
                      strokeWidth="3"
                      paintOrder="stroke"
                      // The globe is a picture, not a reading order; the
                      // names are already in the caption's description.
                      aria-hidden
                    >
                      {city.name}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            <GlobeMount label={wm.mapLabel} />
          </div>

          <figcaption className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pb-6 text-[13px] text-white/60 sm:px-8 sm:pb-8">
            <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" aria-hidden />
                {wm.legendHub}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-[2px] bg-brand/30 ring-1 ring-brand/60" aria-hidden />
                {wm.legendServed}
              </span>
            </span>
            <span>{wm.legendNote}</span>
          </figcaption>
        </figure>

        <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border bg-card p-5 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-[28px] font-semibold tracking-[-0.04em] tnum">
                  {stat.value}
                </span>
                <span className="mt-1 block text-[13px] text-muted-foreground">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Shell>
    </section>
  );
}
