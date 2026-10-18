/**
 * Locale configuration.
 *
 * Eight locales, each a full first-class version of the site: URL-prefixed,
 * separately indexable, with its own metadata. `en` is the fallback and the
 * source of truth for the dictionary shape.
 */

export const LOCALES = ["en", "tr", "de", "fr", "it", "nl", "ru", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Right-to-left scripts. Drives `dir` on <html> and the mirrored layout. */
export const RTL_LOCALES = new Set<Locale>(["ar"]);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

export const dirFor = (locale: Locale): "ltr" | "rtl" =>
  RTL_LOCALES.has(locale) ? "rtl" : "ltr";

/**
 * Instrument Sans covers latin and latin-ext only — no Cyrillic, no Arabic.
 * Russian and Arabic therefore get their own family rather than silently
 * falling back to whatever the OS happens to have.
 */
export const SCRIPT_FOR_LOCALE: Record<Locale, "latin" | "cyrillic" | "arabic"> = {
  en: "latin",
  tr: "latin",
  de: "latin",
  fr: "latin",
  it: "latin",
  nl: "latin",
  ru: "cyrillic",
  ar: "arabic",
};

export interface LocaleMeta {
  /** Endonym — what speakers call their own language. Never translated. */
  readonly native: string;
  /** English name, for aria-labels and the `hreflang` table. */
  readonly english: string;
  /** BCP 47 tag used for Intl formatting. */
  readonly bcp47: string;
  /**
   * Opening and closing quotation marks.
   *
   * There is no Intl API for these, and they are genuinely different per
   * language: German opens low („), French and Russian use guillemets (« »).
   * Hardcoding “ ” would make five of the eight locales look foreign.
   */
  readonly quotes: readonly [string, string];
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { native: "English", english: "English", bcp47: "en-GB", quotes: ["“", "”"] },
  tr: { native: "Türkçe", english: "Turkish", bcp47: "tr-TR", quotes: ["“", "”"] },
  de: { native: "Deutsch", english: "German", bcp47: "de-DE", quotes: ["„", "“"] },
  // French guillemets take a narrow no-break space on the inside.
  fr: { native: "Français", english: "French", bcp47: "fr-FR", quotes: ["« ", " »"] },
  it: { native: "Italiano", english: "Italian", bcp47: "it-IT", quotes: ["«", "»"] },
  nl: { native: "Nederlands", english: "Dutch", bcp47: "nl-NL", quotes: ["„", "”"] },
  ru: { native: "Русский", english: "Russian", bcp47: "ru-RU", quotes: ["«", "»"] },
  ar: { native: "العربية", english: "Arabic", bcp47: "ar", quotes: ["«", "»"] },
};

/** Wraps text in the locale's own quotation marks. */
export const quote = (locale: Locale, text: string) => {
  const [open, close] = LOCALE_META[locale].quotes;
  return `${open}${text}${close}`;
};

/**
 * Western digits everywhere, including Arabic.
 *
 * `ar` would otherwise render Eastern Arabic-Indic numerals (٤٨), which breaks
 * tabular alignment and is not what Gulf and Levant business users expect for
 * phone numbers, volumes or dates.
 */
export const numberingSuffix = "-u-nu-latn";

export const intlLocale = (locale: Locale) => `${LOCALE_META[locale].bcp47}${numberingSuffix}`;

/**
 * Country → locale, used when the request carries a geo header.
 *
 * Only the countries our corridors actually touch are mapped; everything else
 * falls through to `Accept-Language` and then English. Deliberate omissions:
 * Ukraine, Georgia and Moldova are not mapped to Russian.
 */
export const COUNTRY_LOCALE: Record<string, Locale> = {
  // Turkish
  TR: "tr",
  AZ: "tr",

  // German
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",

  // French
  FR: "fr",
  LU: "fr",
  MC: "fr",

  // Italian
  IT: "it",
  SM: "it",
  VA: "it",

  // Dutch
  NL: "nl",
  BE: "nl",
  SR: "nl",
  AW: "nl",
  CW: "nl",

  // Russian
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  UZ: "ru",
  TJ: "ru",
  TM: "ru",
  AM: "ru",

  // Arabic
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  EG: "ar",
  IQ: "ar",
  SY: "ar",
  YE: "ar",
  LY: "ar",
  TN: "ar",
  DZ: "ar",
  MA: "ar",
  SD: "ar",
  PS: "ar",
  MR: "ar",
};

/** Cookie holding an explicit choice. An explicit choice always wins over geo. */
export const LOCALE_COOKIE = "rotamove.locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
