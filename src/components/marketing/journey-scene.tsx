import { Shell } from "@/components/common/section";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * The journey band under the search box.
 *
 * A lorry and two vans crossing from an abstract collection point to an
 * abstract delivery point — the product's whole proposition in one glance,
 * without naming a city or implying we only move households.
 *
 * Deliberately a server component with no JavaScript: inline SVG plus three
 * CSS animations.
 *
 * Direction follows the script. In Arabic the whole convoy is mirrored, so it
 * travels right-to-left and the vehicles face the way they are going.
 */

/**
 * Every vehicle crosses in the same time, spaced by negative delays.
 *
 * Varying the durations to suggest depth looked right in the abstract and was
 * wrong in practice: on a single lane, different speeds mean the faster
 * vehicle eventually drives through the slower one. Equal speed with an even
 * stagger keeps the spacing constant forever. Depth comes from scale instead.
 */
const CROSSING_SECONDS = 22;

const CONVOY = [
  { kind: "van", scale: 0.6, offset: 0, rest: "28%" },
  { kind: "lorry", scale: 1, offset: 1 / 3, rest: "52%" },
  { kind: "van", scale: 0.72, offset: 2 / 3, rest: "80%" },
] as const;

/** Distance from the band's floor to the road surface, in px. */
const ROAD = 26;

export function JourneyScene({ dict, rtl }: { dict: Dictionary; rtl: boolean }) {
  return (
    <section className="pb-4 pt-14 sm:pt-20" aria-labelledby="journey-heading">
      <h2 id="journey-heading" className="sr-only">
        {dict.scene.alt}
      </h2>

      <Shell>
        <div className="relative mx-auto max-w-5xl">
          <div className="relative h-[120px] sm:h-[164px]">
            {/* --- the two destinations, one at each end ------------------- */}
            <Destination className="absolute start-0" />
            <Destination className="absolute end-0" flip />

            {/* --- the road ---------------------------------------------- */}
            {/* 2 units tall so the stroke lands exactly on ROAD, which is
                also where every vehicle's wheels sit. */}
            <svg
              className="absolute inset-x-0 h-0.5 w-full overflow-visible text-border"
              style={{ bottom: ROAD }}
              viewBox="0 0 1000 2"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line
                x1="0"
                y1="1"
                x2="1000"
                y2="1"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Centre markings sliding the other way. This is what sells the
                  movement — the vehicles barely need to travel. */}
              <line
                x1="0"
                y1="1"
                x2="1000"
                y2="1"
                stroke="var(--muted-foreground)"
                strokeWidth="2"
                strokeDasharray="14 10"
                strokeOpacity="0.38"
                vectorEffect="non-scaling-stroke"
                className="motion-safe:animate-[tarmac_1.1s_linear_infinite]"
              />
            </svg>

            {/* --- the convoy -------------------------------------------- */}
            {/* Inset so vehicles pass between the destinations rather than
                through them; clipped so they vanish cleanly at the edges. */}
            {/* Authored left-to-right and mirrored wholesale for Arabic, so
                everything inside uses physical directions — mixing those with
                logical ones here would flip twice and cancel out. */}
            <div
              className={cn(
                "absolute inset-y-0 inset-x-[56px] overflow-hidden sm:inset-x-[76px]",
                rtl && "-scale-x-100",
              )}
            >
              {CONVOY.map((vehicle, i) => (
                <Traveller key={i} {...vehicle} />
              ))}
            </div>
          </div>

          {/* --- labels ------------------------------------------------- */}
          {/* Origin first in the DOM, so RTL puts it on the right without a
              second layout. */}
          <div className="mt-5 flex items-start justify-between gap-6">
            <Endpoint title={dict.scene.origin} hint={dict.scene.originHint} />
            <p className="hidden shrink-0 items-center gap-2 pt-1 text-[12px] text-muted-foreground sm:inline-flex">
              <span className="inline-block h-px w-5 bg-border" aria-hidden />
              {dict.scene.inTransit}
              <span className="inline-block h-px w-5 bg-border" aria-hidden />
            </p>
            <Endpoint title={dict.scene.destination} hint={dict.scene.destinationHint} align="end" />
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Endpoint({
  title,
  hint,
  align = "start",
}: {
  title: string;
  hint: string;
  align?: "start" | "end";
}) {
  return (
    <span className={cn("flex min-w-0 flex-col", align === "end" && "items-end text-end")}>
      <span className="text-[13.5px] font-medium">{title}</span>
      <span className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</span>
    </span>
  );
}

/**
 * One vehicle on its crossing.
 *
 * The negative delay starts it already part-way along, so the convoy is spread
 * across the road on first paint instead of queueing at the kerb.
 *
 * Because the animation is what positions the vehicle, dropping it under
 * `prefers-reduced-motion` would stack all three on the near kerb. `--rest`
 * is where each one parks instead (applied in globals.css).
 */
function Traveller({
  kind,
  scale,
  offset,
  rest,
}: {
  kind: "lorry" | "van";
  scale: number;
  /** Position in the crossing cycle, 0–1. */
  offset: number;
  /** Where this vehicle parks when motion is reduced. */
  rest: string;
}) {
  return (
    // The rail: stretched to the band's width, so `translateX(100%)` in the
    // keyframes is exactly one crossing. It is the thing that moves.
    <span
      className="journey-vehicle absolute inset-x-0 motion-safe:animate-[haul_var(--dur)_linear_infinite]"
      style={{
        bottom: ROAD,
        ["--dur" as string]: `${CROSSING_SECONDS}s`,
        ["--rest" as string]: rest,
        animationDelay: `${-offset * CROSSING_SECONDS}s`,
      }}
    >
      {/* Hangs off the rail's leading edge, so it starts fully off-stage. */}
      <span className="absolute bottom-0 right-full">
      {/*
        Scale and jiggle live on separate elements on purpose: both animate
        `transform`, and the keyframed one silently wins — which flattened
        every vehicle to the same size. origin-bottom keeps the wheels on the
        road as the scale changes.
      */}
        <span className="block origin-bottom" style={{ transform: `scale(${scale})` }}>
          <span className="block text-foreground motion-safe:animate-[jiggle_1.6s_ease-in-out_infinite]">
            {kind === "lorry" ? <Lorry /> : <Van />}
          </span>
        </span>
      </span>
    </span>
  );
}

/*
 * Both vehicles share one convention: the wheels touch the bottom edge of the
 * viewBox. That makes the SVG's own baseline the road, so a single `bottom`
 * value plants every vehicle regardless of its size or scale.
 */

/** Box lorry, nose leading. Flat, geometric, one brand accent. */
function Lorry() {
  return (
    <svg width="124" height="50" viewBox="0 0 124 50" aria-hidden className="block">
      {/* cargo body — the one place the brand colour appears */}
      <rect x="2" y="4" width="76" height="30" rx="3" fill="var(--brand)" />
      <rect
        x="2"
        y="4"
        width="76"
        height="30"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
      />
      {/* door seam, so the box does not read as a blank slab */}
      <line x1="40" y1="8" x2="40" y2="30" stroke="currentColor" strokeOpacity="0.2" />

      {/* cab with a sloped windscreen */}
      <path d="M80 12h18l12 13v9H80z" fill="currentColor" />
      <path d="M88 16h8l8 8h-16z" fill="var(--background)" fillOpacity="0.92" />

      {/* chassis */}
      <rect x="2" y="34" width="108" height="3" fill="currentColor" fillOpacity="0.55" />

      {/* wheels — bottom edge of each sits on y=50 */}
      <circle cx="26" cy="42" r="8" fill="currentColor" />
      <circle cx="26" cy="42" r="3" fill="var(--background)" />
      <circle cx="96" cy="42" r="8" fill="currentColor" />
      <circle cx="96" cy="42" r="3" fill="var(--background)" />
    </svg>
  );
}

/** Minivan: tall cabin, short sloped bonnet. Same vocabulary, smaller. */
function Van() {
  return (
    <svg width="92" height="44" viewBox="0 0 92 44" aria-hidden className="block">
      <path
        d="M4 30V10a6 6 0 0 1 6-6h42a8 8 0 0 1 5.4 2.1l14.8 13.6A8 8 0 0 1 75 25.4V30z"
        fill="currentColor"
      />
      {/* glazing: two side windows and a windscreen following the bonnet */}
      <rect x="11" y="9" width="15" height="9" rx="1.5" fill="var(--background)" fillOpacity="0.92" />
      <rect x="30" y="9" width="15" height="9" rx="1.5" fill="var(--background)" fillOpacity="0.92" />
      <path d="M49 9h3.6l10 9H49z" fill="var(--background)" fillOpacity="0.92" />

      {/* wheels — bottom edge of each sits on y=44 */}
      <circle cx="22" cy="36" r="8" fill="currentColor" />
      <circle cx="22" cy="36" r="3" fill="var(--background)" />
      <circle cx="62" cy="36" r="8" fill="currentColor" />
      <circle cx="62" cy="36" r="3" fill="var(--background)" />
    </svg>
  );
}

/**
 * An abstract place, not a city.
 *
 * A gateway arch with a location pin, flanked by two blocks suggesting a
 * skyline. No flag, no landmark, no name — it has to stand for a depot in
 * Tashkent as readily as a flat in Berlin.
 *
 * Its ground pad sits on the viewBox's bottom edge, the same convention the
 * vehicles use, so everything shares one baseline.
 */
function Destination({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <span className={cn("block text-muted-foreground", className)} style={{ bottom: ROAD }}>
      <svg
        width="72"
        height="78"
        viewBox="0 0 72 78"
        aria-hidden
        className={cn("block", flip && "-scale-x-100")}
      >
        {/* skyline blocks */}
        <rect x="1" y="42" width="14" height="33" rx="2.5" fill="currentColor" fillOpacity="0.2" />
        <rect x="57" y="50" width="14" height="25" rx="2.5" fill="currentColor" fillOpacity="0.14" />

        {/* the gateway */}
        <path
          d="M19 75V36a17 17 0 0 1 34 0v39z"
          fill="var(--surface)"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />

        {/* pin */}
        <circle cx="36" cy="35" r="8.5" fill="var(--brand)" />
        <circle cx="36" cy="35" r="3.2" fill="var(--ink)" />

        {/* ground pad, flush with the baseline */}
        <rect x="0" y="75" width="72" height="3" rx="1.5" fill="currentColor" fillOpacity="0.3" />
      </svg>
    </span>
  );
}
