import { MOVERS } from "@/lib/movers";
import { cityCountry, getCity } from "@/lib/geo";
import { partnerIdFor } from "@/lib/partner-application";

/**
 * Partner sign-in, for the demo.
 *
 * A cookie and a hardcoded credential pair — there is no user table and no
 * password hashing, because there are no real partner accounts. The shape is
 * deliberately the one a real implementation would have (a session cookie
 * checked server-side before the dashboard renders), so swapping in an auth
 * provider touches this file and nothing else.
 */

/** The partner account the demo signs you in as. */
export const DEMO_PARTNER = MOVERS[0];

export const DEMO_EMAIL = "demo@rotamove.com";
export const DEMO_PASSWORD = "rotamove";

/**
 * The account number shown in the dashboard.
 *
 * Derived from the internal mover id rather than stored, so it is identical
 * on every render and across restarts. A new partner gets this same format
 * assigned when their application is approved — see `applicationReference`.
 */
export const DEMO_PARTNER_ID = partnerIdFor(
  DEMO_PARTNER.id,
  (() => {
    const hq = getCity(DEMO_PARTNER.hqCity);
    return hq ? cityCountry(hq).iso : "TR";
  })(),
);

export const PARTNER_COOKIE = "rotamove.partner";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 8;

export const credentialsMatch = (email: string, password: string) =>
  email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
