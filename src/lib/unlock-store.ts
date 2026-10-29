import { nanoid } from "nanoid";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * Unlock repository.
 *
 * Every pay-per-seen unlock is a billable event, so unlike the other plans'
 * client-side reveal it is recorded server-side: who opened which lead, what
 * they were charged, and that the confirmation email went out. The admin's
 * live Unlocks view reads the same records.
 *
 * Records are snapshots — route, volume and fee are copied in at unlock time
 * rather than re-derived, because the admin dataset and the partner board are
 * generated independently and share no lead ids.
 */

export type UnlockEmailStatus = "sent" | "opened";

export interface UnlockRecord {
  id: string;
  /** Internal mover id of the partner who unlocked. */
  partnerId: string;
  partnerName: string;
  /** The account number partners quote to support. */
  partnerPublicId: string;
  leadId: string;
  routeLabel: string;
  volumeM3: number;
  /** What the partner was charged for this unlock. */
  feeUsd: number;
  unlockedAt: string;
  /** Where the confirmation email went. Simulated — nothing really sends. */
  emailTo: string;
  emailStatus: UnlockEmailStatus;
}

export type UnlockInput = Omit<UnlockRecord, "id" | "unlockedAt" | "emailStatus">;

export interface UnlockRepository {
  listForPartner(partnerId: string): Promise<UnlockRecord[]>;
  /** Every partner's unlocks, newest first — the admin feed. */
  listAll(): Promise<UnlockRecord[]>;
  /**
   * Record an unlock. Idempotent per partner + lead: a double-click or a
   * repeated request returns the existing record and never charges twice.
   */
  record(input: UnlockInput): Promise<{ record: UnlockRecord; created: boolean }>;
}

class InMemoryUnlockRepository implements UnlockRepository {
  private readonly unlocks = new Map<string, UnlockRecord>();
  private readonly order: string[] = [];
  private readonly capacity = 1000;

  private key(partnerId: string, leadId: string) {
    return `${partnerId}:${leadId}`;
  }

  async listForPartner(partnerId: string): Promise<UnlockRecord[]> {
    return (await this.listAll()).filter((u) => u.partnerId === partnerId);
  }

  async listAll(): Promise<UnlockRecord[]> {
    return this.order
      .map((key) => this.unlocks.get(key))
      .filter((u): u is UnlockRecord => Boolean(u));
  }

  async record(input: UnlockInput): Promise<{ record: UnlockRecord; created: boolean }> {
    const key = this.key(input.partnerId, input.leadId);
    const existing = this.unlocks.get(key);
    if (existing) return { record: existing, created: false };

    const record: UnlockRecord = {
      ...input,
      id: `ul_${nanoid(10)}`,
      unlockedAt: new Date().toISOString(),
      // The "send" — in a real system this is where the mail provider is
      // called; the demo records the outcome it would report.
      emailStatus: "sent",
    };
    this.unlocks.set(key, record);
    this.order.unshift(key);
    while (this.order.length > this.capacity) {
      const evicted = this.order.pop();
      if (evicted) this.unlocks.delete(evicted);
    }
    return { record, created: true };
  }
}

/**
 * Module-level singleton. Next's dev server re-evaluates modules on edit, so we
 * stash it on globalThis to keep unlocks alive across hot reloads.
 */
export const unlockRepository: UnlockRepository = serverSingleton(
  "__rotamoveUnlocks",
  () => new InMemoryUnlockRepository(),
);
