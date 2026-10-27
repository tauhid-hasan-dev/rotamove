import { NextResponse, type NextRequest } from "next/server";
import {
  COUNTRY_LOCALE,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  type Locale,
} from "@/i18n/config";

/**
 * Locale routing.
 *
 * `middleware` is deprecated in Next 16 — this is the `proxy` convention that
 * replaced it. Runs before any route renders, so a visitor from Istanbul lands
 * on Turkish content rather than flashing English first.
 *
 * Resolution order, strongest signal first:
 *
 *   1. `?lang=` — explicit, shareable, and the only way to exercise geo
 *      detection locally where no geo header exists.
 *   2. Cookie — a choice the visitor made themselves. Always beats inference.
 *   3. Geo header — country from the edge.
 *   4. `Accept-Language` — the browser's stated preference, q-weighted.
 *   5. English.
 *
 * Note that 3 sits above 4 deliberately: the brief asks for country-based
 * defaulting ("browsing from Turkey → Turkish"), which means a German-browser
 * visitor in Istanbul gets Turkish first. The switcher writes the cookie, so
 * correcting it is one click and it then sticks. Swapping the two lines below
 * reverses the policy if that trade stops being the one you want.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const requested = searchParams.get("lang");
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const current = localeInPath(pathname);

  // An explicit ?lang= always redirects, even on an already-prefixed path, so
  // a pasted link can override a stale cookie.
  if (isLocale(requested)) {
    if (requested === current) return persist(NextResponse.next(), requested, cookie);
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pathname, requested);
    url.searchParams.delete("lang");
    return persist(NextResponse.redirect(url), requested, cookie);
  }

  // Already prefixed: let it through, but remember it. Someone who navigates
  // straight to /de has chosen German just as deliberately as using the menu.
  if (current) return persist(NextResponse.next(), current, cookie);

  const locale = isLocale(cookie)
    ? cookie
    : (countryLocale(request) ?? acceptLanguageLocale(request) ?? DEFAULT_LOCALE);

  const url = request.nextUrl.clone();
  url.pathname = withLocale(pathname, locale);
  return persist(NextResponse.redirect(url), locale, cookie);
}

function localeInPath(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : null;
}

/**
 * Prefix a path with a locale, replacing any locale already on it.
 *
 * Without the strip, `?lang=it` on `/de` produced `/it/de` — the old locale
 * became a path segment and the page 404-ed.
 */
function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  // segments[0] is always "" for an absolute path.
  if (isLocale(segments[1])) segments.splice(1, 1);
  const rest = segments.join("/");
  return `/${locale}${rest === "/" ? "" : rest}`;
}

/** Only writes the cookie when it would actually change. */
function persist(response: NextResponse, locale: Locale, existing: string | undefined) {
  if (existing === locale) return response;
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}

/**
 * `request.geo` was removed in Next 15; country now arrives as a header.
 * Cloudflare and Netlify set their own equivalents, so all three are read.
 */
function countryLocale(request: NextRequest): Locale | null {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-nf-client-connection-country");
  if (!country) return null;
  return COUNTRY_LOCALE[country.toUpperCase()] ?? null;
}

/**
 * q-weighted `Accept-Language` negotiation.
 *
 * Hand-rolled rather than pulling in `negotiator` + `intl-localematcher`: the
 * whole job is "sort by q, match on the base subtag", and two dependencies in
 * the edge bundle to do that is a poor trade.
 */
function acceptLanguageLocale(request: NextRequest): Locale | null {
  const header = request.headers.get("accept-language");
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => /^q=([\d.]+)$/.exec(p.trim())?.[1])
        .find(Boolean);
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === "*") break;
    const base = tag.split("-")[0];
    const hit = LOCALES.find((locale) => locale === base);
    if (hit) return hit;
  }
  return null;
}

export const config = {
  /**
   * Everything except API routes, the admin console, Next internals and
   * static assets. Without the negative match this would redirect
   * stylesheets and the favicon too. `/admin` is excluded because the admin
   * is an internal English-only tool with its own root layout — prefixing it
   * with a locale would 404 it.
   */
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
