import { Shell } from "@/components/common/section";
import { RouteSearch } from "@/components/search/route-search";
import { JourneyScene } from "@/components/marketing/journey-scene";
import type { Dictionary } from "@/i18n/dictionaries";

export function Hero({ dict, rtl }: { dict: Dictionary; rtl: boolean }) {
  return (
    // z-30: the entry animation on the search wrapper creates a stacking context,
    // which would otherwise trap the dropdown's z-index inside the hero and let
    // later sections tie-break above it.
    <section className="relative z-30 pb-10 pt-16 sm:pt-24">
      {/* the only decoration in the system: a soft wash of brand colour */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[600px] opacity-80 glow-brand motion-safe:animate-[drift_16s_ease-in-out_infinite]"
        aria-hidden
      />

      <Shell>
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow animate-rise">{dict.hero.eyebrow}</p>

          {/*
            No `whitespace-nowrap` here. The English headline would hold one
            line from md up, but German and Russian run roughly a third longer
            and Arabic sets wider still — forcing a single line overflows the
            viewport in five of the eight locales. Wrapping is the correct
            default once the copy is not fixed.
          */}
          <h1
            className="mt-5 max-w-[22ch] animate-rise text-balance text-[clamp(2.1rem,4.4vw,3.55rem)] leading-[1.06] tracking-[-0.042em]"
            style={{ animationDelay: "60ms" }}
          >
            {dict.hero.title}
          </h1>

          <p
            className="mt-5 max-w-[38rem] animate-rise text-balance text-[17px] leading-relaxed text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            {dict.hero.subtitle}
          </p>

          <div className="mt-10 w-full max-w-3xl animate-rise" style={{ animationDelay: "180ms" }}>
            <RouteSearch />
          </div>
        </div>
      </Shell>

      <JourneyScene dict={dict} rtl={rtl} />
    </section>
  );
}
