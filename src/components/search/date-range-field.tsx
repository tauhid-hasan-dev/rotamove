"use client";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { RangeCalendar, type DateRange } from "@/components/common/range-calendar";
import { useI18n } from "@/i18n/provider";
import { daysBetween } from "@/lib/calendar";
import { cn } from "@/lib/utils";

/**
 * The "when" segment of the search bar.
 *
 * Reads as a label plus a value until you touch it, exactly like the two city
 * fields, so the bar stays one object rather than a row of mismatched
 * controls. Dates are optional: plenty of people are shopping a corridor
 * before they have a date, and forcing one would cost those searches.
 */
export function DateRangeField({
  value,
  onChange,
  active,
  onActivate,
  onDismiss,
  align = "end",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  active: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  align?: "start" | "center" | "end";
}) {
  const { dict, t } = useI18n();

  const summary = (() => {
    if (!value.start) return null;
    if (!value.end || value.end === value.start) return t.dateShort(value.start);
    return t.dateRange([value.start, value.end]);
  })();

  const span = value.start && value.end ? daysBetween(value.start, value.end) : null;

  return (
    <Popover open={active} onOpenChange={(open) => !open && onDismiss()}>
      <PopoverAnchor asChild>
        <div className="min-w-0 flex-1 sm:max-w-[240px]">
          <button
            type="button"
            onClick={onActivate}
            className={cn(
              // Same height as the city fields and the action button, so the
              // bar reads as a single pill.
              "flex h-[52px] w-full flex-col items-start justify-center gap-[3px] rounded-full px-5 text-start transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "bg-muted/70" : "hover:bg-muted/50",
            )}
          >
            <span className="eyebrow text-[10px] leading-none">{dict.dates.label}</span>
            <span
              className={cn(
                "w-full truncate text-[16.5px] leading-none",
                summary ? "" : "text-muted-foreground",
              )}
            >
              {summary ?? dict.dates.placeholder}
            </span>
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align={align}
        sideOffset={10}
        // A two-month calendar is tall enough to overflow a short laptop.
        // `--radix-popover-content-available-height` is the space Radix
        // actually measured after flipping, so capping to it is the only
        // bound that cannot be wrong; the calendar then scrolls inside.
        collisionPadding={16}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[min(640px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl p-5 shadow-float"
      >
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
          <RangeCalendar value={value} onChange={onChange} />
        </div>

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-[12.5px] text-muted-foreground">
            {span !== null
              ? t.fill(dict.dates.flexibleBy, {
                  days: t.count(dict.units.days, span),
                })
              : dict.dates.hint}
          </p>

          <div className="flex items-center gap-1">
            {(value.start || value.end) && (
              <button
                type="button"
                onClick={() => onChange({ start: null, end: null })}
                className="rounded-full px-3.5 py-2 text-[13px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {dict.dates.clear}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              {dict.dates.done}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
