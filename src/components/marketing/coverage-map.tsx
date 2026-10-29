import { geoEquirectangular, geoGraticule, geoPath } from "d3-geo";
import { Shell } from "@/components/common/section";
import { CITIES, CORRIDORS } from "@/lib/geo";
import {
  CENTRE_LON,
  HUB,
  LABELS,
  LANES,
  LANE_BOW,
  LAND_QUIET,
  LAND_SERVED,
  LAT_N,
  LAT_S,
  NODES,
  PAINT,
  VIEW_H,
  VIEW_W,
} from "@/lib/map-scene";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * The coverage map.
 *
 * The whole world, flat, turned so Istanbul sits in the middle of it, with
 * the corridors this network runs fanning out from there and a shipment
 * travelling each one.
 *
 * Entirely server-rendered. No canvas, no client JavaScript, no lazily
 * fetched geometry — the page ships a picture and the only thing that moves
 * is a CSS dash travelling a path. A turning globe was the wrong amount of
 * machinery for a map whose job is to answer "do you go where I need?" in
 * one glance.
 *
 * Why Istanbul is the centre, and why the lanes fan from it, is in
 * `map-scene.ts`: it is what the corridor table says.
 */

/* ------------------------------------------------------------ projection -- */

/*
 * `rotate` is what re-centres the world. d3 cuts the map at the antimeridian
 * of the rotated frame — 151°W, mid-Pacific — and splits any country that
 * crosses it, which is why Chukotka and the Aleutians appear at the correct
 * edge rather than smeared across the whole frame.
 */
const projection = geoEquirectangular()
  .rotate([-CENTRE_LON, 0])
  .scale(VIEW_W / (2 * Math.PI))
  .translate([VIEW_W / 2, VIEW_H / 2 + ((LAT_N + LAT_S) / 2) * (VIEW_W / 360)])
  .precision(0.5);

const rawPath = geoPath(projection);

/**
 * Whole units, and d3 writes six decimals.
 *
 * The frame is 1440 units wide and is drawn at most 1150px, so one unit is
 * four fifths of a pixel and the decimals are placing coastline to within a
 * billionth of one. Over two hemispheres of it that was 60KB of HTML on
 * every page in every language. Rounding is invisible and it is most of the
 * file.
 */
const toPath = (object: Parameters<typeof rawPath>[0]) =>
  (rawPath(object) ?? "").replace(/\d+\.\d+/g, (n) => String(Math.round(Number(n))));

const at = (lon: number, lat: number): [number, number] => {
  const xy = projection([lon, lat]);
  return xy ? [Math.round(xy[0] * 10) / 10, Math.round(xy[1] * 10) / 10] : [0, 0];
};

/**
 * A lane as a bowed arc in screen space.
 *
 * Deliberately not a geodesic. A great circle from Istanbul to Madrid is very
 * nearly the straight line between them at this scale, so nine of them leave
 * the same dot as one thick smudge. The control point is pushed perpendicular
 * to the chord instead: `bow` picks the side and the size, and the fan reads
 * as nine separate routes.
 */
function arc(x1: number, y1: number, x2: number, y2: number, bow: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const lift = length * bow;
  const cx = (x1 + x2) / 2 + (dy / length) * lift;
  const cy = (y1 + y2) / 2 - (dx / length) * lift;
  return `M ${x1} ${y1} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2} ${y2}`;
}

const lanes = LANES.map((lane) => {
  const [x1, y1] = at(lane.from.lon, lane.from.lat);
  const [x2, y2] = at(lane.to.lon, lane.to.lat);
  return { id: lane.id, d: arc(x1, y1, x2, y2, LANE_BOW.get(lane.id) ?? 0.15) };
});

const nodes = NODES.map((city) => {
  const [x, y] = at(city.lon, city.lat);
  return { city, x, y, hub: city.code === HUB, label: LABELS[city.code] };
});

const hub = nodes.find((n) => n.hub);

/**
 * Every other hub, as a dot with no name.
 *
 * Nine labelled cities on a world map is a thin-looking network; ninety-one
 * dots is the network. These are the rest of `CITIES` — real places the
 * search can quote from — and they do the job the lanes cannot, which is to
 * show the density of the thing rather than its reach. Unlabelled on
 * purpose: the names are in the coverage list further down the page, and
 * ninety-one of them here would be a wall of type.
 */
const named = new Set(NODES.map((c) => c.code));
const minorDots = CITIES.filter((c) => !named.has(c.code)).map((city) => {
  const [x, y] = at(city.lon, city.lat);
  return { code: city.code, x, y };
});

/** 20° meridians and 20° parallels, clipped to the frame. */
const graticule = geoGraticule()
  .step([20, 20])
  .extent([
    [-180, LAT_S],
    [180, LAT_N],
  ]);

/* ------------------------------------------------------------------ view -- */

export function CoverageMap({ dict, locale }: { dict: Dictionary; locale: Locale }) {
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
          {/*
            The panel sets its own height at every width and the map is told
            to cover it. `xMidYMid slice` crops from the edges inwards —
            which, on a map centred on Istanbul, means it gives up the
            Pacific first and the network last.

            That is the whole reason to re-centre: the crop that makes a
            world map legible on a 360px phone is exactly the crop that would
            have cut this network in half on a Greenwich-centred one. Here it
            zooms into the corridors instead.
          */}
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid slice"
            className="relative block h-[300px] w-full sm:h-[400px] lg:h-[470px]"
            role="img"
            aria-label={wm.mapLabel}
          >
            <defs>
              {/* Enough to say "here", not enough to bleach the continent
                  it sits on. The first version of this washed out Europe,
                  the Gulf and every lane leaving the city it was meant to
                  be pointing at. */}
              <radialGradient id="map-hub-glow">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="map-lane" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            <g stroke={PAINT.graticule} strokeWidth="1" fill="none" aria-hidden>
              <path d={toPath(graticule())} />
            </g>

            {/* Land. The whole frame first so the coastline is continuous,
                then the served countries over it — one pass with per-country
                fills leaves unlit borders drawn on top of lit fills. */}
            <path
              d={toPath(LAND_QUIET)}
              fill={PAINT.land}
              stroke={PAINT.landEdge}
              strokeWidth="0.6"
            />
            <path
              d={toPath(LAND_SERVED)}
              fill={PAINT.served}
              stroke={PAINT.servedEdge}
              strokeWidth="0.8"
            />

            {/* The wash sits behind the hub rather than behind the middle of
                the canvas — on this projection they are the same place, which
                is the whole point of the projection. */}
            {hub && (
              <circle cx={hub.x} cy={hub.y} r="155" fill="url(#map-hub-glow)" aria-hidden />
            )}

            {/* The rest of the network, before the lanes so the arcs run over
                the dots rather than under them. */}
            <g fill="#ffffff" fillOpacity="0.4" aria-hidden>
              {minorDots.map((dot) => (
                <circle key={dot.code} cx={dot.x} cy={dot.y} r="1.9" />
              ))}
            </g>

            {lanes.map((lane, i) => (
              <g key={lane.id}>
                <path d={lane.d} fill="none" stroke="url(#map-lane)" strokeWidth="1.9" />
                {/* The shipment. A short dash chasing a long gap along the
                    same path reads as something moving between two cities
                    without costing a second element to animate. */}
                <path
                  className="coverage-pulse"
                  d={lane.d}
                  fill="none"
                  stroke="var(--brand-glow)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ animationDelay: `${i * 0.9}s` }}
                />
              </g>
            ))}

            {nodes.map(({ city, x, y, hub: isHub, label }) => {
              const name = city.name.toUpperCase();
              // The pill is sized from the glyph count: there is no text
              // metric on a server, and at this size the estimate is within
              // a couple of units either way.
              const w = name.length * 6.4 + 18;
              const dx = label?.dx ?? 14;
              const dy = label?.dy ?? -18;
              const anchor = label?.anchor ?? "start";
              const px = anchor === "middle" ? x - w / 2 : anchor === "end" ? x + dx - w : x + dx;

              return (
                <g key={city.code}>
                  {/* The dot: a ring with a lit centre, so a hub reads as a
                      place rather than as a full stop. */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHub ? 9 : 6}
                    fill={isHub ? "var(--brand)" : "rgba(255,255,255,0.14)"}
                    fillOpacity={isHub ? 0.25 : 1}
                  />
                  <circle cx={x} cy={y} r={isHub ? 4 : 2.6} fill={isHub ? "var(--brand)" : "#ffffff"} />

                  {label && (
                    <>
                      <rect
                        x={px}
                        y={y + dy - 9}
                        width={w}
                        height="18"
                        rx="9"
                        fill={isHub ? "var(--brand)" : PAINT.pill}
                        stroke={isHub ? "none" : PAINT.pillEdge}
                        strokeWidth="0.8"
                      />
                      <text
                        x={px + w / 2}
                        y={y + dy + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        letterSpacing="0.6"
                        fill={isHub ? "var(--ink)" : PAINT.label}
                        // The map is a picture, not a reading order; the
                        // names are already in the caption's description.
                        aria-hidden
                      >
                        {name}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

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
