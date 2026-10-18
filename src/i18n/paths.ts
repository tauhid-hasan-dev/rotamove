import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/i18n/config";

/**
 * Every internal link carries its locale.
 *
 * Components keep writing locale-free paths ("/quote", "/partners#plans") and
 * pass them through here, so there is exactly one place that knows the URL
 * shape. Hashes and query strings survive.
 */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith("/")) return path;
  const stripped = stripLocale(path);
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

/** "/tr/quote?from=IST" → "/quote?from=IST" */
export function stripLocale(path: string): string {
  const match = /^\/([^/?#]+)(.*)$/.exec(path);
  if (!match || !isLocale(match[1])) return path;
  return match[2] || "/";
}

/** The locale a pathname is already in, if any. */
export function localeFromPath(path: string): Locale | null {
  const match = /^\/([^/?#]+)/.exec(path);
  return match && isLocale(match[1]) ? match[1] : null;
}

/**
 * Same page, different language — what the switcher navigates to.
 * Keeps the query string and hash so switching mid-search loses nothing.
 */
export function swapLocaleInPath(path: string, next: Locale): string {
  return localePath(next, stripLocale(path));
}

/**
 * `alternates.languages` for `generateMetadata`.
 *
 * `x-default` points at English: it tells Google which version to serve when
 * no declared language matches the user, rather than letting it guess.
 */
export function alternateLanguages(path: string): Record<string, string> {
  const stripped = stripLocale(path);
  const map: Record<string, string> = {};
  for (const locale of LOCALES) map[locale] = localePath(locale, stripped);
  map["x-default"] = localePath(DEFAULT_LOCALE, stripped);
  return map;
}
