"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A star rating.
 *
 * Every number here goes through the locale: the score itself (German and
 * Turkish want "4,8", not "4.8"), the review count (grouped as "2.841" or
 * "2 841" depending on where you are) and the screen-reader sentence, which
 * was previously English in all eight languages.
 */
export function Stars({
  rating,
  count,
  className,
  compact = false,
}: {
  rating: number;
  count?: number;
  className?: string;
  compact?: boolean;
}) {
  const { dict, t } = useI18n();
  const rounded = Math.round(rating * 2) / 2;
  const score = t.decimal(rating, 1);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-px" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rounded - i));
          return (
            <span key={i} className="relative inline-block">
              <Star className="size-3.5 text-muted-foreground/30" strokeWidth={1.5} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className="size-3.5 fill-brand text-brand" strokeWidth={1.5} />
              </span>
            </span>
          );
        })}
      </span>
      <span className="font-mono text-[12.5px] font-medium tnum">{score}</span>
      {count !== undefined && !compact && (
        <span className="text-[12.5px] text-muted-foreground tnum">({t.number(count)})</span>
      )}
      <span className="sr-only">
        {count === undefined
          ? t.fill(dict.common.ratingLabel, { rating: score })
          : t.fill(dict.common.ratingLabelWithCount, {
              rating: score,
              count: t.number(count),
            })}
      </span>
    </span>
  );
}
