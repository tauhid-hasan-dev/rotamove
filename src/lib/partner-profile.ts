import { z } from "zod";
import { getCity, type RegionId } from "@/lib/geo";
// The same tuple the application form validates against, rather than a second
// copy of the region list that drifts the day a ninth region is added.
import { REGION_KEYS } from "@/lib/partner-application";
import { LOCALES, type Locale } from "@/i18n/config";
import type { Mover } from "@/lib/types";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * The account details a partner can edit themselves.
 *
 * Deliberately a separate record from `Mover`. The mover catalogue is
 * marketplace data — ratings, on-time rate, completed moves, the corridor
 * list the matching engine reads — and none of it is the partner's to rewrite.
 * What they own is how we reach them and where they say they run, so that is
 * what this holds, and the two are joined rather than merged.
 *
 * Seeded from the mover record on first read, so an account that has never
 * opened Settings still has a complete profile to show rather than a form of
 * empty boxes.
 */

export interface PartnerProfile {
  /** Internal mover id of the partner this belongs to. */
  partnerId: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  /** Where they will take work. Drives nothing automatically — see below. */
  regions: RegionId[];
  languages: Locale[];
  /** Free text for the vetting team: departures, bonded space, restrictions. */
  notes: string;
  updatedAt?: string;
}

/**
 * A complete profile for an account that has never opened Settings.
 *
 * Everything here comes from data we already hold, except the two fields the
 * mover catalogue has no answer for: there is no person on a `Mover`, only a
 * company. Rather than invent a plausible human — a fabricated name in a
 * contact field is the kind of demo detail someone later mistakes for real
 * data — the contact name falls back to the trading name and the role to a
 * function rather than a title. Both are the first things a partner corrects,
 * and seeding them this way keeps the form valid on first open instead of
 * greeting them with two empty required fields.
 */
export function seedProfile(opts: {
  partnerId: string;
  mover: Mover;
  email: string;
  phone?: string;
  locale: Locale;
}): PartnerProfile {
  const hq = getCity(opts.mover.hqCity);
  return {
    partnerId: opts.partnerId,
    contactName: opts.mover.name,
    contactRole: "Operations",
    email: opts.email,
    phone: opts.phone ?? "",
    website: `https://${opts.mover.slug}.example`,
    city: hq?.name ?? opts.mover.hqCity,
    regions: [...opts.mover.regions],
    // The catalogue stores languages as free strings; the profile stores
    // interface locales, which is a different and smaller set. Only the ones
    // that map are carried over, and the reader's own locale backstops an
    // empty result so the field is never invalid on arrival.
    languages: (() => {
      const matched = opts.mover.languages.filter((l): l is Locale =>
        (LOCALES as readonly string[]).includes(l),
      );
      return matched.length ? matched : [opts.locale];
    })(),
    notes: "",
  };
}

/** Permissive on format, strict on reachability — international numbers vary. */
const phone = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a reachable phone number");

/**
 * What a partner may change, validated identically on both sides.
 *
 * `email` and `phone` carry confirmation flags for the same reason the
 * application form does: every message this product sends goes to these two
 * values, and an account that silently edits itself to an unreachable address
 * is an account we can no longer tell anything. The flags are not stored —
 * they gate the write and are dropped.
 */
export const partnerProfileSchema = z.object({
  contactName: z.string().trim().min(2).max(80),
  contactRole: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone,
  emailVerified: z.literal(true, { message: "Confirm your email address" }),
  phoneVerified: z.literal(true, { message: "Confirm your phone number" }),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  regions: z.array(z.enum(REGION_KEYS)).min(1, "Pick at least one region"),
  languages: z.array(z.enum(LOCALES)).min(1, "Pick at least one language"),
  notes: z.string().trim().max(1200).optional().or(z.literal("")),
});

export type PartnerProfileInput = z.infer<typeof partnerProfileSchema>;

/** Fields a change to which is worth telling the account holder about. */
export const SENSITIVE_FIELDS = ["email", "phone"] as const;

export interface PartnerProfileRepository {
  /** The stored profile, or `fallback` seeded and stored on first read. */
  get(partnerId: string, fallback: PartnerProfile): PartnerProfile;
  /**
   * Write the profile. Returns which fields actually changed, so the caller
   * can decide what to notify about — "your details were changed" sent on a
   * save that changed nothing is noise that teaches people to ignore it.
   */
  save(
    partnerId: string,
    fallback: PartnerProfile,
    input: PartnerProfileInput,
  ): { profile: PartnerProfile; changed: string[]; previousEmail: string };
}

class InMemoryPartnerProfileRepository implements PartnerProfileRepository {
  private readonly profiles = new Map<string, PartnerProfile>();

  get(partnerId: string, fallback: PartnerProfile): PartnerProfile {
    const existing = this.profiles.get(partnerId);
    if (existing) return existing;
    this.profiles.set(partnerId, fallback);
    return fallback;
  }

  save(
    partnerId: string,
    fallback: PartnerProfile,
    input: PartnerProfileInput,
  ): { profile: PartnerProfile; changed: string[]; previousEmail: string } {
    const current = this.get(partnerId, fallback);

    const next: PartnerProfile = {
      partnerId,
      contactName: input.contactName,
      contactRole: input.contactRole,
      email: input.email,
      phone: input.phone,
      website: input.website ?? "",
      city: input.city,
      regions: input.regions,
      languages: input.languages,
      notes: input.notes ?? "",
      updatedAt: new Date().toISOString(),
    };

    // Compared field by field rather than by deep equality on the whole
    // record, because `updatedAt` always differs and arrays need order-
    // insensitive comparison to avoid reporting a reordered chip list as a
    // change to coverage.
    const changed: string[] = [];
    const sameSet = (a: readonly string[], b: readonly string[]) =>
      a.length === b.length && [...a].sort().join() === [...b].sort().join();

    if (current.contactName !== next.contactName) changed.push("contactName");
    if (current.contactRole !== next.contactRole) changed.push("contactRole");
    if (current.email !== next.email) changed.push("email");
    if (current.phone !== next.phone) changed.push("phone");
    if (current.website !== next.website) changed.push("website");
    if (current.city !== next.city) changed.push("city");
    if (!sameSet(current.regions, next.regions)) changed.push("regions");
    if (!sameSet(current.languages, next.languages)) changed.push("languages");
    if (current.notes !== next.notes) changed.push("notes");

    this.profiles.set(partnerId, next);
    return { profile: next, changed, previousEmail: current.email };
  }
}

export const partnerProfileRepository: PartnerProfileRepository = serverSingleton(
  "__rotamovePartnerProfiles",
  () => new InMemoryPartnerProfileRepository(),
);
