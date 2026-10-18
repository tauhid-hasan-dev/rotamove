import { MOVERS } from "@/lib/movers";

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

export const PARTNER_COOKIE = "rotamove.partner";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 8;

export const credentialsMatch = (email: string, password: string) =>
  email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
