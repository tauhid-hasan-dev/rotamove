import { NextRequest } from "next/server";
import { applicationReceivedMail, mailRepository } from "@/lib/mail";
import { partnerApplicationSchema } from "@/lib/partner-application";
import { partnerRepository } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Carrier application intake.
 *
 * Validated with the same schema the form uses, so a hand-rolled POST cannot
 * put a partner into the review queue that the UI would have rejected.
 *
 * The response carries the reference and nothing else. The internal readiness
 * score is computed and stored on write, but returning it would turn vetting
 * into a game — an applicant who can see the number will tune the form until
 * it goes up.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = partnerApplicationSchema.safeParse(payload);
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

  const application = await partnerRepository.create(parsed.data);

  /*
   * The acknowledgement, carrying the reference.
   *
   * Sent from the server on the write rather than from the browser after it,
   * so an applicant who closes the tab the instant the spinner stops still
   * gets the code they will need to chase their application. The address is
   * the one that came back a one-time code two steps ago, which is what makes
   * sending to it worth doing at all.
   */
  await mailRepository.send(
    applicationReceivedMail({
      to: application.email,
      name: application.contactName,
      companyName: application.tradingName || application.legalName,
      reference: application.reference,
      locale: application.languages[0],
    }),
  );

  return Response.json(
    {
      reference: application.reference,
      submittedAt: application.submittedAt,
    },
    { status: 201 },
  );
}

export async function GET() {
  const count = await partnerRepository.count();
  return Response.json({ count });
}
