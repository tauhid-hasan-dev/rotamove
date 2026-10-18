import type { Corridor, RegionId } from "@/lib/geo";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill } from "@/i18n/format";

/**
 * Localised names for the geography layer.
 *
 * `lib/geo.ts` stays a pure data module with English labels — it is the shape
 * a `geo` service would return — and translation happens here, at the view
 * boundary. That keeps the pricing, matching and corridor logic completely
 * unaware that the product is multilingual.
 */

export const regionName = (dict: Dictionary, id: RegionId): string => dict.enums.regions[id];

/**
 * A corridor's display name.
 *
 * The nineteen corridors we actually sell have hand-written names in every
 * language ("Europe → Central Asia (via Middle Corridor)" is not something to
 * machine-assemble). Lanes outside that set are synthesised by `geo.ts` at
 * request time, so those fall back to a pattern filled with translated region
 * names.
 */
export function corridorLabel(dict: Dictionary, corridor: Corridor): string {
  const known = (dict.enums.corridors as Record<string, string | undefined>)[corridor.id];
  if (known) return known;

  if (corridor.from === corridor.to) {
    return fill(dict.enums.corridorFallback.domestic, {
      region: regionName(dict, corridor.from),
    });
  }

  return fill(dict.enums.corridorFallback.extended, {
    from: regionName(dict, corridor.from),
    to: regionName(dict, corridor.to),
  });
}
