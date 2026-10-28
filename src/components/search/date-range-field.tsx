"use client";

import { Clock3 } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { RangeCalendar, type DateRange } from "@/components/common/range-calendar";
import { useI18n } from "@/i18n/provider";
import { daysBetween } from "@/lib/calendar";
import { LAST_CALL_HOURS, type LastCallHours } from "@/lib/lanes";
import { cn } from "@/lib/utils";

/**
 * The "when" segment of the search bar.
 *
 * Reads as a label plus a value until you touch it, exactly like the two city
 * fields, so the bar stays one object rather than a row of mismatched
 * controls. Dates are optional: plenty of people are shopping a corridor
 * before they have a date, and forcing one would cost those searches.
 *
 * It carries two mutually exclusive answers to "when": a date range, or a
 * last-call window measured in hours. They live in one segment rather than
 * two because they answer the same question — and picking last call has to
 * visibly take the calendar away, not sit beside it.
 */
export function DateRangeField({
  value,
  onChange,
  lastCall,
  onLastCallChange,
  active,
  onActivate,
  onDismiss,
  align = "end",
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  /** Hours, or `null` when the shopper is searching by date as usual. */
  lastCall: LastCallHours | null;
  onLastCallChange: (next: LastCallHours | null) => void;
  active: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  align?: "start" | "center" | "end";
}) {
  const { dict, t } = useI18n();

  const summary = (() => {
    if (lastCall) return t.fill(dict.dates.lastCallHours, { n: lastCall });
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
            <span className="eyebrow text-[10px] leading-none">
              {lastCall ? dict.dates.lastCallLabel : dict.dates.label}
            </span>
            <span
              className={cn(
                "flex w-full items-center gap-1.5 truncate text-[16.5px] leading-none",
                summary ? "" : "text-muted-foreground",
              )}
            >
              {lastCall ? <Clock3 className="size-3.5 shrink-0 text-lastcall-accent" /> : null}
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
        {/* Mode switch. Choosing last call clears any dates — the two are
            different answers to the same question, not a date plus a filter. */}
        <div
          role="radiogroup"
          aria-label={dict.dates.modeAria}
          className="mb-4 inline-flex shrink-0 self-start rounded-full border bg-background p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!lastCall}
            onClick={() => onLastCallChange(null)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
              !lastCall ? "bg-brand text-ink" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {dict.dates.modeDates}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={Boolean(lastCall)}
            onClick={() => {
              onChange({ start: null, end: null });
              onLastCallChange(lastCall ?? 24);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
              lastCall
                ? "bg-lastcall-accent text-ink"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clock3 className="size-3.5" />
            {dict.dates.modeLastCall}
          </button>
        </div>

        {lastCall ? (
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
            <p className="text-[13.5px] font-medium">{dict.dates.lastCallPrompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {LAST_CALL_HOURS.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  role="radio"
                  aria-checked={lastCall === hours}
                  onClick={() => onLastCallChange(hours)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-start transition-all duration-200",
                    "hover:border-foreground/25",
                    lastCall === hours &&
                      "border-lastcall-accent bg-lastcall shadow-[0_0_0_1px_var(--lastcall-accent)]",
                  )}
                >
                  <span className="block text-[16px] font-semibold tnum">
                    {t.fill(dict.dates.lastCallHours, { n: hours })}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                    {t.fill(dict.dates.lastCallOptionHint, { n: hours })}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
              {dict.dates.lastCallNote}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim">
            <RangeCalendar value={value} onChange={onChange} />
          </div>
        )}

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-[12.5px] text-muted-foreground">
            {lastCall
              ? dict.dates.lastCallHint
              : span !== null
                ? t.fill(dict.dates.flexibleBy, {
                    days: t.count(dict.units.days, span),
                  })
                : dict.dates.hint}
          </p>

          <div className="flex items-center gap-1">
            {(value.start || value.end) && !lastCall && (
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
