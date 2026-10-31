import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page gutter — 10% of the viewport on either side from `lg` up.
 *
 * Every band on the page goes through this: header, last-call strip, content
 * and footer. They used to hand-roll their own container with different caps
 * (1240px for the chrome, 1400px for content), so the navigation visibly did
 * not line up with the page under it. One component means that cannot drift
 * again.
 *
 * It narrows on the way down rather than holding at 10%: a tenth of a 390px
 * phone is 39px a side, which would throw away a fifth of the usable width on
 * the screen that can least afford it. 4% on a phone, 6% through the tablet
 * range, 10% once there is room to spare.
 *
 * And it stops growing at the top. A percentage gutter alone is a percentage
 * *measure*: on a 27" panel 10% a side left 2048px of running text, which is
 * about 180 characters to a line — unreadable in the particular way that
 * looks fine in a screenshot and makes you lose your place in the paragraph.
 *
 * The cap takes over from the percentage rather than sitting on top of it,
 * and that distinction is the whole of why `3xl:px-0` is there. Percentage
 * padding resolves against the *parent's* width, not the element's own, so
 * `max-w` plus `px-[10%]` on a 2560px screen is a 1760px box with 256px of
 * padding a side — a narrower measure than a laptop gets, shrinking further
 * the wider the display. Above 1920 the width is therefore a flat number
 * and the gutter is whatever is left over.
 *
 * 1536px is exactly what 10% of 1920 leaves, so nothing moves as the cap
 * engages; 4xl lets it out again on a 27" panel and up.
 */
export const PAGE_GUTTER =
  "mx-auto w-full px-[4%] sm:px-[6%] lg:px-[10%] 3xl:max-w-[1536px] 3xl:px-0 4xl:max-w-[1760px]";

export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(PAGE_GUTTER, className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-2", className)}>
      <span className="inline-block h-px w-6 bg-brand" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="max-w-3xl text-[clamp(1.85rem,3.4vw,2.9rem)] font-extrabold leading-[1.05]">
        {title}
      </h2>
      {lede && (
        <p className="max-w-2xl text-[16.5px] leading-relaxed text-muted-foreground">{lede}</p>
      )}
      {children}
    </div>
  );
}
