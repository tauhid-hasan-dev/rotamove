import { serverSingleton } from "@/lib/server-singleton";

/**
 * Where an applicant's supporting documents actually live.
 *
 * Registration used to validate the registration extract, the insurance
 * certificate and the transport licence in the browser and then keep only
 * their names — which meant a reviewer deciding whether to let a carrier near
 * a customer's household goods was looking at the string
 * "insurance.pdf" and taking it on trust. Vetting that cannot open the
 * evidence is not vetting.
 *
 * So the bytes are uploaded, held here, and served back to the review queue.
 * The content never crosses into the applicant-facing API: a document is
 * addressed by an opaque id, and only `/api/admin/...` will resolve one.
 *
 * Same honest limit as every other store in this demo — a process-local Map,
 * no persistence, no survival across serverless instances. `serverSingleton`
 * is the seam; swapping this for S3 or a blob column changes this file and
 * nothing that imports it.
 */

export interface StoredDocument {
  id: string;
  /** The applicant's own filename, used for the download. */
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  uploadedAt: string;
}

export interface DocumentStore {
  put(input: Omit<StoredDocument, "id" | "uploadedAt">): StoredDocument;
  get(id: string): StoredDocument | null;
}

/**
 * An id that cannot be walked.
 *
 * Documents are addressed by this alone, so a sequential or guessable id
 * would make one applicant's insurance certificate reachable by anybody who
 * could count — the reason it is random rather than an index.
 */
function documentId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

class InMemoryDocumentStore implements DocumentStore {
  private readonly documents = new Map<string, StoredDocument>();
  private readonly order: string[] = [];
  /**
   * A ceiling, because this store is heap and an unbounded one is a leak with
   * a review queue attached. Oldest out first; the application record keeps
   * the metadata either way, so an evicted file degrades to the old
   * name-only behaviour rather than to a broken page.
   */
  private readonly capacity = 120;

  put(input: Omit<StoredDocument, "id" | "uploadedAt">): StoredDocument {
    const stored: StoredDocument = {
      ...input,
      id: documentId(),
      uploadedAt: new Date().toISOString(),
    };
    this.documents.set(stored.id, stored);
    this.order.unshift(stored.id);
    while (this.order.length > this.capacity) {
      const evicted = this.order.pop();
      if (evicted) this.documents.delete(evicted);
    }
    return stored;
  }

  get(id: string): StoredDocument | null {
    return this.documents.get(id) ?? null;
  }
}

export const documentStore: DocumentStore = serverSingleton(
  "__rotamoveDocuments",
  () => new InMemoryDocumentStore(),
);

/* ------------------------------------------------------------ demo files -- */

/**
 * A real, openable PDF for a seeded application.
 *
 * The three applications in the review queue are seeded rather than
 * submitted, so they have no uploaded bytes — and a queue whose only
 * walkable examples show "no copy held" would demonstrate the empty case of
 * the feature rather than the feature. This writes the smallest valid
 * single-page PDF that will render in a browser, with the document's own
 * title on it, so Open and Download both do what they say.
 *
 * Hand-assembled rather than taken from a PDF library: one page of text is
 * about forty lines of PDF, and it keeps the dependency list honest.
 */
export function placeholderPdf(title: string, lines: string[]): Uint8Array {
  /*
   * Down to WinAnsi, which is what the base-14 Helvetica below can draw.
   *
   * These lines carry real company names — "Anadolu Lojistik A.Ş.",
   * "Rheinfracht Spedition GmbH", a Tashkent address — so this is not a
   * theoretical case. Decomposing and dropping the combining marks turns ş
   * into s and ğ into g while leaving ö, ü and ß alone, because those have
   * WinAnsi code points of their own. Dotless ı decomposes to nothing, so it
   * is mapped by hand; anything still outside the byte range becomes a
   * question mark rather than a silently wrong glyph.
   */
  const winAnsi = (s: string) =>
    s
      .replace(/ı/g, "i")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\x00-\xff]/g, "?");

  const escape = (s: string) => winAnsi(s).replace(/([\\()])/g, "\\$1");
  const body = [
    "BT",
    "/F1 16 Tf",
    "56 742 Td",
    `(${escape(title)}) Tj`,
    "/F1 11 Tf",
    "0 -28 Td",
    ...lines.flatMap((line) => [`(${escape(line)}) Tj`, "0 -16 Td"]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];

  // The cross-reference table records a byte offset per object, so the file
  // has to be assembled before the table can be written.
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });

  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  // Latin-1, not UTF-8: the offsets above are string indices, and a
  // multi-byte encoding would shift every one of them past the first
  // non-ASCII character and corrupt the table.
  return Uint8Array.from(pdf, (c) => c.charCodeAt(0) & 0xff);
}
