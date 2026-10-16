"use client";

import { cn } from "@/lib/utils";

/**
 * Placeholder card. Mirrors the real card's geometry so the list does not
 * reflow when a mover lands — the ghost is simply replaced.
 */
export function MoverSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card" aria-hidden>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Block className="size-16 shrink-0 rounded-2xl" delay={delay} />
          <div className="min-w-0 flex-1 space-y-2.5 pt-1">
            <Block className="h-4 w-[45%] rounded-md" delay={delay + 70} />
            <Block className="h-3 w-[30%] rounded-md" delay={delay + 130} />
          </div>
        </div>
        <Block className="mt-5 h-[58px] w-full rounded-2xl" delay={delay + 180} />
        <div className="mt-4 flex gap-3">
          <Block className="h-3 w-24 rounded-md" delay={delay + 230} />
          <Block className="h-3 w-28 rounded-md" delay={delay + 270} />
          <Block className="h-3 w-20 rounded-md" delay={delay + 310} />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t bg-surface/60 px-5 py-4 sm:px-6">
        <Block className="h-9 w-[220px] rounded-full" delay={delay + 340} />
        <Block className="ml-auto h-9 w-[150px] rounded-full" delay={delay + 380} />
      </div>
    </div>
  );
}

function Block({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <span
      className={cn("block skeleton-shimmer", className)}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
