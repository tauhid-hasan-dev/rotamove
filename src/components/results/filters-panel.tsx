"use client";

import { RotateCcw, Zap } from "lucide-react";
import { MODE_ICONS } from "@/components/common/route-line";
import { useI18n } from "@/i18n/provider";
import type { TransportMode } from "@/lib/geo";
import type { QuoteFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

const SERVICE_IDS: Array<QuoteFilters["needs"][number]> = [
  "packing",
  "storage",
  "customs",
  "vehicle",
  "piano",
  "cleaning",
];

const RATINGS = [0, 4, 4.5, 4.7];

export function FiltersPanel({
  filters,
  onChange,
  availableModes,
  resultCount,
  totalCount,
}: {
  filters: QuoteFilters;
  onChange: (next: QuoteFilters) => void;
  availableModes: TransportMode[];
  resultCount: number;
  totalCount: number;
}) {
  const { dict, t } = useI18n();
  const dirty =
    filters.modes.length > 0 ||
    filters.minRating > 0 ||
    filters.instantOnly ||
    filters.needs.length > 0;

  const toggle = <K extends "modes" | "needs">(
    key: K,
    value: QuoteFilters[K][number],
  ) => {
    const list = filters[key] as Array<typeof value>;
    onChange({
      ...filters,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    } as QuoteFilters);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground tnum">
          {totalCount === 0
            ? dict.filters.searching
            : t.fill(dict.filters.ofTotal, {
                shown: t.number(resultCount),
                total: t.number(totalCount),
              })}
        </p>
        {dirty && (
          <button
            onClick={() =>
              onChange({ modes: [], minRating: 0, instantOnly: false, needs: [] })
            }
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            {dict.common.reset}
          </button>
        )}
      </div>

      <section>
        <button
          type="button"
          onClick={() => onChange({ ...filters, instantOnly: !filters.instantOnly })}
          aria-pressed={filters.instantOnly}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
            filters.instantOnly ? "border-brand bg-brand-soft dark:bg-accent" : "hover:bg-muted",
          )}
        >
          <Zap
            className={cn("size-4 shrink-0", filters.instantOnly ? "" : "text-muted-foreground")}
            strokeWidth={2}
          />
          <span className="text-[14px] font-medium">{dict.filters.instantOnly}</span>
        </button>
      </section>

      {availableModes.length > 1 && (
        <section>
          <h3 className="eyebrow">{dict.filters.mode}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableModes.map((mode) => {
              const Icon = MODE_ICONS[mode];
              const label = dict.enums.modes[mode].label;
              const on = filters.modes.includes(mode);
              return (
                <button
                  key={mode}
                  onClick={() => toggle("modes", mode)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    on ? "border-brand bg-brand text-ink" : "hover:bg-muted",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="eyebrow">{dict.filters.rating}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {RATINGS.map((rating) => (
            <button
              key={rating}
              onClick={() => onChange({ ...filters, minRating: rating })}
              aria-pressed={filters.minRating === rating}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] transition-colors tnum",
                filters.minRating === rating
                  ? "border-brand bg-brand text-ink"
                  : "hover:bg-muted",
              )}
            >
              {rating === 0
                ? dict.common.any
                : t.fill(dict.filters.ratingPlus, { rating: t.decimal(rating, 1) })}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="eyebrow">{dict.filters.mustOffer}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SERVICE_IDS.map((id) => {
            const on = filters.needs.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle("needs", id)}
                aria-pressed={on}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  on ? "border-brand bg-brand text-ink" : "hover:bg-muted",
                )}
              >
                {dict.filters.services[id]}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
