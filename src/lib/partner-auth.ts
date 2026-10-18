import { cookies } from "next/headers";
import { DEMO_PARTNER, PARTNER_COOKIE } from "@/lib/partner-session";

/**
 * Server-side partner identity.
 *
 * Kept apart from `partner-session.ts` because that module is imported by the
 * dashboard, which is a client component — `next/headers` cannot be reached
 * from there. The split is what lets both sides share `DEMO_PARTNER` without
 * dragging a server-only API into the browser bundle.
 *
 * The important property: the partner is resolved from the cookie and never
 * from the request body, so no handler can be talked into writing to someone
 * else's lane board.
 */
export async function signedInPartner(): Promise<string | null> {
  const signedIn = (await cookies()).get(PARTNER_COOKIE)?.value === "1";
  return signedIn ? DEMO_PARTNER.id : null;
}

export const unauthorised = () =>
  Response.json({ error: "Sign in to manage your lanes" }, { status: 401 });
