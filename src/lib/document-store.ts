import { simplePdf } from "@/lib/pdf";
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
 * The writer moved to `@/lib/pdf` when the partner archive needed to produce
 * an invoice in the browser; this is the same document it always was.
 */
export const placeholderPdf = simplePdf;
