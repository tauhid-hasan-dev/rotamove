import { MOVERS } from "@/lib/movers";
import { cityCountry, getCity } from "@/lib/geo";
import { partnerIdFor } from "@/lib/partner-application";
import type { Mover, PlanId } from "@/lib/types";

/**
 * Partner sign-in, for the demo.
 *
 * A cookie and hardcoded credentials — there is no user table and no
 * password hashing, because there are no real partner accounts. The shape is
 * deliberately the one a real implementation would have (a session cookie
 * checked server-side before the dashboard renders), so swapping in an auth
 * provider touches this file and nothing else.
 *
 * There is one account per plan rather than one account. The three plans
 * differ in what the dashboard is allowed to show — only Pay Per Seen masks
 * anything — and a single login could only ever demonstrate one of them.
 * With three, the difference is something you can sign in and see.
 */

export interface DemoAccount {
  /** What the session cookie stores. Short, because it is user-visible. */
  key: string;
  email: string;
  password: string;
  mover: Mover;
  /** The plan this account starts on, before any queued change. */
  plan: PlanId;
  /** Account number shown in the dashboard. */
  partnerId: string;
}

/** First mover on a given plan — the accounts follow the catalogue. */
function moverOnPlan(plan: PlanId): Mover {
  const found = MOVERS.find((m) => m.plan === plan);
  if (!found) throw new Error(`No seeded mover on plan ${plan}`);
  return found;
}

/**
 * Derived from the internal mover id rather than stored, so it is identical
 * on every render and across restarts. A new partner gets this same format
 * assigned when their application is approved — see `applicationReference`.
 */
function accountNumber(mover: Mover): string {
  const hq = getCity(mover.hqCity);
  return partnerIdFor(mover.id, hq ? cityCountry(hq).iso : "TR");
}

function account(key: string, email: string, plan: PlanId): DemoAccount {
  const mover = moverOnPlan(plan);
  return { key, email, password: DEMO_PASSWORD, mover, plan, partnerId: accountNumber(mover) };
}

export const DEMO_PASSWORD = "rotamove";

/**
 * The three demo logins, in the order the pricing page lists the plans.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  account("pro", "pro@rotamove.com", "pro_unlimited"),
  account("lead", "lead@rotamove.com", "pay_per_lead"),
  account("seen", "seen@rotamove.com", "pay_per_seen"),
];

/**
 * The account the old single-login demo used.
 *
 * Kept as the default so a session cookie written before there were three
 * accounts still resolves, and so does the address printed in older
 * screenshots.
 */
export const DEFAULT_ACCOUNT = DEMO_ACCOUNTS[0];
export const DEMO_EMAIL = DEFAULT_ACCOUNT.email;

export const PARTNER_COOKIE = "rotamove.partner";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 8;

/** Resolve a cookie value to an account. `"1"` is the pre-split session. */
export function accountForCookie(value: string | undefined): DemoAccount | null {
  if (!value) return null;
  if (value === "1") return DEFAULT_ACCOUNT;
  return DEMO_ACCOUNTS.find((a) => a.key === value) ?? null;
}

/** The account these credentials sign you into, or null. */
export function accountForCredentials(email: string, password: string): DemoAccount | null {
  const wanted = email.trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find((a) => a.email === wanted && a.password === password) ?? null
  );
}
