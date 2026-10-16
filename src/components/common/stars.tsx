import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const rounded = Math.round(rating * 2) / 2;
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
      <span className="font-mono text-[12.5px] font-medium tnum">{rating.toFixed(1)}</span>
      {count !== undefined && !compact && (
        <span className="text-[12.5px] text-muted-foreground tnum">
          ({count.toLocaleString("en-GB")})
        </span>
      )}
      <span className="sr-only">
        {rating.toFixed(1)} out of 5{count !== undefined ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}
