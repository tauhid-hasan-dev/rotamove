import { NextRequest } from "next/server";
import { contactMessageSchema } from "@/lib/contact-schema";
import { contactEnquiryMail, mailRepository } from "@/lib/mail";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact form intake.
 *
 * Order matters: shape first, then the challenge, then the write. Verifying
 * Turnstile before validating would spend a round trip to Cloudflare on
 * payloads that were never going to be accepted, and each token is
 * single-use — burning one on a request that then fails validation would
 * leave the visitor re-solving a challenge because of a typo in their email.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const verdict = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!verdict.ok) {
    /*
     * A token Cloudflare rejected and a Cloudflare we could not reach are
     * different problems and get different statuses: 403 is final and the
     * widget resets, 503 is worth retrying with the same answers. Lumping
     * them together would make an outage look like an accusation.
     */
    const unreachable = verdict.errors.some(
      (e) => e === "network-error" || e.startsWith("http-"),
    );
    return Response.json(
      { error: unreachable ? "Verification unavailable" : "Verification failed" },
      { status: unreachable ? 503 : 403 },
    );
  }

  const message = await mailRepository.send(
    contactEnquiryMail({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      topic: parsed.data.topic,
      message: parsed.data.message,
      locale: parsed.data.locale,
      country: request.headers.get("x-vercel-ip-country"),
    }),
  );

  // The id is the receipt. Shown to the sender so a follow-up can quote it.
  return Response.json({ id: message.id, receivedAt: message.sentAt }, { status: 201 });
}
