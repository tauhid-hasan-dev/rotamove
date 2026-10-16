import { nanoid } from "nanoid";
import type { Lead, LeadDraft } from "@/lib/types";

/**
 * Lead repository.
 *
 * The interface is the point: the demo runs on a process-local Map, but every
 * caller goes through `leadRepository`, so swapping in Postgres, DynamoDB or a
 * queue-backed writer is a one-file change. Nothing in the UI knows where a
 * lead lives.
 */

export interface LeadRepository {
  create(draft: LeadDraft): Promise<Lead>;
  get(id: string): Promise<Lead | null>;
  recent(limit?: number): Promise<Lead[]>;
  count(): Promise<number>;
}

class InMemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<string, Lead>();
  private readonly order: string[] = [];
  private readonly capacity = 500;

  async create(draft: LeadDraft): Promise<Lead> {
    const lead: Lead = {
      ...draft,
      id: `ld_${nanoid(12)}`,
      createdAt: new Date().toISOString(),
    };
    this.leads.set(lead.id, lead);
    this.order.unshift(lead.id);
    while (this.order.length > this.capacity) {
      const evicted = this.order.pop();
      if (evicted) this.leads.delete(evicted);
    }
    return lead;
  }

  async get(id: string): Promise<Lead | null> {
    return this.leads.get(id) ?? null;
  }

  async recent(limit = 20): Promise<Lead[]> {
    return this.order
      .slice(0, limit)
      .map((id) => this.leads.get(id))
      .filter((l): l is Lead => Boolean(l));
  }

  async count(): Promise<number> {
    return this.leads.size;
  }
}

/**
 * Module-level singleton. Next's dev server re-evaluates modules on edit, so we
 * stash it on globalThis to keep leads alive across hot reloads.
 */
const globalForLeads = globalThis as unknown as { __rotamoveLeads?: LeadRepository };

export const leadRepository: LeadRepository =
  globalForLeads.__rotamoveLeads ?? new InMemoryLeadRepository();

if (process.env.NODE_ENV !== "production") {
  globalForLeads.__rotamoveLeads = leadRepository;
}
