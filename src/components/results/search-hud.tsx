"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { Counter } from "@/components/common/counter";
import type { StageView } from "@/components/results/use-search-stream";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Search status.
 *
 * The wait is the product's first impression, so it gets narrated rather than
 * spinner-ed — but quietly: one line of text, one progress rule, one counter.
 */
export function SearchHud({
  stages,
  progress,
  found,
  originCode,
  destCode,
  status,
  elapsedMs,
}: {
  stages: StageView[];
  progress: number;
  found: number;
  originCode: string;
  destCode: string;
  status: "connecting" | "searching" | "done" | "error";
  elapsedMs: number;
}) {
  const { dict, t } = useI18n();
  const current = stages[stages.length - 1];
  const done = status === "done";

  return (
    <motion.section layout aria-live="polite" className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <div className="relative h-[72px] sm:h-[84px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={done ? "done" : (current?.id ?? "boot")}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <h1 className="truncate text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.08]">
                  {done ? (
                    <>
                      <Counter value={found} duration={0.7} startOnView={false} />{" "}
                      {dict.results.canTakeThis}
                    </>
                  ) : (
                    (current?.label ?? dict.results.openingSearch)
                  )}
                </h1>
                <p className="mt-1.5 truncate text-[14.5px] text-muted-foreground">
                  {done
                    ? t.fill(dict.results.matchedIn, {
                        seconds: t.decimal(elapsedMs / 1000, 1),
                      })
                    : (current?.detail ?? dict.results.oneMoment)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {done && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-[13px] font-medium text-ink"
          >
            <Check className="size-3.5" strokeWidth={3} />
            {dict.results.complete}
          </motion.span>
        )}
      </div>

      <ScanLine from={originCode} to={destCode} progress={progress} done={done} />
    </motion.section>
  );
}

function ScanLine({
  from,
  to,
  progress,
  done,
}: {
  from: string;
  to: string;
  progress: number;
  done: boolean;
}) {
  return (
    <div className="mt-6 flex items-center gap-4">
      <span className="code shrink-0 text-[13px] text-muted-foreground">{from}</span>

      <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-border">
        <motion.span
          className="absolute inset-y-0 start-0 rounded-full bg-brand"
          initial={{ width: "2%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {!done && (
          <motion.span
            className="absolute inset-y-0 w-20 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/25"
            animate={{ x: ["-20%", "520%"] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      <span
        className={cn(
          "code shrink-0 text-[13px] transition-colors duration-500",
          done ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {to}
      </span>
    </div>
  );
}
