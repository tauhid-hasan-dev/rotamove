import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryName, fill, formatDateLong, formatDays, formatNumber } from "@/i18n/format";
import type { StageParams } from "@/lib/types";

/**
 * Turns a stage event into narration in the reader's language.
 *
 * The search stream is produced by a route handler, which has no access to the
 * locale, so it emits a stable `id`, the values the sentence is built from, and
 * an English fallback. Translation happens here.
 *
 * An unrecognised id returns the server's text rather than an empty string:
 * adding a stage server-side should degrade to English, never to a blank line.
 */
export function translateStage(
  locale: Locale,
  dict: Dictionary,
  stage: { id: string; label: string; detail: string; params?: StageParams },
): { label: string; detail: string } {
  const stages = dict.results.stages;
  const p = stage.params ?? {};

  switch (stage.id) {
    case "secure":
      return { label: stages.secure.label, detail: stages.secure.detail };

    case "corridor": {
      // Prefer the translated corridor name; fall back to the one the server
      // sent for lanes outside the sold set.
      const corridor =
        (p.corridorId &&
          (dict.enums.corridors as Record<string, string | undefined>)[p.corridorId]) ||
        p.corridorLabel ||
        "";

      return {
        label: fill(stages.corridor.label, {
          from: p.fromCode ?? "???",
          to: p.toCode ?? "???",
        }),
        detail: p.coreCorridor
          ? fill(stages.corridor.detailCore, {
              corridor,
              days: p.transitDays ? formatDays(locale, dict, p.transitDays) : "",
            })
          : fill(stages.corridor.detailExtended, { corridor }),
      };
    }

    case "partners":
      return {
        label: fill(stages.partners.label, {
          count: formatNumber(locale, p.count ?? 0),
        }),
        detail: fill(stages.partners.detail, {
          // ISO codes in, localised country names out.
          from: p.fromCountry ? countryName(locale, p.fromCountry, p.fromCountry) : "",
          to: p.toCountry ? countryName(locale, p.toCountry, p.toCountry) : "",
        }),
      };

    case "capacity":
      return {
        label: stages.capacity.label,
        detail: fill(stages.capacity.detail, {
          date: p.date ? formatDateLong(locale, p.date) : "",
        }),
      };

    case "route":
      return { label: stages.route.label, detail: stages.route.detail };

    case "ranking":
      return { label: stages.ranking.label, detail: stages.ranking.detail };

    default:
      return { label: stage.label, detail: stage.detail };
  }
}
