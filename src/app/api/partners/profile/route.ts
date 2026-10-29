import { NextRequest } from "next/server";
import { contactChangedMail, mailRepository } from "@/lib/mail";
import { signedInAccount, unauthorised } from "@/lib/partner-auth";
import {
  partnerProfileRepository,
  partnerProfileSchema,
  seedProfile,
} from "@/lib/partner-profile";
import { DEFAULT_LOCALE } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The partner's own account details.
 *
 * `PUT` rather than `PATCH`: the settings panel sends the whole form, and a
 * partial update would need a merge policy for "field absent" versus "field
 * cleared" that no caller actually wants. The schema is the same one the
 * panel validates against, so a hand-rolled request cannot store a profile
 * the UI would have refused.
 *
 * Identity comes from the session cookie. Nothing in the payload names a
 * partner, which is what stops this being a route for editing other people's
 * contact details.
 */

/** Everything the seed needs that only the session knows. */
async function requireProfile() {
  const account = await signedInAccount();
  if (!account) return null;
  return {
    account,
    fallback: seedProfile({
      partnerId: account.mover.id,
      mover: account.mover,
      email: account.email,
      // Only a backstop, and only for `languages` — used when none of the
      // catalogue's language strings map onto an interface locale. The
      // partner's actual reading language is a UI concern and does not
      // belong in a stored profile.
      locale: DEFAULT_LOCALE,
    }),
  };
}

export async function GET() {
  const resolved = await requireProfile();
  if (!resolved) return unauthorised();

  return Response.json({
    profile: partnerProfileRepository.get(resolved.account.mover.id, resolved.fallback),
  });
}

export async function PUT(request: NextRequest) {
  const resolved = await requireProfile();
  if (!resolved) return unauthorised();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = partnerProfileSchema.safeParse(body);
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

  const { profile, changed, previousEmail } = partnerProfileRepository.save(
    resolved.account.mover.id,
    resolved.fallback,
    parsed.data,
  );

  /*
   * Notify only when a contact route actually moved.
   *
   * A "your details were changed" message on a save that only widened the
   * region list is noise, and noise is what teaches people to delete this
   * exact message without reading it — including the one time it is somebody
   * else changing their address.
   */
  const contactMoved = changed.filter((f) => f === "email" || f === "phone");
  if (contactMoved.length > 0) {
    const context = {
      name: profile.contactName,
      companyName: resolved.account.mover.name,
      ref: resolved.account.partnerId,
      changed: contactMoved,
      previousEmail,
    };

    await mailRepository.send(contactChangedMail({ ...context, to: profile.email }));

    // And to the address being replaced. A notice that only reaches the
    // mailbox the change just pointed at is a notice to whoever made the
    // change, which is no use at all if that was not the account holder.
    if (previousEmail && previousEmail !== profile.email) {
      await mailRepository.send(contactChangedMail({ ...context, to: previousEmail }));
    }
  }

  return Response.json({ profile, changed });
}
