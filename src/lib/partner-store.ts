import { documentStore, placeholderPdf } from "@/lib/document-store";
import {
  applicationReference,
  scoreApplication,
  normaliseWebsite,
  type ApplicationStatus,
  type DocumentMeta,
  type PartnerApplication,
  type PartnerApplicationInput,
  type ReviewEvent,
} from "@/lib/partner-application";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * Partner application repository.
 *
 * Same shape as `leadRepository`: the demo keeps applications in a
 * process-local Map, but every caller goes through this interface, so the
 * swap to a real table is one file. Applications are the input to partner
 * vetting, so in production this is the write that triggers a review queue —
 * and here it *is* the review queue, which the admin console reads and writes
 * through `/api/admin/applications`.
 */

export const REVIEWER = "Demo Admin";

export interface DecisionInput {
  status: ApplicationStatus;
  by?: string;
  /** Decline reason, or a note alongside a document request. */
  note?: string;
  /** Required when `status` is `awaiting_documents`. */
  documents?: string[];
}

export interface PartnerRepository {
  create(input: PartnerApplicationInput): Promise<PartnerApplication>;
  get(reference: string): Promise<PartnerApplication | null>;
  recent(limit?: number): Promise<PartnerApplication[]>;
  /** Everything, newest first. The admin review queue. */
  list(): Promise<PartnerApplication[]>;
  /** Record a reviewer's decision. Returns null if the reference is unknown. */
  decide(reference: string, input: DecisionInput): Promise<PartnerApplication | null>;
  count(): Promise<number>;
}

class InMemoryPartnerRepository implements PartnerRepository {
  private readonly applications = new Map<string, PartnerApplication>();
  private readonly order: string[] = [];
  private readonly capacity = 200;

  private insert(application: PartnerApplication) {
    this.applications.set(application.reference, application);
    this.order.unshift(application.reference);
    while (this.order.length > this.capacity) {
      const evicted = this.order.pop();
      if (evicted) this.applications.delete(evicted);
    }
  }

  async create(input: PartnerApplicationInput): Promise<PartnerApplication> {
    const application: PartnerApplication = {
      ...input,
      website: normaliseWebsite(input.website ?? ""),
      reference: applicationReference(input.countryIso),
      submittedAt: new Date().toISOString(),
      // Scored at write time so the review queue is sortable without
      // recomputing, and so the scoring rules that applied are the ones in
      // force when it was submitted.
      score: scoreApplication(input),
      status: "pending",
      review: [],
    };

    this.insert(application);
    return application;
  }

  async get(reference: string): Promise<PartnerApplication | null> {
    return this.applications.get(reference) ?? null;
  }

  async recent(limit = 25): Promise<PartnerApplication[]> {
    return this.list().then((all) => all.slice(0, limit));
  }

  async list(): Promise<PartnerApplication[]> {
    return this.order.flatMap((ref) => {
      const found = this.applications.get(ref);
      return found ? [found] : [];
    });
  }

  async decide(reference: string, input: DecisionInput): Promise<PartnerApplication | null> {
    const current = this.applications.get(reference);
    if (!current) return null;

    const event: ReviewEvent = {
      status: input.status,
      at: new Date().toISOString(),
      by: input.by ?? REVIEWER,
      ...(input.note ? { note: input.note } : {}),
      ...(input.documents?.length ? { documents: input.documents } : {}),
    };

    const next: PartnerApplication = {
      ...current,
      status: input.status,
      review: [...current.review, event],
      // Cleared by anything that is not another document request: once the
      // application is approved or declined, a list of outstanding paperwork
      // is a stale instruction the applicant would still be acting on.
      requestedDocuments:
        input.status === "awaiting_documents" ? (input.documents ?? []) : undefined,
    };

    this.applications.set(reference, next);
    return next;
  }

  async count(): Promise<number> {
    return this.applications.size;
  }

  /** Used once at module load. See `SEED_APPLICATIONS`. */
  seed(applications: PartnerApplication[]) {
    // Oldest first, because `insert` unshifts — this leaves the newest
    // submission at the top of the queue, which is the order the list wants.
    [...applications].reverse().forEach((a) => this.insert(a));
  }
}

/* -------------------------------------------------------------- seeding -- */

/**
 * A review queue with something in it.
 *
 * An empty Pending tab is technically correct on a fresh process and useless
 * as a demonstration: there is nothing to approve, nothing to decline, and no
 * way to see what the notification a decision sends actually looks like
 * without first filling in a six-step form. These three are shaped like real
 * submissions — complete, scored, plausible — and a genuine registration
 * appears above them the moment one is submitted.
 *
 * The first deliberately uses the Pro demo account's address, so a document
 * request made here can be followed by signing in as that partner and finding
 * it waiting. That is the one path through this feature that crosses both
 * sides of the product, and it needs a seeded application to be walkable.
 */
/**
 * A seeded attachment a reviewer can actually open.
 *
 * The three applications below were never submitted through the form, so
 * nothing uploaded their paperwork — and a queue whose only walkable records
 * said "no copy held" would demonstrate the absence of the feature rather
 * than the feature. Each one gets a real one-page PDF, filed in the same
 * store a genuine upload lands in and served by the same route, so Open and
 * Download behave here exactly as they do for a live application.
 */
function seedDocument(filename: string, title: string, lines: string[]): DocumentMeta {
  const bytes = placeholderPdf(title, lines);
  const stored = documentStore.put({ name: filename, mimeType: "application/pdf", bytes });
  return {
    name: filename,
    sizeBytes: bytes.byteLength,
    mimeType: "application/pdf",
    storageId: stored.id,
  };
}

const SEED_DOC_NOTE = "Sample document generated for the Rotamove demo review queue.";

function seedApplication(
  over: Partial<PartnerApplication> & Pick<PartnerApplication, "legalName" | "countryIso" | "city" | "email" | "contactName">,
  daysAgo: number,
): PartnerApplication {
  const registrationNumber = over.registrationNumber ?? "TR-884120";
  const transportLicence = over.transportLicence ?? "L2-44190";
  const cargoCoverEur = over.cargoCoverEur ?? 150_000;
  const liabilityCoverEur = over.liabilityCoverEur ?? 300_000;
  const company = over.tradingName || over.legalName;

  const base: PartnerApplicationInput = {
    legalName: over.legalName,
    tradingName: over.tradingName ?? "",
    countryIso: over.countryIso,
    city: over.city,
    foundedYear: over.foundedYear ?? 2011,
    website: over.website ?? "",
    size: over.size ?? "small",

    contactName: over.contactName,
    contactRole: over.contactRole ?? "Operations",
    email: over.email,
    phone: over.phone ?? "+90 532 114 22 08",
    altPhone: "",
    languages: over.languages ?? ["en"],
    emailVerified: true,
    phoneVerified: true,

    registrationNumber,
    vatNumber: over.vatNumber ?? "",
    transportLicence,
    cargoCoverEur,
    liabilityCoverEur,
    memberships: over.memberships ?? ["none"],
    registrationDoc: seedDocument("registration-extract.pdf", "Company registration extract", [
      over.legalName,
      `Registered office: ${over.city}, ${over.countryIso}`,
      `Registration number: ${registrationNumber}`,
      `Founded: ${over.foundedYear ?? 2011}`,
      "",
      SEED_DOC_NOTE,
    ]),
    insuranceDoc: seedDocument("insurance-certificate.pdf", "Certificate of cargo insurance", [
      `Insured: ${over.legalName}`,
      `Cargo cover: EUR ${cargoCoverEur.toLocaleString("en-GB")} per consignment`,
      `Liability cover: EUR ${liabilityCoverEur.toLocaleString("en-GB")}`,
      "",
      SEED_DOC_NOTE,
    ]),
    /*
     * `in` rather than `??`, so a seed can say "no licence on file" and mean
     * it. Caspian Freight is parked on `awaiting_documents` precisely because
     * its licence scan is missing, and a nullish default would have handed it
     * the very document the reviewer is chasing.
     */
    licenceDoc: "licenceDoc" in over
      ? (over.licenceDoc ?? null)
      : seedDocument("transport-licence.pdf", "Operating licence", [
          `Holder: ${company}`,
          `Licence number: ${transportLicence}`,
          `Issued in: ${over.countryIso}`,
          "",
          SEED_DOC_NOTE,
        ]),

    lorries: over.lorries ?? 6,
    vans: over.vans ?? 3,
    frigo: over.frigo ?? 0,
    crane: over.crane ?? 0,
    ownership: over.ownership ?? "owned",
    weeklyCapacityM3: over.weeklyCapacityM3 ?? 320,
    modes: over.modes ?? ["road"],
    services: over.services ?? ["packing", "storage"],

    regions: over.regions ?? ["TR", "EU_SOUTH"],
    availability: over.availability ?? "within_week",
    notes: over.notes ?? "",
    declaration: true,
    plan: over.plan ?? "pay_per_lead",
  };

  return {
    ...base,
    // Deterministic references rather than random ones, so a reload does not
    // renumber the queue mid-demonstration.
    reference: over.reference ?? applicationReference(over.countryIso, 0.42 + daysAgo / 100),
    submittedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    score: scoreApplication(base),
    status: over.status ?? "pending",
    review: over.review ?? [],
    requestedDocuments: over.requestedDocuments,
  };
}

const SEED_APPLICATIONS: PartnerApplication[] = [
  seedApplication(
    {
      legalName: "Anadolu Lojistik A.Ş.",
      tradingName: "Anadolu Moves",
      countryIso: "TR",
      city: "Istanbul",
      contactName: "Mert Aydın",
      // The Pro demo login, on purpose — see the note above.
      email: "pro@rotamove.com",
      website: "https://anadolu-moves.example",
      memberships: ["tobb", "iso_9001"],
      lorries: 14,
      vans: 6,
      frigo: 3,
      crane: 1,
      weeklyCapacityM3: 780,
      regions: ["TR", "EU_SOUTH", "BALKANS"],
      availability: "immediate",
      plan: "pro_unlimited",
      notes: "Weekly groupage Istanbul–Sofia–Bucharest. Bonded warehouse at Ambarlı.",
    },
    1,
  ),
  seedApplication(
    {
      legalName: "Rheinfracht Spedition GmbH",
      tradingName: "Rheinfracht",
      countryIso: "DE",
      city: "Köln",
      contactName: "Katrin Vogel",
      contactRole: "Managing Director",
      email: "k.vogel@rheinfracht.example",
      phone: "+49 221 558 0142",
      languages: ["de", "en"],
      registrationNumber: "HRB-220914",
      vatNumber: "DE288114220",
      transportLicence: "EU-LIC-77421",
      cargoCoverEur: 600_000,
      liabilityCoverEur: 1_200_000,
      memberships: ["fidi_faim", "iam"],
      foundedYear: 1998,
      size: "medium",
      lorries: 32,
      vans: 11,
      frigo: 8,
      crane: 2,
      ownership: "mixed",
      weeklyCapacityM3: 1_640,
      modes: ["road", "rail"],
      services: ["packing", "storage", "customs", "piano"],
      regions: ["EU_WEST", "NORDICS", "BALKANS"],
      availability: "immediate",
      plan: "pro_unlimited",
    },
    3,
  ),
  seedApplication(
    {
      legalName: "Caspian Freight Services LLC",
      countryIso: "UZ",
      city: "Tashkent",
      contactName: "Dilnoza Karimova",
      email: "d.karimova@caspianfreight.example",
      phone: "+998 71 203 4418",
      languages: ["ru", "en"],
      registrationNumber: "UZ-5520914",
      transportLicence: "TRACECA-1182",
      // The document the reviewer below is still waiting for. See `seedDocument`.
      licenceDoc: null,
      cargoCoverEur: 80_000,
      liabilityCoverEur: 120_000,
      foundedYear: 2019,
      size: "micro",
      lorries: 4,
      vans: 1,
      ownership: "leased",
      weeklyCapacityM3: 140,
      regions: ["CENTRAL_ASIA", "CIS"],
      availability: "within_month",
      plan: "pay_per_seen",
      status: "awaiting_documents",
      requestedDocuments: ["insurance_certificate", "transport_licence"],
      review: [
        {
          status: "awaiting_documents",
          at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
          by: REVIEWER,
          note: "Cover is below the €100k floor for the CIS corridor. Need the current certificate and the TRACECA licence scan.",
          documents: ["insurance_certificate", "transport_licence"],
        },
      ],
    },
    6,
  ),
];

/**
 * One instance per process, so the review queue is not emptied by a hot
 * reload, the seed is not applied twice, and — the reason it matters most —
 * a decision written by the admin route is visible to every other reader.
 * See `server-singleton.ts`.
 */
export const partnerRepository: PartnerRepository = serverSingleton(
  "__rotamovePartners",
  () => {
    const repository = new InMemoryPartnerRepository();
    repository.seed(SEED_APPLICATIONS);
    return repository;
  },
);
