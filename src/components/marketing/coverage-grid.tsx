"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Shell } from "@/components/common/section";
import {
  CITIES,
  CORRIDORS,
  COUNTRIES,
  REGIONS,
  REGION_ORDER,
  type RegionId,
} from "@/lib/geo";
import { MOVERS } from "@/lib/movers";
import { formatDays } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Coverage, shown rather than claimed. Someone in Tashkent needs to see
 * Tashkent before they will type anything.
 */
export function CoverageGrid({ heading = true }: { heading?: boolean }) {
  const [active, setActive] = useState<RegionId>("TR");

  const data = useMemo(() => {
    const countries = COUNTRIES.filter((c) => c.region === active);
    const isoSet = new Set(countries.map((c) => c.iso));
    return {
      countries,
      cities: CITIES.filter((c) => isoSet.has(c.country)),
      corridors: CORRIDORS.filter((c) => c.from === active || c.to === active).slice(0, 6),
      partners: MOVERS.filter((m) => m.regions.includes(active)).length,
    };
  }, [active]);

  return (
    <section id="coverage" className="py-24 sm:py-32">
      <Shell>
        {heading && (
          <h2 className="mx-auto max-w-2xl text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
            Built for the routes nobody else runs properly.
          </h2>
        )}

        <div
          role="tablist"
          aria-label="Regions"
          className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-2"
        >
          {REGION_ORDER.map((id) => {
            const selected = id === active;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(id)}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[14px] transition-colors",
                  selected ? "text-ink" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="region-pill"
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 440, damping: 36 }}
                  />
                )}
                <span className="relative">{REGIONS[id].name}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div className="min-w-0 rounded-3xl border bg-card p-7">
              <p className="eyebrow">
                {data.countries.length} countries · {data.cities.length} cities ·{" "}
                {data.partners} movers
              </p>
              <h3 className="mt-3 text-[24px] tracking-[-0.03em]">{REGIONS[active].name}</h3>

              <ul className="mt-6 flex flex-wrap gap-1.5">
                {data.countries.map((country) => (
                  <li
                    key={country.iso}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[13px]"
                  >
                    <span aria-hidden>{country.flag}</span>
                    {country.name}
                  </li>
                ))}
              </ul>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {data.cities.map((city) => (
                  <li key={city.code}>
                    <span className="code inline-block rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {city.code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 space-y-2">
              {data.corridors.map((corridor) => (
                <div
                  key={corridor.id}
                  className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-4"
                >
                  <p className="min-w-0 flex-1 truncate text-[15px]">{corridor.label}</p>
                  <p className="shrink-0 text-[13px] text-muted-foreground tnum">
                    {formatDays(corridor.transitDays)}
                  </p>
                </div>
              ))}
              <Link
                href="/coverage"
                className="inline-block px-5 pt-3 text-[14px] underline underline-offset-4 decoration-brand decoration-2 transition-colors hover:text-muted-foreground"
              >
                All corridors
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </Shell>
    </section>
  );
}
