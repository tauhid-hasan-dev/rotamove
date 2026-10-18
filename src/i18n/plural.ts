import { intlLocale, type Locale } from "@/i18n/config";

/**
 * CLDR plural categories.
 *
 * English needs two forms, Russian needs four, Arabic needs six. Hardcoding
 * `${n} days` and bolting an "s" on works in exactly one of our eight
 * languages, so every counted noun is stored as a form set and resolved
 * through `Intl.PluralRules`.
 */
export interface Plural {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

const rules = new Map<Locale, Intl.PluralRules>();

function rulesFor(locale: Locale): Intl.PluralRules {
  let cached = rules.get(locale);
  if (!cached) {
    cached = new Intl.PluralRules(intlLocale(locale));
    rules.set(locale, cached);
  }
  return cached;
}

/**
 * Pick the right form and substitute `{n}`.
 *
 * `display` lets a range read naturally: the plural category comes from the
 * governing number (11 in "6–11 days") while the text shows the whole range.
 */
export function plural(
  locale: Locale,
  forms: Plural,
  count: number,
  display?: string,
): string {
  const category = rulesFor(locale).select(count);
  const form =
    (category === "zero" && forms.zero) ||
    (category === "one" && forms.one) ||
    (category === "two" && forms.two) ||
    (category === "few" && forms.few) ||
    (category === "many" && forms.many) ||
    forms.other;
  return form.replace("{n}", display ?? String(count));
}
