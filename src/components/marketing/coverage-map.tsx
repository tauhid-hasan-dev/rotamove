import { Shell } from "@/components/common/section";
import { CITIES, CORRIDORS, getCity } from "@/lib/geo";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

/**
 * The coverage map.
 *
 * A dotted world, with the corridors the network actually runs drawn across
 * it and a pulse travelling each one. Everything here is plotted from the
 * same city coordinates the search uses, so the picture cannot drift away
 * from the product: if a hub is added to `geo.ts` it appears here.
 *
 * Deliberately not a globe of worldwide arcs. The network is Europe,
 * Türkiye, the Caucasus, Central Asia and the Gulf; drawing traffic across
 * the Pacific to look bigger is the kind of flourish a freight buyer checks
 * and stops trusting you over.
 *
 * Rendered on the server: no clock, no randomness, no interaction, so there
 * is nothing for the client to disagree with.
 */

/* ------------------------------------------------------------- the world -- */

/**
 * Land, as longitude spans per 5° parallel, from 80°N down to 55°S.
 *
 * A coarse hand mask rather than a shapefile: at this dot pitch the outline
 * is suggestion, not cartography, and 2 kB of spans beats shipping a
 * topology the page would only throw away. Antarctica is cut — it carries no
 * freight and squashes everything that does into the top two thirds.
 */
const LAND: Array<[lat: number, spans: Array<[number, number]>]> = [
  [75, [[-120, -20], [15, 25], [50, 60], [90, 105], [135, 145]]],
  [70, [[-165, -20], [18, 180]]],
  [65, [[-165, -55], [-50, -25], [-22, -15], [5, 180]]],
  [60, [[-165, -55], [-48, -42], [5, 180]]],
  [55, [[-160, -55], [-10, -2], [8, 180]]],
  [50, [[-128, -55], [-6, 180]]],
  [45, [[-125, -60], [-2, 30], [37, 180]]],
  [40, [[-124, -74], [-9, 3], [8, 20], [23, 45], [47, 52], [55, 122], [126, 142]]],
  [35, [[-120, -76], [-9, -1], [3, 11], [24, 26], [28, 60], [62, 122], [127, 140]]],
  [30, [[-118, -82], [-10, 32], [36, 122], [130, 141]]],
  [25, [[-112, -97], [-85, -74], [-16, 34], [36, 60], [68, 122]]],
  [20, [[-106, -97], [-78, -70], [-17, 38], [40, 57], [70, 88], [92, 108], [120, 122]]],
  [15, [[-93, -86], [-17, 44], [45, 52], [73, 82], [96, 108], [120, 122]]],
  [10, [[-85, -61], [-15, 45], [76, 80], [98, 107], [122, 126]]],
  [5, [[-80, -60], [-10, 45], [80, 82], [98, 104], [113, 118], [122, 126]]],
  [0, [[-80, -45], [8, 42], [98, 104], [109, 119], [120, 126]]],
  [-5, [[-78, -35], [11, 40], [100, 106], [110, 117], [130, 140]]],
  [-10, [[-78, -35], [13, 40], [105, 116], [119, 125], [130, 150]]],
  [-15, [[-75, -38], [12, 40], [44, 50], [122, 142]]],
  [-20, [[-70, -40], [13, 36], [44, 48], [114, 148]]],
  [-25, [[-71, -45], [15, 33], [44, 47], [113, 152]]],
  [-30, [[-72, -50], [17, 32], [114, 153]]],
  [-35, [[-73, -56], [18, 27], [115, 150], [172, 176]]],
  [-40, [[-74, -62], [143, 148], [172, 177]]],
];

const STEP = 5;

/**
 * Vertical crop.
 *
 * Above 75°N and below 40°S there is almost nothing but a scatter of islands
 * and the tip of Patagonia, which bought two bands of near-empty canvas at
 * the top and bottom of the panel. Cutting them widens the aspect and lets
 * the inhabited world fill the frame.
 *
 * The bounds sit a parallel outside the outermost row of dots so the top
 * and bottom rows are not sliced in half by the panel's edge.
 */
const LAT_TOP = 80;
const LAT_BOTTOM = -45;

/**
 * Central meridian.
 *
 * Not Greenwich. A world map centred on 0° puts this network in its
 * top-right corner and three quarters of the canvas on an empty Pacific —
 * the composition said "mostly nowhere" about a business whose whole
 * argument is density. Re-centring on 45°E is ordinary cartographic
 * practice (Pacific-centred maps do the same thing the other way) and puts
 * the corridors where the eye already is.
 */
const CENTER_LON = 45;

/** Equirectangular, cropped to the inhabited band. 1000 wide keeps it square. */
const VIEW_W = 1000;
const VIEW_H = ((LAT_TOP - LAT_BOTTOM) / 360) * VIEW_W;

/** Longitude relative to the central meridian, wrapped into [-180, 180). */
function offsetLon(lon: number): number {
  return ((((lon - CENTER_LON) % 360) + 540) % 360) - 180;
}

const projectX = (lon: number) => ((offsetLon(lon) + 180) / 360) * VIEW_W;
const projectY = (lat: number) => ((LAT_TOP - lat) / 360) * VIEW_W;

/**
 * How far a hub's reach is drawn, as an ellipse in degrees.
 *
 * Measured on the map rather than on the ground, and that is deliberate.
 * Scaling longitude by cos(latitude) is the physically correct way to turn
 * degrees into kilometres, but it also means a hub at 64°N throws a halo
 * twenty degrees wide — which lit up the middle of Greenland on the
 * strength of Reykjavík, somewhere this network has never collected a
 * pallet. On a map whose own caption promises no flattery, a tight halo
 * that understates the reach is the right error to make.
 */
const REACH_LAT = 5.5;
const REACH_LON = 7;

function landDots(): Array<{ x: number; y: number; covered: boolean }> {
  const dots: Array<{ x: number; y: number; covered: boolean }> = [];
  for (const [lat, spans] of LAND) {
    for (const [from, to] of spans) {
      const start = Math.ceil(from / STEP) * STEP;
      for (let lon = start; lon <= to; lon += STEP) {
        const covered = CITIES.some((c) => {
          const dLat = (c.lat - lat) / REACH_LAT;
          if (Math.abs(dLat) > 1) return false;
          const dLon = (offsetLon(c.lon) - offsetLon(lon)) / REACH_LON;
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
 * Six real lanes, chosen to show the shape of the network rather than to
 * fill the canvas: the Türkiye–Europe spine, the Central Asia legs, and the
 * Gulf run. Each is a pair of city codes resolved against `geo.ts`.
 */
const ROUTES: Array<[from: string, to: string]> = [
  ["IST", "LON"],
  ["IST", "BER"],
  ["IST", "MAD"],
  ["TAS", "IST"],
  ["ALA", "MOW"],
  ["DXB", "IST"],
];

/**
 * Where each hub's name sits relative to its dot.
 *
 * Placed by hand rather than by a rule: Tashkent and Almaty are 21px apart
 * at this scale and London and Berlin 38px, so any single offset collides
 * somewhere. Only hubs listed here are named — the rest stay as dots.
 */
const LABELS: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  LON: { dx: -11, dy: 4, anchor: "end" },
  BER: { dx: 11, dy: 0, anchor: "start" },
  MAD: { dx: -11, dy: 4, anchor: "end" },
  IST: { dx: 0, dy: 21, anchor: "middle" },
  MOW: { dx: 11, dy: 4, anchor: "start" },
  TAS: { dx: 0, dy: 22, anchor: "middle" },
  ALA: { dx: 11, dy: -6, anchor: "start" },
  DXB: { dx: 11, dy: 4, anchor: "start" },
};

/**
 * A route as a bowed arc.
 *
 * The control point is pushed perpendicular to the chord so every lane
 * curves the same way regardless of its direction, and the lift scales with
 * length — a short hop stays nearly flat, a continental run arcs properly.
 */
function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const lift = Math.min(length * 0.28, 120);
  const cx = (x1 + x2) / 2 + (dy / length) * lift;
  const cy = (y1 + y2) / 2 - (dx / length) * lift;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/* ------------------------------------------------------------------ view -- */

export function CoverageMap({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const wm = dict.worldMap;
  const dots = landDots();

  const lanes = ROUTES.map(([fromCode, toCode]) => {
    const from = getCity(fromCode);
    const to = getCity(toCode);
    if (!from || !to) return null;
    return {
      id: `${fromCode}-${toCode}`,
      from,
      to,
      d: arcPath(
        projectX(from.lon),
        projectY(from.lat),
        projectX(to.lon),
        projectY(to.lat),
      ),
    };
  }).filter((lane) => lane !== null);

  // Every city on a drawn lane gets a node; hubs get a name beside it.
  const nodes = [...new Map(lanes.flatMap((l) => [[l.from.code, l.from], [l.to.code, l.to]])).values()];

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
          {/* A single wash behind the busiest part of the network, so the eye
              lands on the corridors rather than on the empty Pacific. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(34% 48% at 50% 28%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 74%)",
            }}
          />

          {/*
            On a phone the whole world across 345px turns the network into a
            smudge and the hub names into noise. Rather than ship a second
            SVG, the panel is given a fixed height below `sm` and the image
            is told to cover it: the aspect mismatch crops the empty Pacific
            and Atlantic edges away and leaves the Old World at roughly
            twice the scale. `xMidYMin` keeps the crop on the northern half,
            where every corridor is.
          */}
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMin slice"
            className="relative block h-[240px] w-full sm:h-auto"
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
                  <circle key={i} cx={d.x} cy={d.y} r="2.1" />
                ))}
            </g>
            <g fill="var(--brand)" fillOpacity="0.85">
              {dots
                .filter((d) => d.covered)
                .map((d, i) => (
                  <circle key={i} cx={d.x} cy={d.y} r="2.5" />
                ))}
            </g>

            {lanes.map((lane, i) => (
              <g key={lane.id}>
                <path d={lane.d} fill="none" stroke="url(#lane)" strokeWidth="1.6" />
                {/* The pulse. A short dash chasing a long gap along the same
                    path reads as something moving between two cities without
                    costing a second element to animate. */}
                <path
                  className="coverage-pulse"
                  d={lane.d}
                  fill="none"
                  stroke="var(--brand-glow)"
                  strokeWidth="3"
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
                  <circle cx={x} cy={y} r="10" fill="var(--brand)" fillOpacity="0.18" />
                  <circle cx={x} cy={y} r="3.6" fill="var(--brand)" />
                  {label && (
                    <text
                      x={x + label.dx}
                      y={y + label.dy}
                      textAnchor={label.anchor}
                      fill="#ffffff"
                      fillOpacity="0.9"
                      fontSize="13.5"
                      fontWeight="500"
                      // Names sit over dots and lanes; a dark rim painted
                      // under the glyphs keeps them readable without a
                      // plate behind every one.
                      stroke="#0b0e0a"
                      strokeWidth="3"
                      strokeOpacity="0.75"
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
