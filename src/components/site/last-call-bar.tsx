"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlarmClock, ArrowRight, X } from "lucide-react";
import { PAGE_GUTTER } from "@/components/common/section";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { LAST_CALL_DISMISSED, LAST_CALL_FLAG } from "@/lib/last-call";

/**
 * The last-call strip above the navigation.
 *
 * Dismissal is remembered in `localStorage` and applied by a tiny blocking
 * script in the layout, which sets a flag on `<html>` before first paint. That
 * is the only way to get all three of: no layout shift for new visitors, no
 * flash-then-vanish for returning ones, and no server/client mismatch — a
 * `useEffect` can only ever give you two of the three.
 *
 * So this component always renders; CSS hides it when the flag is set.
 *
 * The number of live offers is fetched rather than passed in: the layout
 * that mounts this strip is prerendered for all eight locales, so it cannot
 * read a store whose contents expire by the hour. Advertising a count that
 * does not match the board it links to is worse than showing it a moment
 * late.
 */
export function LastCallBar() {
  const { dict, t, href } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let live = true;
    // Deferred into a callback so the effect body stays free of state
    // writes; the strip simply appears once the count is known.
    const timer = setTimeout(() => {
      void fetch("/api/last-call", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { count?: number } | null) => {
          if (live && typeof data?.count === "number") setCount(data.count);
        })
        .catch(() => {
          // No offers shown rather than a wrong number.
        });
    }, 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  if (count <= 0 || dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(LAST_CALL_DISMISSED, "1");
    } catch {
      // Private mode, or storage disabled. Hiding it for this page view is
      // still the right outcome.
    }
    document.documentElement.dataset[LAST_CALL_FLAG] = "off";
    setDismissed(true);
  };

  return (
    <div className="last-call-bar bg-lastcall text-lastcall-foreground">
      <div className={cn(PAGE_GUTTER, "flex items-center gap-x-3 gap-y-1 py-2")}>
        <AlarmClock
          className="last-call-ring size-4 shrink-0 motion-reduce:animate-none"
          strokeWidth={2.2}
          aria-hidden
        />

        <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-[13px]">
          <span className="rounded-full bg-lastcall-accent px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]">
            {dict.lastCall.badge}
          </span>
          <span className="min-w-0">
            {t.fill(dict.lastCall.body, { count: t.number(count) })}
          </span>
        </p>

        <Link
          href={href("/last-call")}
          className="group ms-auto hidden shrink-0 items-center gap-1 text-[13px] font-medium underline-offset-4 hover:underline sm:inline-flex"
        >
          {dict.lastCall.cta}
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label={dict.lastCall.dismiss}
          className="ms-auto grid size-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/10 sm:ms-1 dark:hover:bg-white/10"
        >
          <X className="size-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
