"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";

/**
 * The hinge between the still globe and the turning one.
 *
 * This component is the only part of the globe that ships in the page's own
 * JavaScript, and it is deliberately tiny: an observer, a flag, and a dynamic
 * import. The renderer, d3's projection maths and a hundred kilobytes of
 * coastline are all on the far side of that import, so a visitor who reads
 * the hero and leaves pays nothing for a globe they never reached.
 *
 * The fetch starts 400px before the panel arrives — far enough that the
 * canvas is usually ready by the time it is on screen, close enough that
 * it is a real intent signal rather than a page-load tax.
 *
 * Until it resolves, and for ever if JavaScript never runs, the server's
 * still frame is what is on screen. The canvas fades in over it rather than
 * replacing it, so there is no flash of empty panel and no layout shift.
 * Both renderers draw the same scene at the same rotation, and the canvas
 * holds that rotation until this fade is done — blend two frames a few
 * degrees apart and every coastline doubles for the length of the
 * transition. See `HOLD` in `globe-canvas.tsx`.
 */
export function GlobeMount({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [Globe, setGlobe] = useState<ComponentType<{ label: string }> | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import("@/components/marketing/globe-canvas")
          .then((mod) => {
            if (!cancelled) setGlobe(() => mod.GlobeCanvas);
          })
          // A globe is not worth a broken page. If the chunk cannot be
          // fetched — offline, blocked, a bad deploy — the still frame
          // underneath is already a complete picture, so say nothing.
          .catch(() => {});
      },
      { rootMargin: "400px" },
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  // One frame between mount and fade, so the transition actually runs.
  useEffect(() => {
    if (!Globe) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [Globe]);

  return (
    <div
      ref={ref}
      aria-hidden={!Globe}
      className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
      style={{ opacity: shown ? 1 : 0 }}
    >
      {Globe && <Globe label={label} />}
    </div>
  );
}
