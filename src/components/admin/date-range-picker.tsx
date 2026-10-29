"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RangeCalendar } from "@/components/common/range-calendar";
import type { DayRange } from "@/lib/admin/metrics";
import { PRESETS, presetRange, type RangePreset } from "@/lib/admin/date-range";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/* The one date filter every metric obeys. Presets for the common asks, the
   existing two-month RangeCalendar for anything custom. */

/** Maps each preset id onto its label key under dict.admin.dateRange. */
const PRESET_DICT_KEYS = {
  "7d": "last7",
  "30d": "last30",
  "90d": "last90",
  this_month: "thisMonth",
  this_year: "thisYear",
  all: "last12",
} as const satisfies Record<Exclude<RangePreset, "custom">, string>;

export interface DateRangeState {
  preset: RangePreset;
  range: DayRange;
}

export function useDateRange(anchorMs: number, initial: Exclude<RangePreset, "custom"> = "30d") {
  const [state, setState] = useState<DateRangeState>({
    preset: initial,
    range: presetRange(initial, anchorMs),
  });
  return {
    ...state,
    setPreset: (preset: Exclude<RangePreset, "custom">) =>
      setState({ preset, range: presetRange(preset, anchorMs) }),
    setCustom: (range: DayRange) => setState({ preset: "custom", range }),
  };
}

export function DateRangePicker({
  value,
  onPreset,
  onCustom,
  align = "end",
}: {
  value: DateRangeState;
  onPreset: (preset: Exclude<RangePreset, "custom">) => void;
  onCustom: (range: DayRange) => void;
  align?: "start" | "end";
}) {
  const { dict, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const presetLabel = (preset: Exclude<RangePreset, "custom">) =>
    dict.admin.dateRange[PRESET_DICT_KEYS[preset]];
  const label =
    value.preset === "custom"
      ? `${t.dateLong(value.range.start)} – ${t.dateLong(value.range.end)}`
      : presetLabel(value.preset);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <CalendarRange className="text-muted-foreground" aria-hidden />
          <span className="tnum">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <div className="flex flex-col gap-0 sm:flex-row">
          <div className="flex flex-row flex-wrap gap-1 border-b p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-e">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start",
                  value.preset === preset && "bg-brand/20 text-ink dark:bg-brand/15 dark:text-brand",
                )}
                onClick={() => {
                  onPreset(preset);
                  setOpen(false);
                }}
              >
                {presetLabel(preset)}
              </Button>
            ))}
          </div>
          <div className="p-3">
            <p className="eyebrow mb-2">{dict.admin.dateRange.custom}</p>
            <RangeCalendar
              value={draft}
              onChange={(next) => {
                setDraft(next);
                if (next.start && next.end) {
                  onCustom({ start: next.start, end: next.end });
                  setOpen(false);
                }
              }}
              months={1}
              // A console filters what has already happened.
              allowPast
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
