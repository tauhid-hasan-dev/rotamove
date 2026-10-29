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
 * The convoy drives, on a loop.
 *
 * An earlier version parked the vehicles and moved the road under them —
 * cheaper, and it is how a side-on vehicle shot is filmed, but on a page
 * this still reads as three stickers with spinning wheels. They travel for
 * real now: one set of vehicles laid out across half the track, the same
 * set again across the other half, and the whole track slid left-to-right
 * by exactly one set per cycle. Because the halves are identical, the
 * wrap lands on an identical frame and the loop is seamless.
 *
 * What stays constant is each vehicle's size and its height on the road —
 * the thing that made the old crossing version feel unsettled was the
 * composition changing every second, not the movement itself.
 *
 * The road no longer slides. With the vehicles genuinely moving, animating
 * the ground as well would have them driving on a treadmill in a wind
 * tunnel.
 *
 * The convoy rebalances rather than stretches.
 *
 * The band used to stop at 64rem and carry the same three vehicles at the
 * same three positions from a tablet all the way up, so a desktop got a
 * short road marooned in the middle of a wide page and two long empty gaps
 * either side of the lorry. The road now runs the full page gutter, and
 * each width gets its own convoy: two vehicles on a phone, three through
 * the tablet range, four once there is a desktop's worth of road. The
 * positions are per tier as well, so the spacing between vehicles stays
 * roughly constant instead of growing with the screen.
 *
 * `x` is where each one sits within its set, per tier: `sm` under 640px,
 * `md` through the tablet range, `lg` from 1024px up. `null` drops that
 * vehicle from the tier entirely.
 *
 * The gaps within a set and the gap across the seam are deliberately the
 * same size — the wrap happens in the middle of open road, and a convoy
 * that bunched up every cycle would give it away.
 */
const CONVOY = [
  { kind: "van", scale: 0.62, x: { sm: "26%", md: "22%", lg: "14%" } },
  { kind: "lorry", scale: 1, x: { sm: "74%", md: "55%", lg: "39%" } },
  { kind: "van", scale: 0.74, x: { sm: null, md: "86%", lg: "63%" } },
  { kind: "lorry", scale: 0.86, x: { sm: null, md: null, lg: "87%" } },
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
        {/* `journey-scene` carries `--fit`, the one number that says how big
            this picture should be at this width. Everything in the band —
            vehicles and destinations alike — is drawn at its natural size
            and scaled by it, so the whole composition grows and shrinks
            together instead of a fixed-size lorry rattling around a road
            that got wider. */}
        <div className="journey-scene relative mx-auto w-full max-w-[1440px]">
          <div className="relative h-[120px] sm:h-[164px] lg:h-[180px]">
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
              {/* Centre markings. Static: the road is the one thing in this
                  picture that is genuinely standing still. */}
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
              />
            </svg>

            {/* --- the convoy -------------------------------------------- */}
            {/* Inset so vehicles pass between the destinations rather than
                through them; clipped so they vanish cleanly at the edges. */}
            {/* Authored left-to-right and mirrored wholesale for Arabic, so
                everything inside uses physical directions — mixing those with
                logical ones here would flip twice and cancel out. */}
            {/* The inset clears the destinations at each end, and widens with
                them as `--fit` grows. */}
            <div
              className={cn(
                "absolute inset-y-0 inset-x-[48px] overflow-hidden sm:inset-x-[72px] lg:inset-x-[80px] 2xl:inset-x-[90px]",
                rtl && "-scale-x-100",
              )}
            >
              {/* Two identical halves on a track twice the lane's width.
                  Sliding it by one half per cycle returns the picture to
                  where it started, so the loop has no seam to hide. */}
              <div className="journey-track motion-reduce:animate-none">
                <ConvoySet />
                <ConvoySet />
              </div>
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

/** One pass of the convoy. Rendered twice, side by side, to make the loop. */
function ConvoySet() {
  return (
    <div className="relative h-full w-1/2 shrink-0">
      {CONVOY.map((vehicle, i) => (
        <Traveller key={i} {...vehicle} />
      ))}
    </div>
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
 * One vehicle, placed within its set.
 *
 * Its position within the set is plain CSS, not an animation — the travel
 * belongs to the track above it. Under `prefers-reduced-motion` the track
 * stops and the convoy simply stands on the road where it was.
 *
 * Wheel speed is tied to scale. A smaller vehicle has smaller wheels, and
 * smaller wheels turn faster to cover the same ground — getting that backwards
 * is what makes a scene like this feel like clip-art.
 */
function Traveller({
  kind,
  scale,
  x,
}: {
  kind: "lorry" | "van";
  scale: number;
  /** Centre position across the band, per width tier. `null` drops it. */
  x: { sm: string | null; md: string | null; lg: string | null };
}) {
  // The first tier that wants this vehicle is where it appears; below that
  // it is not rendered at all rather than parked off-screen, so a phone
  // never pays for a lorry it cannot see.
  const firstTier = x.sm !== null ? "sm" : x.md !== null ? "md" : "lg";

  return (
    <span
      className={cn(
        "journey-vehicle absolute -translate-x-1/2",
        firstTier === "md" && "hidden sm:block",
        firstTier === "lg" && "hidden lg:block",
      )}
      style={{
        bottom: ROAD,
        // Each tier falls back to the one below it, so a vehicle that only
        // appears at `lg` still has somewhere to be in the cascade.
        ["--x-sm" as string]: x.sm ?? x.md ?? x.lg ?? "50%",
        ["--x-md" as string]: x.md ?? x.lg ?? x.sm ?? "50%",
        ["--x-lg" as string]: x.lg ?? x.md ?? x.sm ?? "50%",
      }}
    >
      {/*
        Scale and jiggle live on separate elements on purpose: both animate
        `transform`, and the keyframed one silently wins — which flattened
        every vehicle to the same size. origin-bottom keeps the wheels on the
        road as the scale changes.

        The vehicle's own scale is multiplied by the band's `--fit`, so the
        relative sizes of lorry and vans are fixed by this file and only the
        overall size answers to the viewport.
      */}
      <span
        className="block origin-bottom"
        style={{ transform: `scale(calc(${scale} * var(--fit, 1)))` }}
      >
        <span
          className="block text-foreground motion-safe:animate-[jiggle_1.6s_ease-in-out_infinite]"
          style={{ ["--roll" as string]: `calc(${(0.95 * scale).toFixed(2)}s * var(--fit, 1))` }}
        >
          {kind === "lorry" ? <Lorry /> : <Van />}
        </span>
      </span>
    </span>
  );
}

/**
 * A turning wheel.
 *
 * The tyre is a static disc; only the hub and its spokes rotate. A plain
 * disc could be spinning at any speed or not at all — the spokes are the
 * whole reason the motion reads, and they are what makes a stationary
 * vehicle look like it is driving.
 */
function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const spoke = r * 0.6;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="currentColor" />
      <g className="journey-wheel">
        <circle cx={cx} cy={cy} r={r * 0.38} fill="var(--background)" />
        <line
          x1={cx - spoke}
          y1={cy}
          x2={cx + spoke}
          y2={cy}
          stroke="var(--background)"
          strokeOpacity="0.5"
          strokeWidth="1.4"
        />
        <line
          x1={cx}
          y1={cy - spoke}
          x2={cx}
          y2={cy + spoke}
          stroke="var(--background)"
          strokeOpacity="0.5"
          strokeWidth="1.4"
        />
      </g>
    </>
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
      <Wheel cx={26} cy={42} r={8} />
      <Wheel cx={96} cy={42} r={8} />
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
      <Wheel cx={22} cy={36} r={8} />
      <Wheel cx={62} cy={36} r={8} />
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
    <span
      className={cn("block origin-bottom text-muted-foreground", className)}
      // Scaled about its own base, like the vehicles, so the gateway keeps
      // its feet on the road at every width. Centred rather than anchored to
      // the outer edge: `origin-bottom` is direction-agnostic, and the few
      // pixels it gains at the widest tier are spent inside the gutter.
      style={{ bottom: ROAD, transform: "scale(var(--fit, 1))" }}
    >
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
