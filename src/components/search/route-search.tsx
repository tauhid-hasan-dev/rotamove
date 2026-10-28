"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { ArrowRight, ArrowLeftRight, Loader2, Search } from "lucide-react";
import { CityField } from "@/components/search/city-field";
import { DateRangeField } from "@/components/search/date-range-field";
import type { DateRange } from "@/components/common/range-calendar";
import { getCity } from "@/lib/geo";
import type { LastCallHours } from "@/lib/lanes";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * The search bar.
 *
 * Three segments and a button in one pill: where from, where to, when. Only
 * the route is required — dates are frequently unknown this early, and a
 * mandatory date field would turn an exploratory search into a dead end.
 */

const QUICK_ROUTES: Array<[string, string]> = [
  ["IST", "BER"],
  ["BER", "IST"],
  ["IST", "TAS"],
  ["IST", "DXB"],
];

type Field = "from" | "to" | "dates" | null;

export function RouteSearch({
  size = "lg",
  className,
  initial,
}: {
  size?: "lg" | "md";
  className?: string;
  /** Prefill, used when arriving from a last-call route card. */
  initial?: {
    from?: string | null;
    to?: string | null;
    dates?: DateRange;
    lastCall?: LastCallHours | null;
  };
}) {
  const router = useRouter();
  const { dict, href } = useI18n();

  const [from, setFrom] = useState<string | null>(initial?.from ?? null);
  const [to, setTo] = useState<string | null>(initial?.to ?? null);
  const [dates, setDates] = useState<DateRange>(
    initial?.dates ?? { start: null, end: null },
  );
  const [lastCall, setLastCall] = useState<LastCallHours | null>(initial?.lastCall ?? null);
  const [active, setActive] = useState<Field>(null);
  const [pending, startTransition] = useTransition();

  const complete = Boolean(from && to && from !== to);

  const go = useCallback(() => {
    if (!complete) {
      setActive(from ? "to" : "from");
      return;
    }
    const params = new URLSearchParams({ from: from!, to: to! });
    if (lastCall) {
      // Last call replaces the date window rather than narrowing it: the
      // wizard derives the collection date from the duration instead.
      params.set("lastcall", String(lastCall));
    } else {
      // The wizard turns these into a move date plus a flexibility window.
      if (dates.start) params.set("start", dates.start);
      if (dates.end) params.set("end", dates.end);
    }

    startTransition(() => router.push(href(`/quote?${params.toString()}`)));
  }, [complete, from, to, dates, lastCall, router, href]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const tall = size === "lg";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative flex w-full flex-col gap-1 rounded-3xl border bg-card p-1.5 transition-shadow duration-300 sm:flex-row sm:items-center sm:rounded-full",
          active ? "shadow-float" : "shadow-soft",
        )}
      >
        <CityField
          label={dict.search.fromLabel}
          placeholder={dict.search.fromPlaceholder}
          value={from}
          exclude={to}
          onChange={setFrom}
          active={active === "from"}
          onActivate={() => setActive("from")}
          onDismiss={() => setActive(null)}
          autoAdvance={() => !to && setActive("to")}
        />

        {/* seam: a full-width rule when stacked, a short one when inline */}
        <div className="relative mx-5 h-px shrink-0 bg-border sm:mx-0 sm:h-7 sm:w-px sm:self-center">
          <button
            type="button"
            onClick={swap}
            disabled={!from && !to}
            aria-label={dict.search.swap}
            className="absolute end-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border bg-card text-muted-foreground transition-all duration-300 hover:rotate-180 hover:text-foreground disabled:opacity-40 disabled:hover:rotate-0 sm:start-1/2 sm:end-auto sm:-translate-x-1/2 rtl:sm:translate-x-1/2"
          >
            <ArrowLeftRight className="size-3.5 sm:rotate-0 max-sm:rotate-90" />
          </button>
        </div>

        <CityField
          label={dict.search.toLabel}
          placeholder={dict.search.toPlaceholder}
          value={to}
          exclude={from}
          onChange={setTo}
          active={active === "to"}
          onActivate={() => setActive("to")}
          onDismiss={() => setActive(null)}
        />

        <div className="mx-5 h-px shrink-0 bg-border sm:mx-0 sm:h-7 sm:w-px sm:self-center" />

        <DateRangeField
          value={dates}
          onChange={setDates}
          lastCall={lastCall}
          onLastCallChange={setLastCall}
          active={active === "dates"}
          onActivate={() => setActive("dates")}
          onDismiss={() => setActive(null)}
        />

        <button
          type="button"
          onClick={go}
          disabled={pending}
          className={cn(
            "group inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
            "bg-brand text-ink hover:bg-brand-deep active:scale-[0.985]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
            tall ? "h-[52px] px-7 text-[15.5px]" : "h-11 px-6 text-[14.5px]",
          )}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4 sm:hidden" />
              {dict.common.search}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </>
          )}
        </button>
      </div>

      {!complete && !active && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {QUICK_ROUTES.map(([a, b]) => {
            const ca = getCity(a);
            const cb = getCity(b);
            if (!ca || !cb) return null;
            return (
              <button
                key={`${a}-${b}`}
                type="button"
                onClick={() => {
                  setFrom(a);
                  setTo(b);
                }}
                className="rounded-full border px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-foreground"
              >
                {ca.name} → {cb.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
