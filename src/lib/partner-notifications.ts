import { nanoid } from "nanoid";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * Things the partner needs to see when they next open the dashboard.
 *
 * Separate from `mailRepository` on purpose, and both are written for the
 * same events. Mail reaches someone who is not looking at the product; this
 * reaches someone who is. A document request that only went out by email is
 * invisible to a partner who signs in to find out what is holding their
 * application up, and one that only appeared in the dashboard is invisible to
 * a partner who is waiting to be told. The reviewer performs one action and
 * both channels carry it.
 *
 * The payload is a kind plus parameters, never a rendered sentence. The
 * dashboard renders it through the locale dictionaries, so a notification
 * written while the reviewer was working in English still reads in Turkish to
 * the partner who receives it. The one exception is `note` — free text the
 * reviewer typed, which is shown verbatim because translating a human's words
 * is not ours to do.
 */

export type PartnerNotificationKind =
  | "documents_requested"
  | "application_approved"
  | "application_declined"
  | "plan_queued"
  | "plan_activated";

export interface PartnerNotification {
  id: string;
  /**
   * Who it is for: the internal mover id of an existing partner, or an
   * application reference for an applicant who has no account yet. Keying on
   * the reference means a request made during vetting is already waiting in
   * the dashboard on the day the account is created, rather than being lost
   * in the gap between the two identities.
   */
  subjectId: string;
  kind: PartnerNotificationKind;
  /** What the reviewer asked for, when the kind is `documents_requested`. */
  documents?: string[];
  /** Free text from the reviewer. Rendered verbatim, never translated. */
  note?: string;
  /** Plan names involved, for the plan kinds. Ids, not labels. */
  fromPlan?: string;
  toPlan?: string;
  /** ISO instant the change lands, for `plan_queued`. */
  effectiveFrom?: string;
  createdAt: string;
  readAt?: string;
}

export type PartnerNotificationInput = Omit<PartnerNotification, "id" | "createdAt" | "readAt">;

export interface PartnerNotificationRepository {
  add(input: PartnerNotificationInput): Promise<PartnerNotification>;
  /** Newest first. */
  listFor(subjectIds: string[]): Promise<PartnerNotification[]>;
  markRead(subjectIds: string[], ids: string[]): Promise<number>;
}

class InMemoryPartnerNotificationRepository implements PartnerNotificationRepository {
  private readonly items: PartnerNotification[] = [];
  private readonly capacity = 500;

  async add(input: PartnerNotificationInput): Promise<PartnerNotification> {
    const item: PartnerNotification = {
      ...input,
      id: `pn_${nanoid(10)}`,
      createdAt: new Date().toISOString(),
    };
    this.items.unshift(item);
    if (this.items.length > this.capacity) this.items.length = this.capacity;
    return item;
  }

  /**
   * Takes a list of ids, not one, because a partner has two identities — the
   * mover id their account runs on and the reference their application was
   * filed under — and both can carry notifications addressed to the same
   * person.
   */
  async listFor(subjectIds: string[]): Promise<PartnerNotification[]> {
    const wanted = new Set(subjectIds.filter(Boolean));
    return this.items.filter((n) => wanted.has(n.subjectId));
  }

  async markRead(subjectIds: string[], ids: string[]): Promise<number> {
    // Scoped to the caller's own subject ids: an id guessed from another
    // partner's feed must not be markable from this session.
    const wanted = new Set(subjectIds.filter(Boolean));
    const target = new Set(ids);
    const at = new Date().toISOString();
    let changed = 0;
    for (const item of this.items) {
      if (!wanted.has(item.subjectId) || !target.has(item.id) || item.readAt) continue;
      item.readAt = at;
      changed += 1;
    }
    return changed;
  }
}

export const partnerNotificationRepository: PartnerNotificationRepository = serverSingleton(
  "__rotamovePartnerNotifications",
  () => new InMemoryPartnerNotificationRepository(),
);
