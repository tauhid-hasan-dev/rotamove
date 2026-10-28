import { Shell } from "@/components/common/section";
import { CITIES, CORRIDORS, getCity } from "@/lib/geo";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * The coverage map.
 *
 * The corridors the network actually runs, drawn over a dotted land mask,
 * with a pulse travelling each lane. Everything is plotted from the same
 * city coordinates the search uses, so the picture cannot drift away from
 * the product: add a hub to `geo.ts` and it appears here.
 *
 * It was a whole-world map and is now a map of the world this network
 * works in — Europe, North Africa, the Levant and Gulf, the Caucasus and
 * Central Asia. Showing the Pacific to prove we are global was spending
 * two thirds of the canvas on an argument the lanes themselves refute,
 * and squeezing every corridor into the remaining third is what had the
 * arcs stacked on top of each other.
 *
 * Rendered on the server: no clock, no randomness, no interaction, so
 * there is nothing for the client to disagree with.
 */

/* ------------------------------------------------------------- the world -- */

/**
 * Land, as longitude spans per 2° parallel, from 70°N down to 10°N.
 *
 * A hand mask, at twice the resolution of the whole-world version it
 * replaces — the frame is a third as wide, so the same dot pitch would
 * have rendered Italy as two dots. Still a suggestion of coastline rather
 * than cartography: at this scale the Bosphorus is a third of a dot.
 */
const LAND: Array<[lat: number, spans: Array<[number, number]>]> = [
  [70, [[18, 41], [44, 70], [73, 79], [84, 96]]],
  [68, [[13, 69], [75, 96]]],
  [66, [[-24, -13], [12, 69], [76, 96]]],
  [64, [[-24, -14], [7, 19], [22, 96]]],
  [62, [[-8, -6], [5, 18], [21, 96]]],
  [60, [[-2, -1], [5, 18], [21, 96]]],
  [58, [[-7, -2], [8, 19], [22, 96]]],
  [56, [[-10, -6], [-5, -1], [8, 16], [21, 96]]],
  [54, [[-10, -6], [-5, 0], [7, 96]]],
  [52, [[-10, -6], [-5, 2], [4, 96]]],
  [50, [[-5, 1], [2, 96]]],
  [48, [[-5, 96]]],
  [46, [[-2, 31], [33, 36], [38, 48], [52, 96]]],
  [44, [[-9, 12], [15, 28], [41, 47], [53, 96]]],
  [42, [[-9, 3], [8, 10], [11, 16], [19, 28], [41, 47], [53, 96]]],
  [40, [[-9, 3], [8, 10], [13, 18], [20, 24], [26, 44], [45, 50], [54, 96]]],
  [38, [[-9, 0], [8, 10], [13, 16], [20, 24], [26, 49], [54, 96]]],
  [36, [[-6, -1], [0, 11], [12, 15], [22, 26], [27, 96]]],
  [34, [[-9, 11], [32, 34], [35, 96]]],
  [32, [[-9, 96]]],
  [30, [[-10, 34], [35, 48], [50, 96]]],
  [28, [[-14, 33], [36, 50], [51, 96]]],
  [26, [[-16, 33], [37, 50], [51, 96]]],
  [24, [[-17, 34], [38, 52], [53, 96]]],
  [22, [[-17, 35], [39, 52], [53, 59], [68, 96]]],
  [20, [[-17, 36], [40, 52], [53, 58], [70, 88], [92, 96]]],
  [18, [[-17, 37], [41, 52], [72, 85], [93, 96]]],
  [16, [[-17, 40], [42, 53], [73, 82], [94, 96]]],
  [14, [[-17, 44], [45, 52], [74, 81]]],
  [12, [[-15, 48], [75, 80]]],
  [10, [[-11, 51], [76, 79]]],
];

const STEP = 2;

/** The frame: Iberia to the Tian Shan, the Nordics to the Horn. */
const LON_W = -24;
const LON_E = 96;
const LAT_N = 70;
const LAT_S = 10;

/** 2:1, which is what the frame is. Big, because it was asked to be. */
const VIEW_W = 1400;
const VIEW_H = (VIEW_W * (LAT_N - LAT_S)) / (LON_E - LON_W);

const projectX = (lon: number) => ((lon - LON_W) / (LON_E - LON_W)) * VIEW_W;
const projectY = (lat: number) => ((LAT_N - lat) / (LAT_N - LAT_S)) * VIEW_H;

/**
 * How far a hub's reach is drawn, as an ellipse in degrees.
 *
 * Measured on the map rather than on the ground, and deliberately tight.
 * Scaling longitude by cos(latitude) is the physically correct way to turn
 * degrees into kilometres, but a hub at 60°N would then throw a halo wide
 * enough to light up places this network has never collected a pallet in.
 * On a map whose own caption promises no flattery, understating the reach
 * is the right error to make.
 *
 * Tightened again when the frame narrowed to this region: with 91 hubs
 * across it, a generous radius merged every halo into one solid green
 * rectangle, which says nothing. A short radius leaves a band you can
 * actually trace — and each dot still stands for somewhere a real hub
 * collects from.
 */
const REACH_LAT = 3;
const REACH_LON = 4;

function landDots(): Array<{ x: number; y: number; covered: boolean }> {
  const dots: Array<{ x: number; y: number; covered: boolean }> = [];
  for (const [lat, spans] of LAND) {
    for (const [from, to] of spans) {
      const start = Math.max(LON_W, Math.ceil(from / STEP) * STEP);
      for (let lon = start; lon <= Math.min(to, LON_E); lon += STEP) {
        const covered = CITIES.some((c) => {
          const dLat = (c.lat - lat) / REACH_LAT;
          if (Math.abs(dLat) > 1) return false;
          const dLon = (c.lon - lon) / REACH_LON;
          return dLat * dLat + dLon * dLon <= 1;
        });
        dots.push({ x: projectX(lon), y: projectY(lat), covered });
      }
    }
  }
  return dots;
}

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

/* ------------------------------------------------------------------ view -- */

export function CoverageMap({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const wm = dict.worldMap;
  const dots = landDots();

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
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
                <stop offset="50%" stopColor="var(--brand)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Two passes so the covered band reads as one shape rather than
                as scattered bright dots among dim ones. */}
            <g fill="#ffffff" fillOpacity="0.1">
              {dots
                .filter((d) => !d.covered)
                .map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r="3" />
                ))}
            </g>
            <g fill="var(--brand)" fillOpacity="0.85">
              {dots
                .filter((d) => d.covered)
                .map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r="3.4" />
                ))}
            </g>

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
                      // Names sit over dots and lanes; a dark rim painted
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
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              {wm.legendHub}
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
