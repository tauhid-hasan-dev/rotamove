import { Shell } from "@/components/common/section";
import { RouteSearch } from "@/components/search/route-search";

export function Hero() {
  return (
    // z-30: the entry animation on the search wrapper creates a stacking context,
    // which would otherwise trap the dropdown's z-index inside the hero and let
    // later sections tie-break above it.
    <section className="relative z-30 pb-20 pt-16 sm:pt-24">
      {/* the only decoration in the system: a soft wash of brand colour */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[600px] opacity-80 glow-brand motion-safe:animate-[drift_16s_ease-in-out_infinite]"
        aria-hidden
      />

      <Shell>
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow animate-rise">Türkiye · Europe · Central Asia · Gulf</p>

          {/* sized so it holds on a single line from the md breakpoint up */}
          <h1
            className="mt-5 animate-rise text-[clamp(2.1rem,4.4vw,3.55rem)] leading-[1.04] tracking-[-0.042em] md:whitespace-nowrap"
            style={{ animationDelay: "60ms" }}
          >
            One search. Every mover worth calling.
          </h1>

          <p
            className="mt-5 max-w-[34rem] animate-rise text-balance text-[17px] leading-relaxed text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Tell us where you&apos;re going. Verified movers come to you — on the channel you
            choose.
          </p>

          <div className="mt-10 w-full max-w-3xl animate-rise" style={{ animationDelay: "180ms" }}>
            <RouteSearch />
          </div>
        </div>
      </Shell>
    </section>
  );
}
