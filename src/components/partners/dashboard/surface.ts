/**
 * The partner workspace's shared measurements.
 *
 * Both live here rather than being retyped per panel: the dashboard is nine
 * cards across four sections in four files, and a surface that drifts
 * between them is the thing a visitor notices before they notice anything
 * on it.
 */

/**
 * The workspace gutter.
 *
 * 5% a side, and deliberately not `PAGE_GUTTER`. The marketing pages run
 * 4/6/10% because they are a column of prose that wants a measure; a
 * dashboard is a work surface, and giving a lead board a tenth of a wide
 * screen on each side costs rows for nothing.
 */
export const DASHBOARD_GUTTER = "mx-auto w-full px-[5%]";

/**
 * A panel.
 *
 * The brand's lightest tint with a soft lift, rather than the plain card
 * colour on the page's own white — on a long board that gave no separation
 * at all until the border did the work on its own.
 *
 * Dark mode keeps the card colour: `--brand-tint` resolves to a near-black
 * green there, darker than `--card`, so the same rule would make every
 * panel sink into the page instead of lifting off it.
 */
export const PANEL =
  "rounded-2xl border border-brand/20 bg-brand-tint shadow-soft dark:border-border dark:bg-card";

/** The same surface for the smaller rows a board is made of. */
export const PANEL_ROW =
  "rounded-xl border border-brand/20 bg-brand-tint shadow-soft transition-shadow duration-300 hover:shadow-float dark:border-border dark:bg-card";
