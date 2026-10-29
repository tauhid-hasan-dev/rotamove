import { Shell } from "@/components/common/section";
import { CITIES, CORRIDORS, getCity } from "@/lib/geo";
import { LAND_SHAPES } from "@/lib/world-land";
import { LAT_N, LAT_S, LON_E, LON_W, VIEW_H, VIEW_W, projectX, projectY } from "@/lib/map-projection";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * The coverage map.
 *
 * Real coastlines, with the corridors the network actually runs drawn over
 * them and a pulse travelling each lane. Everything is plotted from the same
 * city coordinates the search uses, so the picture cannot drift away from the
 * product: add a hub to `geo.ts` and it appears here.
 *
 * The land was a hand-written dot mask — longitude spans typed out per
 * parallel — which was honest about being a suggestion but rendered Italy as
 * a smudge and put the Gulf in roughly the right place. It is Natural Earth
 * country geometry now, projected at build time by
 * `scripts/generate-world-land.mjs` into the frame in `map-projection.ts`.
 * The countries a hub stands in are lit; the rest of the world is there to
 * be recognised, not to be claimed.
 *
 * It was a whole-world map and is now a map of the world this network works
 * in — Europe, North Africa, the Levant and Gulf, the Caucasus and Central
 * Asia. Showing the Pacific to prove we are global was spending two thirds
 * of the canvas on an argument the lanes themselves refute.
 *
 * Rendered on the server: no clock, no randomness, no interaction, so there
 * is nothing for the client to disagree with.
 */

/* ------------------------------------------------------------- the routes -- */

/**
 * Six real lanes.
 *
 * Chosen to fan rather than to bundle: the previous set had five of six
 * ending at Istanbul, which drew five arcs through the same square inch
 * and read as a knot. `bow` is how hard each one curves and which side it
 * curves to, so the two that still share an endpoint arrive from opposite
 * directions instead of lying on top of each other.
 */
const ROUTES: Array<{ from: string; to: string; bow: number }> = [
  { from: "LON", to: "IST", bow: 0.2 },
  { from: "STO", to: "IST", bow: -0.17 },
  { from: "MAD", to: "DXB", bow: -0.14 },
  { from: "BER", to: "TAS", bow: 0.15 },
  { from: "MOW", to: "ALA", bow: 0.22 },
  { from: "IST", to: "DXB", bow: 0.26 },
];

/**
 * Where each hub's name sits relative to its dot.
 *
 * Placed by hand: Tashkent and Almaty are the closest pair on the map, so
 * one takes its label to the left and the other to the right. Istanbul's
 * sits below, clear of the three lanes that meet there.
 */
const LABELS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  LON: { dx: -14, dy: 5, anchor: "end" },
  MAD: { dx: -14, dy: 5, anchor: "end" },
  BER: { dx: 14, dy: 5, anchor: "start" },
  STO: { dx: 14, dy: 5, anchor: "start" },
  MOW: { dx: 14, dy: 5, anchor: "start" },
  IST: { dx: 0, dy: 28, anchor: "middle" },
  DXB: { dx: 14, dy: 5, anchor: "start" },
  TAS: { dx: -14, dy: 5, anchor: "end" },
  ALA: { dx: 14, dy: 5, anchor: "start" },
};

/**
 * A route as a bowed arc.
 *
 * The control point is pushed perpendicular to the chord, so the sign of
 * `bow` picks which side the lane curves to and its size how far.
 */
function arcPath(x1: number, y1: number, x2: number, y2: number, bow: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const lift = length * bow;
  const cx = (x1 + x2) / 2 + (dy / length) * lift;
  const cy = (y1 + y2) / 2 - (dx / length) * lift;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/**
 * The graticule.
 *
 * Meridians every 20°, parallels every 10°, barely visible. It does the job
 * the dot grid used to do incidentally — telling the eye this is a map and
 * not an illustration — without competing with the coastline for attention.
 * Straight lines, because the projection is linear in both axes.
 */
const MERIDIANS = Array.from(
  { length: Math.floor((LON_E - LON_W) / 20) + 1 },
  (_, i) => LON_W + i * 20,
).filter((lon) => lon > LON_W && lon < LON_E);

const PARALLELS = Array.from(
  { length: Math.floor((LAT_N - LAT_S) / 10) + 1 },
  (_, i) => LAT_S + i * 10,
).filter((lat) => lat > LAT_S && lat < LAT_N);

/* ------------------------------------------------------------------ view -- */

export function CoverageMap({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const wm = dict.worldMap;

  const lanes = ROUTES.map((route) => {
    const from = getCity(route.from);
    const to = getCity(route.to);
    if (!from || !to) return null;
    return {
      id: `${route.from}-${route.to}`,
      from,
      to,
      d: arcPath(
        projectX(from.lon),
        projectY(from.lat),
        projectX(to.lon),
        projectY(to.lat),
        route.bow,
      ),
    };
  }).filter((lane) => lane !== null);

  // Every city on a drawn lane gets a node; the named ones get a label.
  const nodes = [
    ...new Map(lanes.flatMap((l) => [[l.from.code, l.from], [l.to.code, l.to]])).values(),
  ];

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
          {/* One wash behind the densest part of the network, so the eye
              lands on the corridors rather than on the empty Atlantic. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(44% 58% at 46% 46%, color-mix(in oklab, var(--brand) 17%, transparent), transparent 74%)",
            }}
          />

          {/*
            On a phone the frame is still too wide to read at 345px, so the
            panel takes a fixed height and the map is told to cover it. The
            aspect mismatch crops a little off each end — ocean, mostly —
            and leaves the network at nearly twice the scale.
          */}
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid slice"
            className="relative block h-[260px] w-full sm:h-auto"
            role="img"
            aria-label={wm.mapLabel}
          >
            <defs>
              <linearGradient id="lane" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.3" />
                <stop offset="50%" stopColor="var(--brand)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="map-horizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--map-ink)" stopOpacity="0.95" />
                <stop offset="9%" stopColor="var(--map-ink)" stopOpacity="0" />
                <stop offset="91%" stopColor="var(--map-ink)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--map-ink)" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" aria-hidden>
              {MERIDIANS.map((lon) => (
                <line key={`m${lon}`} x1={projectX(lon)} y1="0" x2={projectX(lon)} y2={VIEW_H} />
              ))}
              {PARALLELS.map((lat) => (
                <line key={`p${lat}`} x1="0" y1={projectY(lat)} x2={VIEW_W} y2={projectY(lat)} />
              ))}
            </g>

            {/* Land. Two passes: the whole frame first so the coastline is
                continuous, then the served countries painted over it — a
                single pass with per-country fills leaves the unlit borders
                drawn on top of the lit fills. */}
            <g fill="#ffffff" fillOpacity="0.07" stroke="#ffffff" strokeOpacity="0.13" strokeWidth="0.7">
              {LAND_SHAPES.map((shape, i) => (
                <path key={i} d={shape.d} />
              ))}
            </g>
            {/* Lit, but not loud. A country we serve is a fact about where a
                lorry can be booked, not the headline — the headline is the
                six lanes drawn over it, and a solid green Russia would win
                that argument on area alone. */}
            <g
              fill="var(--brand)"
              fillOpacity="0.16"
              stroke="var(--brand)"
              strokeOpacity="0.52"
              strokeWidth="0.9"
            >
              {LAND_SHAPES.filter((shape) => shape.served).map((shape, i) => (
                <path key={i} d={shape.d} />
              ))}
            </g>

            {/* The frame cuts the Arctic and the Sahara mid-country, and a
                filled shape sliced by a straight edge reads as a painted bar
                rather than as a map running off the page. Fading the last
                few per cent of the panel to the panel's own colour turns the
                cut back into a horizon. Over the land, under the lanes. */}
            <rect
              x="0"
              y="0"
              width={VIEW_W}
              height={VIEW_H}
              fill="url(#map-horizon)"
              aria-hidden
            />

            {lanes.map((lane, i) => (
              <g key={lane.id}>
                <path d={lane.d} fill="none" stroke="url(#lane)" strokeWidth="2" />
                {/* The pulse. A short dash chasing a long gap along the same
                    path reads as something moving between two cities without
                    costing a second element to animate. */}
                <path
                  className="coverage-pulse"
                  d={lane.d}
                  fill="none"
                  stroke="var(--brand-glow)"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  style={{ animationDelay: `${i * 1.15}s` }}
                />
              </g>
            ))}

            {nodes.map((city) => {
              const x = projectX(city.lon);
              const y = projectY(city.lat);
              const label = LABELS[city.code];
              return (
                <g key={city.code}>
                  <circle cx={x} cy={y} r="13" fill="var(--brand)" fillOpacity="0.16" />
                  <circle cx={x} cy={y} r="4.6" fill="var(--brand)" />
                  {label && (
                    <text
                      x={x + label.dx}
                      y={y + label.dy}
                      textAnchor={label.anchor}
                      fill="#ffffff"
                      fillOpacity="0.92"
                      fontSize="17"
                      fontWeight="500"
                      // Names sit over land and lanes; a dark rim painted
                      // under the glyphs keeps them readable without a
                      // plate behind every one.
                      stroke="#0b0e0a"
                      strokeWidth="3.5"
                      strokeOpacity="0.8"
                      paintOrder="stroke"
                      // The map is a picture, not a reading order; the names
                      // are already in the caption's description.
                      aria-hidden
                    >
                      {city.name}
                    </text>
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
                <span
                  className="size-2 rounded-[2px] bg-brand/30 ring-1 ring-brand/60"
                  aria-hidden
                />
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
