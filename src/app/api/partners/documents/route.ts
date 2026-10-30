import { NextRequest } from "next/server";
import { documentStore } from "@/lib/document-store";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type DocumentMeta,
} from "@/lib/partner-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supporting-document upload.
 *
 * One file per request, posted as the applicant picks it rather than bundled
 * into the final submission. Three 8 MB attachments base64-ed into the
 * application JSON would be a ~32 MB body on the one request that must not
 * fail, and would hold the whole lot in memory twice to validate it. Uploading
 * each file on selection keeps that request small, surfaces a failed upload
 * next to the field that caused it, and means a browser refresh on step six
 * does not re-send the paperwork.
 *
 * The type and size limits are enforced here as well as in the browser. The
 * client check is for the applicant's benefit — instant, and in their
 * language; this one is the one that counts.
 *
 * The response is exactly the metadata the form stores, so the field has
 * nothing to assemble and no way to claim a size the server did not measure.
 */
export async function POST(request: NextRequest) {
  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    if (value instanceof File) file = value;
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  if (!file) {
    return Response.json({ error: "No file supplied" }, { status: 400 });
  }

  const mimeType = file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number];
  if (!ACCEPTED_DOCUMENT_TYPES.includes(mimeType)) {
    return Response.json({ error: "Unsupported file type" }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    return Response.json({ error: "File is too large" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Re-checked against what actually arrived, not against the declared size.
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) {
    return Response.json({ error: "File is too large" }, { status: 413 });
  }

  const stored = documentStore.put({
    // Basename only. A filename is attacker-controlled text that ends up in a
    // `Content-Disposition` header, and a path in it has no business there.
    name: (file.name.split(/[\\/]/).pop() || "document").slice(0, 200),
    mimeType,
    bytes,
  });

  const meta: DocumentMeta = {
    name: stored.name,
    sizeBytes: bytes.byteLength,
    mimeType,
    storageId: stored.id,
  };

  return Response.json({ document: meta }, { status: 201 });
}
