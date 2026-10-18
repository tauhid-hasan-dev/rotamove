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
            Sized to hold one line on a desktop viewport in every language.
            There is no `whitespace-nowrap`: the longest translations (French
            and Russian run roughly a third longer than English) would overflow
            rather than wrap, and an overflowing headline is worse than a
            wrapped one. The vw term shrinks the type instead, so the line
            breaks only on genuinely narrow screens.
          */}
          <h1
            className="mt-5 max-w-full animate-rise text-balance text-[clamp(1.95rem,3.9vw,3.3rem)] leading-[1.06] tracking-[-0.042em]"
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
