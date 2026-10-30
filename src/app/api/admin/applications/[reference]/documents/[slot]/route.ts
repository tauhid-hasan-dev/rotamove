import { NextRequest } from "next/server";
import { documentStore } from "@/lib/document-store";
import { partnerRepository } from "@/lib/partner-store";
import type { DocumentMeta } from "@/lib/partner-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One of an application's supporting documents, as bytes.
 *
 * Addressed by application reference and slot rather than by the storage id
 * directly, so the only documents this route will serve are the three
 * attached to an application that exists. A reviewer cannot be handed a link
 * to an arbitrary upload, and the id never has to appear in a URL the browser
 * keeps in its history.
 *
 * `?download=1` sets a filename and `attachment`; without it the browser
 * renders the file inline, which is what a reviewer wants for a one-page
 * insurance certificate they are about to make a decision on.
 *
 * Unauthenticated like the rest of the admin console, and the most sensitive
 * route in it: these are an applicant's licence and insurance scans. In a
 * deployed system it sits behind the reviewer role.
 */

const SLOTS = {
  registration: "registrationDoc",
  insurance: "insuranceDoc",
  licence: "licenceDoc",
} as const;

export type DocumentSlot = keyof typeof SLOTS;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string; slot: string }> },
) {
  const { reference, slot } = await params;

  const field = SLOTS[slot as DocumentSlot];
  if (!field) {
    return Response.json({ error: "Unknown document slot" }, { status: 404 });
  }

  const application = await partnerRepository.get(decodeURIComponent(reference));
  if (!application) {
    return Response.json({ error: "Unknown application" }, { status: 404 });
  }

  const meta = application[field] as DocumentMeta | null | undefined;
  if (!meta?.storageId) {
    // Attached before file storage existed, or evicted since. Distinguished
    // from "no such application" because the reviewer's next move differs:
    // one is a bad link, the other is a document to ask the carrier for.
    return Response.json({ error: "No stored copy of that document" }, { status: 410 });
  }

  const stored = documentStore.get(meta.storageId);
  if (!stored) {
    return Response.json({ error: "No stored copy of that document" }, { status: 410 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";

  /*
   * The filename is quoted ASCII plus RFC 5987 `filename*`.
   *
   * Applicants upload "sigorta poliçesi.pdf" and "Фрахт.pdf". A raw non-ASCII
   * byte in a header value is invalid and gets the whole response rejected,
   * so the ASCII form is stripped for the old parsers and the UTF-8 form is
   * offered for everything since.
   */
  const asciiName = stored.name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const disposition = download
    ? `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(stored.name)}`
    : `inline; filename="${asciiName}"`;

  return new Response(stored.bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": stored.mimeType,
      "Content-Length": String(stored.bytes.byteLength),
      "Content-Disposition": disposition,
      // Vetting documents are not for a shared cache, and a reviewer who
      // reloads after a replacement should see the replacement.
      "Cache-Control": "private, no-store",
      // The bytes are applicant-supplied. An SVG or HTML file sniffed as
      // markup and rendered inline on this origin would be a stored XSS in
      // the admin console; the type list excludes those, and this makes the
      // browser honour the list rather than guess past it.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
