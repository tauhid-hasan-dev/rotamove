import { cn } from "@/lib/utils";
import type { Mover } from "@/lib/types";

const SIZES = {
  sm: "size-9 text-[12px] rounded-lg",
  md: "size-12 text-[15px] rounded-xl",
  lg: "size-16 text-[20px] rounded-2xl",
  xl: "size-20 text-[26px] rounded-2xl",
} as const;

/**
 * Generated partner mark. Real logos would be uploaded assets; a deterministic
 * monogram tile keeps the results board visually scannable without stand-in
 * images that would read as placeholder clutter.
 */
export function MoverLogo({
  mover,
  size = "md",
  className,
}: {
  mover: Pick<Mover, "monogram" | "accent" | "name">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden font-bold tracking-[-0.04em] text-white",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: mover.accent }}
      role="img"
      aria-label={`${mover.name} logo`}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 52%)",
        }}
      />
      <span
        className="pointer-events-none absolute -right-3 -top-3 size-10 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      <span className="relative">{mover.monogram}</span>
    </span>
  );
}
