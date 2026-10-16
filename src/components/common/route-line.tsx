import { Plane, Ship, Train, Truck } from "lucide-react";
import type { TransportMode } from "@/lib/geo";
import { cn } from "@/lib/utils";

export const MODE_META: Record<
  TransportMode,
  { label: string; Icon: typeof Truck; hint: string }
> = {
  road: { label: "Road", Icon: Truck, hint: "Door-to-door truck, no transhipment" },
  sea: { label: "Sea", Icon: Ship, hint: "LCL container — cheapest for long hauls" },
  air: { label: "Air", Icon: Plane, hint: "Fastest, best for small consignments" },
  rail: { label: "Rail", Icon: Train, hint: "Block train — low emission, fixed schedule" },
};

/**
 * A move rendered as a flight leg: origin hub, the mode travelling between,
 * arrival hub. Borrowing the airline-itinerary grammar makes a 2 000 km
 * household move legible at a glance.
 */
export function RouteLine({
  from,
  to,
  mode,
  caption,
  className,
  animated = false,
  size = "md",
}: {
  from: string;
  to: string;
  mode: TransportMode;
  caption?: string;
  className?: string;
  animated?: boolean;
  size?: "sm" | "md";
}) {
  const { Icon, label } = MODE_META[mode];
  const codeClass =
    size === "sm"
      ? "font-mono text-[13px] font-semibold tracking-[0.04em]"
      : "font-mono text-[17px] font-semibold tracking-[0.04em]";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={codeClass}>{from}</span>

      <div className="relative flex min-w-[88px] flex-1 items-center">
        <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
        <span
          className={cn(
            "h-px flex-1 dotted-route",
            animated && "motion-safe:animate-pulse",
          )}
        />
        <span className="mx-1.5 inline-flex items-center gap-1 rounded-full border bg-background px-1.5 py-0.5">
          <Icon className="size-3 text-brand" strokeWidth={2} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </span>
        </span>
        <span className="h-px flex-1 dotted-route" />
        <svg viewBox="0 0 8 8" className="size-2 shrink-0 fill-brand" aria-hidden>
          <path d="M0 0 L8 4 L0 8 Z" />
        </svg>
      </div>

      <span className={codeClass}>{to}</span>

      {caption && (
        <span className="ml-1 whitespace-nowrap font-mono text-[11.5px] text-muted-foreground tnum">
          {caption}
        </span>
      )}
    </div>
  );
}
