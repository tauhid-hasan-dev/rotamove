import { cookies } from "next/headers";
import { accountForCookie, PARTNER_COOKIE, type DemoAccount } from "@/lib/partner-session";

/**
 * Server-side partner identity.
 *
 * Kept apart from `partner-session.ts` because that module is imported by the
 * dashboard, which is a client component — `next/headers` cannot be reached
 * from there. The split is what lets both sides share the account list
 * without dragging a server-only API into the browser bundle.
 *
 * The important property: the partner is resolved from the cookie and never
 * from the request body, so no handler can be talked into writing to someone
 * else's lane board — or into unlocking a lead against another account.
 */
export async function signedInAccount(): Promise<DemoAccount | null> {
  return accountForCookie((await cookies()).get(PARTNER_COOKIE)?.value);
}

/** The signed-in partner's mover id, or null. */
export async function signedInPartner(): Promise<string | null> {
  return (await signedInAccount())?.mover.id ?? null;
}

export const unauthorised = () =>
  Response.json({ error: "Sign in to manage your lanes" }, { status: 401 });
