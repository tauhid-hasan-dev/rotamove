import { COUNTRY_BY_ISO } from "@/lib/geo";
import { COUNTRY_LOCALE, type Locale } from "@/i18n/config";

/**
 * Dialling codes.
 *
 * Phone numbers are stored as one string — `+90 532 111 22 33` — not as a
 * `{ dial, national }` pair. The field in front of the user is two controls,
 * but the lead schema, the URL codec, the admin console, the invoice mailer
 * and the partner profile all already agree on a single string, and splitting
 * the model to suit one input would mean a migration in six places to gain
 * nothing a prefix match cannot give back.
 *
 * So: `composePhone` writes the string, `parsePhone` reads it, and everything
 * downstream carries on seeing what it has always seen.
 */

export interface DialCountry {
  iso: string;
  /** Without the plus. `"90"`, not `"+90"`. */
  dial: string;
}

/**
 * The network's own countries first, then the places visitors actually
 * arrive from.
 *
 * Order is load-bearing in one specific way — see `parsePhone`. Where two
 * countries share a code, the one listed first wins the guess: `+7` resolves
 * to Russia rather than Kazakhstan, `+1` to the United States rather than
 * Canada, `+39` to Italy rather than the Vatican. There is no way to do
 * better from the digits alone, and the picker is one click.
 */
const RAW: ReadonlyArray<readonly [string, string]> = [
  // Türkiye
  ["TR", "90"],

  // Western Europe
  ["DE", "49"], ["NL", "31"], ["BE", "32"], ["FR", "33"], ["AT", "43"],
  ["CH", "41"], ["GB", "44"], ["IE", "353"], ["LU", "352"],

  // Southern Europe
  ["IT", "39"], ["ES", "34"], ["PT", "351"], ["GR", "30"], ["MT", "356"],
  ["CY", "357"],

  // Balkans
  ["RS", "381"], ["BG", "359"], ["RO", "40"], ["HR", "385"], ["SI", "386"],
  ["BA", "387"], ["MK", "389"], ["AL", "355"], ["ME", "382"], ["XK", "383"],
  ["HU", "36"], ["SK", "421"],

  // Nordics
  ["SE", "46"], ["NO", "47"], ["DK", "45"], ["FI", "358"], ["IS", "354"],

  // CIS & Caucasus
  ["RU", "7"], ["BY", "375"], ["UA", "380"], ["AZ", "994"], ["GE", "995"],
  ["AM", "374"],

  // Central Asia
  ["UZ", "998"], ["KZ", "7"], ["KG", "996"], ["TJ", "992"], ["TM", "993"],

  // Middle East
  ["AE", "971"], ["SA", "966"], ["QA", "974"], ["KW", "965"], ["BH", "973"],
  ["OM", "968"], ["JO", "962"], ["LB", "961"], ["IL", "972"], ["EG", "20"],
  ["IQ", "964"],

  /*
   * Off-network, but people browse from here and a phone field that cannot
   * express their own number is a dead end. These are dialling entries only —
   * they are deliberately absent from `COUNTRIES` in `geo.ts`, which is the
   * list of places we actually haul to and feeds pricing and matching.
   */
  ["US", "1"], ["CA", "1"], ["PL", "48"], ["CZ", "420"], ["LT", "370"],
  ["LV", "371"], ["EE", "372"], ["MD", "373"], ["SY", "963"], ["YE", "967"],
  ["LY", "218"], ["TN", "216"], ["DZ", "213"], ["MA", "212"], ["SD", "249"],
  ["PS", "970"], ["MR", "222"], ["LI", "423"], ["MC", "377"], ["SM", "378"],
  ["AD", "376"], ["AU", "61"], ["NZ", "64"], ["IN", "91"], ["PK", "92"],
  ["BD", "880"], ["CN", "86"], ["JP", "81"], ["KR", "82"], ["SG", "65"],
  ["HK", "852"], ["MY", "60"], ["TH", "66"], ["ID", "62"], ["PH", "63"],
  ["VN", "84"], ["BR", "55"], ["MX", "52"], ["AR", "54"], ["ZA", "27"],
  ["NG", "234"], ["KE", "254"], ["ET", "251"],
];

export const DIAL_COUNTRIES: DialCountry[] = RAW.map(([iso, dial]) => ({ iso, dial }));

const BY_ISO = new Map(DIAL_COUNTRIES.map((c) => [c.iso, c]));

/** Longest dial code first, so `+998` is never read as `+9`. */
const BY_LENGTH = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

export const DEFAULT_DIAL_ISO = "TR";

/**
 * The flag, derived rather than stored.
 *
 * Two ASCII letters map onto the two regional-indicator code points that
 * every platform renders as a flag, so ninety countries need ninety entries
 * of data and none of emoji. `geo.ts` keeps its literal flags because that
 * list is hand-curated prose; this one is generated.
 */
export function flagFor(iso: string): string {
  const upper = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    ...[...upper].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

export function dialFor(iso: string): string {
  return BY_ISO.get(iso.toUpperCase())?.dial ?? BY_ISO.get(DEFAULT_DIAL_ISO)!.dial;
}

export function isDialIso(value: unknown): value is string {
  return typeof value === "string" && BY_ISO.has(value.toUpperCase());
}

/** True when we also haul there — used to group the picker. */
export function isNetworkCountry(iso: string): boolean {
  return COUNTRY_BY_ISO.has(iso.toUpperCase());
}

export interface ParsedPhone {
  iso: string;
  /** Everything after the dialling code, spacing preserved as typed. */
  national: string;
}

/**
 * Split a stored number back into the two controls.
 *
 * `preferred` is the country the picker is already showing — usually where
 * the visitor is browsing from. It wins when it matches, which is what stops
 * a German visitor's `+49` number being re-labelled as something else on the
 * way back out of storage, and what resolves `+7` and `+1` in their favour
 * when they happen to live there.
 */
export function parsePhone(value: string, preferred = DEFAULT_DIAL_ISO): ParsedPhone {
  const trimmed = (value ?? "").trim();
  if (!trimmed.startsWith("+")) {
    return { iso: isDialIso(preferred) ? preferred.toUpperCase() : DEFAULT_DIAL_ISO, national: trimmed };
  }

  const digits = trimmed.slice(1);
  const preferredDial = isDialIso(preferred) ? dialFor(preferred) : null;
  if (preferredDial && digits.startsWith(preferredDial)) {
    return { iso: preferred.toUpperCase(), national: digits.slice(preferredDial.length).trim() };
  }

  for (const country of BY_LENGTH) {
    if (digits.startsWith(country.dial)) {
      return { iso: country.iso, national: digits.slice(country.dial.length).trim() };
    }
  }
  return { iso: DEFAULT_DIAL_ISO, national: digits };
}

/**
 * Join the two controls into the one string everything else reads.
 *
 * An empty national part yields an empty string rather than a bare `+90`:
 * a dialling code on its own is not a phone number, and treating it as one
 * would make every untouched field look filled in to the validators.
 */
export function composePhone(iso: string, national: string): string {
  const cleaned = (national ?? "").replace(/[^\d\s().-]/g, "").trim();
  if (!cleaned) return "";
  return `+${dialFor(iso)} ${cleaned}`;
}

/** Digits in the national part only. The dialling code is never in doubt. */
export function nationalDigits(national: string): number {
  return (national ?? "").replace(/\D/g, "").length;
}

/**
 * Loose on purpose.
 *
 * Seven digits clears every national numbering plan we touch and rejects a
 * half-typed number; anything stricter means per-country length tables that
 * go stale and reject real numbers, which is the worse failure for a form
 * whose whole job is letting a carrier call you back.
 */
export function isPlausibleNational(national: string): boolean {
  const n = nationalDigits(national);
  return n >= 7 && n <= 15;
}

/**
 * Where to point the picker before the visitor touches it.
 *
 * The geo header is the real answer and arrives via the country cookie; this
 * is the fallback for when there is none — local development, a crawler, a
 * privacy proxy. The active locale is the next best evidence, and
 * `COUNTRY_LOCALE` already encodes that relationship in one direction, so
 * this reads it back out rather than restating it.
 */
export function countryForLocale(locale: Locale): string {
  const PRIMARY: Partial<Record<Locale, string>> = {
    en: "GB",
    tr: "TR",
    de: "DE",
    fr: "FR",
    it: "IT",
    nl: "NL",
    ru: "RU",
    ar: "AE",
  };
  const primary = PRIMARY[locale];
  if (primary && BY_ISO.has(primary)) return primary;

  const first = Object.keys(COUNTRY_LOCALE).find((iso) => COUNTRY_LOCALE[iso] === locale);
  return first && BY_ISO.has(first) ? first : DEFAULT_DIAL_ISO;
}

/** Cookie the proxy writes from the edge geo header. */
export const COUNTRY_COOKIE = "rotamove.country";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
