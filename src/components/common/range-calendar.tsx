"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LOCALE_META } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import {
  addMonths,
  firstWeekday,
  fromIso,
  isSameDay,
  isWithin,
  monthGrid,
  monthLabel,
  todayLocalIso,
  weekdayHeaders,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: string | null;
  end: string | null;
}

/**
 * A two-month range picker.
 *
 * Built rather than installed: the product already depends on `Intl` for every
 * other locale-sensitive thing, and `Intl` knows the month names, the weekday
 * initials and — through `getWeekInfo` — which day each locale starts its week
 * on. Arabic starts on Saturday here because that is what the locale says, not
 * because of a special case.
 *
 * Layout runs under the document's own direction, so the RTL grid and the
 * right-to-left month order come for free; only the pager arrows need flipping.
 */
export function RangeCalendar({
  value,
  onChange,
  months = 2,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  months?: number;
}) {
  const { locale, dict, rtl } = useI18n();
  const bcp47 = LOCALE_META[locale].bcp47;
  const today = todayLocalIso();

  const weekStart = useMemo(() => firstWeekday(bcp47), [bcp47]);
  const headers = useMemo(() => weekdayHeaders(bcp47, weekStart), [bcp47, weekStart]);

  // Open on the month already selected, otherwise on this month.
  const [cursor, setCursor] = useState<Date>(() => {
    const anchor = value.start ? fromIso(value.start) : new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });
  const [hovered, setHovered] = useState<string | null>(null);

  const thisMonth = new Date();
  const atStart =
    cursor.getFullYear() === thisMonth.getFullYear() &&
    cursor.getMonth() === thisMonth.getMonth();

  /**
   * First click sets the start and clears the end; second click closes the
   * range. Clicking before the start restarts rather than silently swapping —
   * a range that reverses under you is disorienting.
   */
  const pick = (iso: string) => {
    if (!value.start || value.end || iso < value.start) {
      onChange({ start: iso, end: null });
      setHovered(null);
      return;
    }
    onChange({ start: value.start, end: iso });
    setHovered(null);
  };

  // While choosing the end, the hovered day stands in for it.
  const provisionalEnd = value.start && !value.end ? hovered : value.end;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, -1))}
          disabled={atStart}
          aria-label={dict.dates.previousMonth}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          {rtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label={dict.dates.nextMonth}
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {rtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      <div
        className={cn("mt-1 grid gap-6", months > 1 && "sm:grid-cols-2")}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: months }, (_, offset) => {
          const monthDate = addMonths(cursor, offset);
          const grid = monthGrid(monthDate.getFullYear(), monthDate.getMonth(), weekStart);
          return (
            <div key={offset} className={cn(offset > 0 && months > 1 && "hidden sm:block")}>
              <p className="pb-3 text-center text-[14px] font-medium">
                {monthLabel(bcp47, monthDate)}
              </p>

              <div
                className="grid grid-cols-7 gap-y-1"
                role="grid"
                aria-label={monthLabel(bcp47, monthDate)}
              >
                {headers.map((day, i) => (
                  <abbr
                    key={i}
                    title={day.long}
                    className="pb-1 text-center text-[11px] font-normal text-muted-foreground no-underline"
                  >
                    {day.narrow}
                  </abbr>
                ))}

                {grid.weeks.flat().map((iso, i) => {
                  if (!iso) return <span key={i} />;

                  const past = iso < today;
                  const isStart = isSameDay(iso, value.start);
                  const isEnd = isSameDay(iso, provisionalEnd);
                  const inRange = isWithin(iso, value.start, provisionalEnd);
                  const edge = isStart || isEnd;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={past}
                      onClick={() => pick(iso)}
                      onMouseEnter={() => !past && setHovered(iso)}
                      aria-pressed={edge || inRange}
                      className={cn(
                        "relative h-8 text-[13.5px] tnum transition-colors",
                        // Inset, because the popover clips: an outline drawn
                        // outside the button is sliced off for days in the
                        // first and last columns, which is exactly where
                        // keyboard users land first.
                        "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70",
                        "disabled:pointer-events-none disabled:text-muted-foreground/35",
                        // The connecting band sits behind the day, squared off
                        // between the two ends and rounded at them.
                        inRange && "bg-brand-soft dark:bg-accent",
                        isStart && !isEnd && "rounded-s-full bg-brand-soft dark:bg-accent",
                        isEnd && !isStart && "rounded-e-full bg-brand-soft dark:bg-accent",
                        !inRange && !edge && !past && "hover:bg-muted rounded-full",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-0 m-auto grid size-8 place-items-center rounded-full",
                          edge && "bg-brand font-medium text-ink",
                          iso === today && !edge && "ring-1 ring-inset ring-border",
                        )}
                      >
                        {fromIso(iso).getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
