"use client";

import { useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RangeCalendar, type DateRange } from "@/components/common/range-calendar";
import { useI18n } from "@/i18n/provider";
import { leadFromWindow, windowFromLead } from "@/lib/lead-dates";
import type { DateFlexibility, LeadDraft } from "@/lib/types";

/**
 * The collection window, as a summary row rather than a wizard step.
 *
 * Asking "when?" on its own screen was redundant once the home-page search
 * takes a date range — but dates are optional there, so dropping the question
 * entirely would mean submitting a date the customer never saw. This keeps it
 * visible and one click from editable without costing a step.
 *
 * The picker works in ranges; the lead stores a date plus a flexibility band.
 * `lib/lead-dates.ts` owns that conversion so this and the search bar agree.
 */
export function CollectionWindow({
  draft,
  update,
}: {
  draft: LeadDraft;
  update: (patch: Partial<LeadDraft>) => void;
}) {
  const { dict, t } = useI18n();
  const [open, setOpen] = useState(false);

  const window = windowFromLead(draft.moveDate, draft.flexibility);
  const [range, setRange] = useState<DateRange>(window);

  const month = new Date(draft.moveDate).getMonth();
  const peak = month >= 5 && month <= 8;

  const commit = (next: DateRange) => {
    setRange(next);
    if (next.start) update(leadFromWindow(next.start, next.end));
  };

  return (
    <div className="mt-3">
      <Popover
        open={open}
        onOpenChange={(next) => {
          // Reopening starts from whatever the lead currently says, so the
          // calendar never shows a stale range after an edit elsewhere.
          if (next) setRange(windowFromLead(draft.moveDate, draft.flexibility));
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-start transition-colors hover:border-foreground/25"
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {dict.quote.moveDate}
              </span>
              <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[15px]">
                <span className="font-medium tnum">{t.dateLong(draft.moveDate)}</span>
                <span className="text-[13px] text-muted-foreground">
                  {dict.enums.flexibility[draft.flexibility as DateFlexibility]}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full px-3 py-1.5 text-[13px] text-muted-foreground">
              {dict.common.change}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="flex max-h-[var(--radix-popover-content-available-height)] w-[min(640px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl p-5 shadow-float"
        >
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
            <RangeCalendar value={range} onChange={commit} />
          </div>
          <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t pt-4">
            <p className="text-[12.5px] text-muted-foreground">{dict.quote.howFlexible}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              {dict.dates.done}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {peak && (
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-brand-soft p-3.5 text-[13px] leading-relaxed dark:bg-accent">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          {dict.quote.peakSeason}
        </p>
      )}
    </div>
  );
}
