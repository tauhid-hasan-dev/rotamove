/**
 * The coverage map's frame and projection.
 *
 * One equirectangular frame — Iberia to the Tian Shan, the Nordics to the
 * Horn — shared by everything drawn on the map: the real country outlines in
 * `world-land.ts`, the corridor arcs, and the hub dots. Lifted out of the
 * component so the build-time geometry generator and the runtime renderer
 * cannot drift apart: `scripts/generate-world-land.mjs` reads these very
 * constants out of this file, so changing the frame here and re-running the
 * generator moves the land and the lanes together.
 *
 * Equirectangular, not a pretty projection. Latitude is stretched at the top
 * of the frame — Scandinavia looks wider than it is — but longitude and
 * latitude both stay linear, which is what lets a corridor be drawn as a
 * quadratic curve between two city coordinates instead of a resampled great
 * circle.
 */

/** The frame: Iberia to the Tian Shan, the Nordics to the Horn. */
export const LON_W = -24;
export const LON_E = 96;
export const LAT_N = 70;
export const LAT_S = 10;

/** 2:1, which is what the frame is. Big, because it was asked to be. */
export const VIEW_W = 1400;
export const VIEW_H = (VIEW_W * (LAT_N - LAT_S)) / (LON_E - LON_W);

export const projectX = (lon: number) => ((lon - LON_W) / (LON_E - LON_W)) * VIEW_W;
export const projectY = (lat: number) => ((LAT_N - lat) / (LAT_N - LAT_S)) * VIEW_H;
