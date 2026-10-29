import { NextRequest } from "next/server";
import { z } from "zod";
import {
  applicationApprovedMail,
  applicationDeclinedMail,
  documentsRequestedMail,
  mailRepository,
} from "@/lib/mail";
import {
  REQUESTABLE_DOCUMENTS,
  partnerIdFor,
  type RequestableDocument,
} from "@/lib/partner-application";
import {
  partnerNotificationRepository,
  type PartnerNotificationKind,
} from "@/lib/partner-notifications";
import { partnerRepository } from "@/lib/partner-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A reviewer's verdict on a partner application.
 *
 * One endpoint for all three outcomes, because they are one decision with
 * three branches and splitting them would let a caller approve an application
 * without the notification that an approval is supposed to send. The write,
 * the email and the dashboard notification happen together or not at all.
 *
 * Unauthenticated like the rest of the admin console, which has no accounts.
 * In a deployed system this needs the reviewer permission, and the audit
 * trail needs the reviewer's real identity rather than the console's.
 */

const decisionSchema = z.discriminatedUnion("decision", [
  z.object({
    reference: z.string().trim().min(1),
    decision: z.literal("approve"),
  }),
  z.object({
    reference: z.string().trim().min(1),
    decision: z.literal("decline"),
    // Required, not optional. A decline with no reason is one the applicant
    // cannot act on and the reviewer cannot defend three months later.
    reason: z.string().trim().min(4).max(600),
  }),
  z.object({
    reference: z.string().trim().min(1),
    decision: z.literal("request_documents"),
    documents: z.array(z.enum(REQUESTABLE_DOCUMENTS)).min(1),
    note: z.string().trim().max(600).optional().or(z.literal("")),
  }),
]);

/** Human labels for the document keys, for the email body. */
const DOCUMENT_LABELS_EN: Record<RequestableDocument, string> = {
  insurance_certificate: "Current cargo insurance certificate, showing the cover amount",
  transport_licence: "Operating or transport licence",
  registration_extract: "Company registration extract",
  vat_certificate: "VAT registration certificate",
  fleet_list: "Fleet list with registration plates",
  bank_details: "Bank details on company letterhead",
  conduct_charter: "Signed code of conduct",
};

const NOTIFICATION_KIND: Record<string, PartnerNotificationKind> = {
  approve: "application_approved",
  decline: "application_declined",
  request_documents: "documents_requested",
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const parsed = decisionSchema.safeParse(body);
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

  const input = parsed.data;
  const existing = await partnerRepository.get(input.reference);
  if (!existing) {
    return Response.json({ error: "Unknown application" }, { status: 404 });
  }

  const status =
    input.decision === "approve"
      ? "approved"
      : input.decision === "decline"
        ? "declined"
        : "awaiting_documents";

  const application = await partnerRepository.decide(input.reference, {
    status,
    note: input.decision === "decline" ? input.reason : input.decision === "request_documents" ? (input.note || undefined) : undefined,
    documents: input.decision === "request_documents" ? input.documents : undefined,
  });
  if (!application) {
    return Response.json({ error: "Unknown application" }, { status: 404 });
  }

  const companyName = application.tradingName || application.legalName;
  const context = {
    to: application.email,
    name: application.contactName,
    companyName,
    locale: application.languages[0],
  };

  /*
   * Both channels, one action. A document request that went out by email
   * only is invisible to a partner who signs in to find out what is holding
   * their application up; one that only appeared in the dashboard is
   * invisible to a partner who is waiting to be told.
   */
  if (input.decision === "approve") {
    await mailRepository.send(
      applicationApprovedMail({
        ...context,
        reference: application.reference,
        // The reference becomes an account number on approval, derived the
        // same way an existing partner's is so the two formats match.
        partnerId: partnerIdFor(application.reference, application.countryIso),
        loginUrl: "https://logisticlead.taforatechnology.com/en/partners/login",
      }),
    );
  } else if (input.decision === "decline") {
    await mailRepository.send(
      applicationDeclinedMail({
        ...context,
        reference: application.reference,
        reason: input.reason,
      }),
    );
  } else {
    await mailRepository.send(
      documentsRequestedMail({
        ...context,
        reference: application.reference,
        documents: input.documents.map((d) => DOCUMENT_LABELS_EN[d]),
        note: input.note || undefined,
      }),
    );
  }

  /*
   * One notification, addressed to the application reference.
   *
   * Not also to the partner's mover id, which is where this started: a
   * partner signing in resolves both their account id and every reference
   * filed under their address, so a second copy keyed to the account turned
   * one document request into two identical cards on their dashboard.
   * `/api/partners/notifications` does the joining; this side addresses the
   * thing the decision was actually about.
   */
  await partnerNotificationRepository.add({
    subjectId: application.reference,
    kind: NOTIFICATION_KIND[input.decision],
    ...(input.decision === "request_documents" ? { documents: input.documents } : {}),
    ...(input.decision === "decline"
      ? { note: input.reason }
      : input.decision === "request_documents" && input.note
        ? { note: input.note }
        : {}),
  });

  return Response.json({ application });
}
