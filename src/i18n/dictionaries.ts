import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { tr } from "@/i18n/dictionaries/tr";
import { de } from "@/i18n/dictionaries/de";
import { fr } from "@/i18n/dictionaries/fr";
import { it } from "@/i18n/dictionaries/it";
import { nl } from "@/i18n/dictionaries/nl";
import { ru } from "@/i18n/dictionaries/ru";
import { ar } from "@/i18n/dictionaries/ar";

/**
 * Widen literal types without losing structure.
 *
 * `en` is declared `as const`, so every value is a string *literal*. Used
 * directly as the contract, `tr` would fail because "Ara" is not assignable to
 * "Search". Widening leaves the shape — every key, nested object and tuple —
 * enforced while letting the text be any string. A translation that drops or
 * misspells a key is a compile error, not a blank space in production.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { -readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type Dictionary = Widen<typeof en>;

/**
 * Dictionaries are imported statically rather than `import()`-ed.
 *
 * All eight locales are prerendered at build time, so dynamic import buys no
 * laziness on the server and only costs a chunk boundary. The client receives
 * exactly one dictionary — whichever the provider was handed.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { en, tr, de, fr, it, nl, ru, ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Narrows a raw route param, falling back rather than 404-ing on a typo. */
export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
