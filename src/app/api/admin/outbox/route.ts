import { mailRepository } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Everything the product has sent, newest first.
 *
 * This exists because the demo has no mail provider. Rather than have the
 * approve button claim to have emailed somebody and leave no way to check,
 * every message is composed for real and recorded, and this is where you read
 * it. In a deployed system the equivalent is the provider's own log, and this
 * route is what you point at it.
 *
 * Unauthenticated like the rest of the admin console. In a deployed system it
 * is not: these bodies carry partner contact details and account numbers.
 */
export async function GET() {
  return Response.json({ messages: await mailRepository.listAll(100) });
}
