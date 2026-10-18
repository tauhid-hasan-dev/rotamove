import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/i18n/config";

/**
 * Persist an explicit language choice.
 *
 * The proxy treats this cookie as the strongest signal after `?lang=`, so
 * writing it is what stops geo detection from overriding the visitor on the
 * next request.
 *
 * It lives in its own module rather than inline in the switcher: writing to
 * `document.cookie` from a component body is indistinguishable, to the React
 * compiler's immutability rule, from mutating module state. Keeping the one
 * genuine DOM write behind a named function makes the intent explicit on both
 * sides of that line.
 */
export function rememberLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}
