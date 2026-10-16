"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Count-up number. Writes straight to textContent so a fast-changing figure
 * (partners scanned, quotes found) never triggers a React re-render per frame.
 */
export function Counter({
  value,
  duration = 1.1,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  startOnView = true,
  locale = "en-GB",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  startOnView?: boolean;
  locale?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (startOnView && !inView) return;

    const format = (n: number) =>
      `${prefix}${n.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

    if (reduceMotion) {
      node.textContent = format(value);
      previous.current = value;
      return;
    }

    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
      onComplete: () => {
        previous.current = value;
      },
    });
    return () => controls.stop();
  }, [value, duration, decimals, prefix, suffix, inView, startOnView, reduceMotion, locale]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}
      {(0).toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
