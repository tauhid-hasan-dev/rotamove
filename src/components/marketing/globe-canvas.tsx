"use client";

import { useEffect, useRef } from "react";
import { geoDistance, geoInterpolate, geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import {
  LANES,
  LANE_LINES,
  LAND_QUIET,
  LAND_SERVED,
  NODES,
  PAINT,
  RADIUS,
  SPIN_PER_SECOND,
  START_LON,
  TILT,
  VIEW,
  placeLabels,
} from "@/lib/globe-scene";

/**
 * The globe, turning.
 *
 * Canvas rather than SVG, and 2D rather than WebGL. A sphere with a fixed
 * light and no user camera needs an orthographic projection and a fill — it
 * does not need a scene graph, a shader pipeline or half a megabyte of
 * engine. What it costs instead is one projection re-run per frame over ten
 * thousand points, which is a couple of milliseconds.
 *
 * Everything here is about not spending that couple of milliseconds when
 * nobody is looking:
 *
 *   · the whole module is behind a dynamic import, so a visitor who never
 *     scrolls this far downloads none of it, geometry included;
 *   · the loop runs only while the panel is on screen AND the tab is
 *     foreground, and stops dead otherwise;
 *   · it draws at 30fps, not 60. The globe turns two degrees a second —
 *     at that speed the second frame of every pair is identical to the eye
 *     and costs exactly as much as the first;
 *   · the backing store is capped at 2× regardless of how many pixels the
 *     display claims, because a 3× phone would triple the fill cost to
 *     render detail the geometry does not contain.
 *
 * Under `prefers-reduced-motion` it paints one frame and never starts the
 * loop. The globe is still there, still readable — it simply does not turn.
 */

export function GlobeCanvas({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const projection = geoOrthographic().clipAngle(90).precision(0.4);
    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let unit = 1;
    let offX = 0;
    let offY = 0;
    let lon = START_LON;

    // The projection never changes: it draws into the shared VIEW box, and
    // the context transform is what puts that box on the screen.
    projection.translate([VIEW / 2, VIEW / 2]).scale(RADIUS);

    /* ------------------------------------------------------------ sizing -- */

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      // Capped at 2: beyond that the fill cost rises with no detail to show.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // `xMidYMid meet`, by hand — the same fit the SVG above uses, so the
      // two globes land on exactly the same pixels.
      unit = Math.min(width, height) / VIEW;
      offX = (width - VIEW * unit) / 2;
      offY = (height - VIEW * unit) / 2;
      draw();
    };

    /* ------------------------------------------------------------ drawing -- */

    /** Is this point on the half of the sphere facing us? */
    const facing = (point: [number, number]) => {
      const [rLon, rLat] = projection.rotate();
      return geoDistance(point, [-rLon, -rLat]) < Math.PI / 2 - 0.02;
    };

    const draw = () => {
      projection.rotate([-lon, -TILT]);

      // Clear in device space, then draw in VIEW units.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.setTransform(dpr * unit, 0, 0, dpr * unit, dpr * offX, dpr * offY);

      const cx = VIEW / 2;
      const cy = VIEW / 2;
      const radius = RADIUS;

      // --- the atmosphere, outside the limb ---------------------------- //
      // A hairline of light hugging the edge, not a halo. The first version
      // of this bled a third of the way across the panel and turned the
      // sphere into a glowing orb in a vacuum, which is a video game, not a
      // coverage map.
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.99, cx, cy, radius * 1.06);
      halo.addColorStop(0, "rgba(159,232,112,0.17)");
      halo.addColorStop(1, "rgba(159,232,112,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.06, 0, Math.PI * 2);
      ctx.fill();

      // --- the ocean ---------------------------------------------------- //
      // Lit from the upper left, so the sphere reads as a sphere rather than
      // as a circle with countries printed on it.
      const sea = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.05,
        cx,
        cy,
        radius,
      );
      sea.addColorStop(0, PAINT.oceanRim);
      sea.addColorStop(1, PAINT.ocean);
      ctx.fillStyle = sea;
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fill();

      // --- graticule ----------------------------------------------------- //
      ctx.strokeStyle = PAINT.graticule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      path(graticule);
      ctx.stroke();

      // --- land ---------------------------------------------------------- //
      ctx.beginPath();
      path(LAND_QUIET);
      ctx.fillStyle = PAINT.land;
      ctx.fill();
      ctx.strokeStyle = PAINT.landEdge;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      path(LAND_SERVED);
      ctx.fillStyle = PAINT.served;
      ctx.fill();
      ctx.strokeStyle = PAINT.servedEdge;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // --- lanes ---------------------------------------------------------- //
      ctx.beginPath();
      path(LANE_LINES);
      ctx.strokeStyle = "rgba(159,232,112,0.55)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // --- the pulse travelling each lane --------------------------------- //
      // One shipment per corridor, staggered, on the same slow cadence the
      // flat map used. Drawn only while it is on the facing hemisphere —
      // a dot that carried on across the back of the globe would read as a
      // dot sitting on the ocean.
      const now = performance.now() / 1000;
      LANES.forEach((lane, i) => {
        const t = ((now / 9 + i * 0.17) % 1);
        const point = geoInterpolate(lane.a, lane.b)(t) as [number, number];
        if (!facing(point)) return;
        const xy = projection(point);
        if (!xy) return;
        const glow = ctx.createRadialGradient(xy[0], xy[1], 0, xy[0], xy[1], 10);
        glow.addColorStop(0, "rgba(185,247,138,0.95)");
        glow.addColorStop(1, "rgba(185,247,138,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(xy[0], xy[1], 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- hubs, and their names ------------------------------------------ //
      // A label fades out as its hub approaches the limb. Names stacked up
      // against the edge of a sphere are unreadable and, worse, they look
      // like they belong to whatever is behind them.
      // 12 VIEW units, exactly as the still frame's `fontSize="12"` — see
      // `VIEW` in `globe-scene.ts` for why that has to be the same number.
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font =
        "500 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

      const [rLon, rLat] = projection.rotate();
      const centre: [number, number] = [-rLon, -rLat];
      const candidates: Array<{ x: number; y: number; text: string; fade: number }> = [];

      for (const city of NODES) {
        const point: [number, number] = [city.lon, city.lat];
        if (!facing(point)) continue;
        const xy = projection(point);
        if (!xy) continue;

        const away = geoDistance(point, centre) / (Math.PI / 2);
        const fade = Math.max(0, Math.min(1, (1 - away) * 2.6));

        // The dot always goes in. Only the name has to compete for space.
        ctx.globalAlpha = Math.max(0.25, fade);
        ctx.fillStyle = PAINT.brand;
        ctx.beginPath();
        ctx.arc(xy[0], xy[1], 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (fade > 0.45) candidates.push({ x: xy[0], y: xy[1], text: city.name, fade });
      }

      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      for (const label of placeLabels(candidates, (t) => ctx.measureText(t).width, 14)) {
        ctx.globalAlpha = label.fade;
        ctx.strokeStyle = PAINT.labelRim;
        ctx.strokeText(label.text, label.x + 7, label.y);
        ctx.fillStyle = PAINT.label;
        ctx.fillText(label.text, label.x + 7, label.y);
      }
      ctx.globalAlpha = 1;
    };

    /* ------------------------------------------------------------- the loop -- */

    let frame = 0;
    let last = 0;
    let running = false;
    // 30fps. At two degrees a second the skipped frame is a 0.03° rotation.
    const STEP = 1000 / 30;

    /*
     * The globe holds still while it fades in.
     *
     * `GlobeMount` cross-fades this canvas over the server's still frame,
     * which is painted at `START_LON`. If the spin began immediately, the
     * two pictures would be a few degrees apart for the length of the fade
     * and every coastline and label would briefly show as a double image —
     * which is precisely what it looked like. Staying put until the fade is
     * over means the two frames are identical while they are blended, so
     * there is nothing to see in the handover. It starts turning after.
     */
    const HOLD = 900;
    let spinFrom = 0;

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const delta = time - last;
      if (delta < STEP) return;
      // Advance by wall-clock, not by frame count, so a dropped frame slows
      // nothing down and a backgrounded tab does not snap on return.
      if (time - spinFrom > HOLD) {
        lon += SPIN_PER_SECOND * (Math.min(delta, 250) / 1000);
      }
      last = time;
      draw();
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      // Only the first run waits out the fade. Coming back from a scroll or
      // a background tab, the globe is already on screen and carries on.
      if (!spinFrom) spinFrom = last;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    /* --------------------------------------------------------- when to run -- */

    // Two gates, and both have to be open: the panel has to be on screen and
    // the tab has to be the one being looked at. A globe spinning in a
    // background tab is pure heat.
    let onScreen = false;

    const sync = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: "120px" },
    );
    io.observe(wrap);

    document.addEventListener("visibilitychange", sync);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="block size-full" role="img" aria-label={label} />
    </div>
  );
}
