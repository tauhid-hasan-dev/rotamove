import {
  applicationReference,
  scoreApplication,
  normaliseWebsite,
  type PartnerApplication,
  type PartnerApplicationInput,
} from "@/lib/partner-application";

/**
 * Partner application repository.
 *
 * Same shape as `leadRepository`: the demo keeps applications in a
 * process-local Map, but every caller goes through this interface, so the
 * swap to a real table is one file. Applications are the input to partner
 * vetting, so in production this is the write that triggers a review queue.
 */

export interface PartnerRepository {
  create(input: PartnerApplicationInput): Promise<PartnerApplication>;
  get(reference: string): Promise<PartnerApplication | null>;
  recent(limit?: number): Promise<PartnerApplication[]>;
  count(): Promise<number>;
}

class InMemoryPartnerRepository implements PartnerRepository {
  private readonly applications = new Map<string, PartnerApplication>();
  private readonly order: string[] = [];
  private readonly capacity = 200;

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
    };

    this.applications.set(application.reference, application);
    this.order.unshift(application.reference);
    while (this.order.length > this.capacity) {
      const evicted = this.order.pop();
      if (evicted) this.applications.delete(evicted);
    }
    return application;
  }

  async get(reference: string): Promise<PartnerApplication | null> {
    return this.applications.get(reference) ?? null;
  }

  async recent(limit = 25): Promise<PartnerApplication[]> {
    return this.order.slice(0, limit).flatMap((ref) => {
      const found = this.applications.get(ref);
      return found ? [found] : [];
    });
  }

  async count(): Promise<number> {
    return this.applications.size;
  }
}

export const partnerRepository: PartnerRepository = new InMemoryPartnerRepository();
