import { z } from "zod";
import { cityCountry, getCity } from "@/lib/geo";
import {
  companyStepSchema,
  contactStepSchema,
  coverageStepSchema,
  credentialsStepSchema,
  documentMetaSchema,
  fleetStepSchema,
  MEMBERSHIPS,
  type Membership,
} from "@/lib/partner-application";
import { LOCALES, type Locale } from "@/i18n/config";
import type { Mover } from "@/lib/types";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * Everything a partner can maintain about themselves.
 *
 * Built from the registration form's own step schemas rather than from a
 * second, smaller list of "editable fields". A partner filled in six screens
 * to get an account; they should be able to open Settings and find the same
 * six screens, with the same labels and the same controls, rather than a
 * handful of the fields and a support address for the rest. Composing the
 * schemas here is what makes that true by construction — a field added to
 * the application form becomes editable the same day, and cannot be
 * collected once and then quietly become unmaintainable.
 *
 * Two deliberate differences from the application:
 *
 *  - The conduct declaration is not here. It is accepted once, and asking
 *    for it again on a change of phone number would make it meaningless.
 *  - The three documents are optional. The originals are already on file;
 *    requiring a re-upload to correct a typo in a city name would be
 *    hostile, so an absent document means "unchanged", not "removed".
 *
 * The plan is not here either — it is a billing fact, held by
 * `plan-store.ts`, and changed through its own flow with its own terms.
 */

/* ------------------------------------------------------------- schema -- */

/**
 * Credentials as Settings needs them: documents optional.
 *
 * `nullish`, not `optional`: an unattached document is `null` in form state,
 * and `optional()` admits only `undefined` — the same trap the application
 * form's licence field already documents.
 */
const credentialsForProfile = credentialsStepSchema.extend({
  registrationDoc: documentMetaSchema.nullish(),
  insuranceDoc: documentMetaSchema.nullish(),
});

export const partnerProfileSchema = companyStepSchema
  .extend(contactStepSchema.shape)
  .extend(credentialsForProfile.shape)
  .extend(fleetStepSchema.shape)
  .extend(coverageStepSchema.omit({ declaration: true }).shape)
  .refine((a) => a.lorries + a.vans > 0, {
    message: "Tell us about at least one vehicle",
    path: ["lorries"],
  });

export type PartnerProfileInput = z.infer<typeof partnerProfileSchema>;

/**
 * What is stored.
 *
 * The two verification flags gate the write and are then dropped: they say
 * something about this request, not about the account.
 */
export type PartnerProfile = Omit<PartnerProfileInput, "emailVerified" | "phoneVerified"> & {
  /** Internal mover id of the partner this belongs to. */
  partnerId: string;
  updatedAt?: string;
};

/** Fields a change to which is worth telling the account holder about. */
export const SENSITIVE_FIELDS = ["email", "phone"] as const;

/* -------------------------------------------------------------- seeding -- */

/** Company size, inferred from the fleet the catalogue already records. */
function sizeFor(mover: Mover): PartnerProfile["size"] {
  const people = mover.crewSize + mover.fleetTrucks;
  if (people > 200) return "large";
  if (people > 50) return "medium";
  if (people > 10) return "small";
  return "micro";
}

/**
 * A deterministic demo phone number for an account that has none.
 *
 * The mover catalogue has no phone field, and the schema will not accept an
 * empty one. Rather than leave Settings opening on an invalid required field,
 * a number is derived from the partner id — stable across renders and
 * restarts, obviously patterned, and the first thing a real partner would
 * correct. Deriving it is preferable to a single hardcoded number only
 * because three demo accounts sharing one number looks like a bug.
 */
function seedPhone(moverId: string, dialling: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < moverId.length; i += 1) {
    hash ^= moverId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const digits = String(hash % 10_000_000).padStart(7, "0");
  return `${dialling} 532 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
}

/** Reference-like identifiers the catalogue does not carry. See `seedPhone`. */
function seedRef(moverId: string, prefix: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < moverId.length; i += 1) {
    hash ^= moverId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${prefix}-${String(hash % 1_000_000).padStart(6, "0")}`;
}

/**
 * A complete, valid profile for an account that has never opened Settings.
 *
 * Everything that the mover catalogue can answer comes from it. The rest is
 * derived deterministically and is plainly demo data — the alternative is
 * greeting a partner with eight empty required fields, which teaches them
 * that Settings is broken rather than that it is theirs to fill in.
 */
export function seedProfile(opts: {
  partnerId: string;
  mover: Mover;
  email: string;
  locale: Locale;
}): PartnerProfile {
  const { mover } = opts;
  const hq = getCity(mover.hqCity);
  const country = hq ? cityCountry(hq) : undefined;
  const iso = country?.iso ?? "TR";

  const memberships = mover.certifications
    .map((c) => String(c).toLowerCase().replace(/[^a-z0-9]+/g, "_"))
    .filter((c): c is Membership => (MEMBERSHIPS as readonly string[]).includes(c));

  return {
    partnerId: opts.partnerId,

    legalName: mover.legalName,
    tradingName: mover.name,
    countryIso: iso,
    city: hq?.name ?? mover.hqCity,
    foundedYear: mover.since,
    website: `https://${mover.slug}.example`,
    size: sizeFor(mover),

    contactName: mover.name,
    contactRole: "Operations",
    email: opts.email,
    phone: seedPhone(mover.id, iso === "TR" ? "+90" : "+49"),
    altPhone: "",
    // The catalogue stores languages as free strings; the profile stores
    // interface locales, a different and smaller set. Only the ones that map
    // are carried over, and the reader's locale backstops an empty result so
    // the field is never invalid on arrival.
    languages: (() => {
      const matched = mover.languages.filter((l): l is Locale =>
        (LOCALES as readonly string[]).includes(l),
      );
      return matched.length ? matched : [opts.locale];
    })(),

    registrationNumber: seedRef(mover.id, iso),
    vatNumber: "",
    transportLicence: seedRef(mover.id, "L2"),
    cargoCoverEur: mover.insuranceUpToEur,
    // Liability typically runs ahead of cargo cover; capped at the schema's
    // ceiling so a well-insured carrier does not seed an invalid profile.
    liabilityCoverEur: Math.min(10_000_000, mover.insuranceUpToEur * 2),
    memberships: memberships.length ? memberships : ["none"],
    registrationDoc: null,
    insuranceDoc: null,
    licenceDoc: null,

    lorries: mover.fleetTrucks,
    vans: Math.max(1, Math.round(mover.fleetTrucks / 3)),
    ownership: "owned",
    weeklyCapacityM3: Math.max(40, mover.fleetTrucks * 60),
    modes: mover.modes.length ? [...mover.modes] : ["road"],
    services: (Object.keys(mover.services) as Array<keyof Mover["services"]>).filter(
      (k) => mover.services[k],
    ),

    regions: [...mover.regions],
    availability: "immediate",
    notes: "",
  };
}

/* ---------------------------------------------------------- repository -- */

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

/** Order-insensitive, so a reordered chip list is not reported as a change. */
const sameSet = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && [...a].map(String).sort().join() === [...b].map(String).sort().join();

const sameDoc = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Drop the confirmation flags.
 *
 * They say something about the request — that this caller proved it holds
 * the address — and nothing about the account, so they gate the write and
 * are not stored. `void` rather than an underscore prefix, because the point
 * is that they are deliberately discarded rather than merely unused.
 */
function withoutVerification(input: PartnerProfileInput) {
  const { emailVerified, phoneVerified, ...rest } = input;
  void emailVerified;
  void phoneVerified;
  return rest;
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
    const stored = withoutVerification(input);

    const next: PartnerProfile = {
      ...stored,
      partnerId,
      // An absent document means "unchanged", never "removed" — the original
      // is on file and was never transmitted here to re-send.
      registrationDoc: stored.registrationDoc ?? current.registrationDoc ?? null,
      insuranceDoc: stored.insuranceDoc ?? current.insuranceDoc ?? null,
      licenceDoc: stored.licenceDoc ?? current.licenceDoc ?? null,
      updatedAt: new Date().toISOString(),
    };

    /*
     * Compared field by field rather than by deep equality on the record:
     * `updatedAt` always differs, arrays need order-insensitive comparison,
     * and the caller needs the names of what moved rather than a boolean.
     */
    const changed: string[] = [];
    const keys = Object.keys(stored) as Array<keyof typeof stored>;
    for (const key of keys) {
      const before = current[key as keyof PartnerProfile];
      const after = next[key as keyof PartnerProfile];
      const equal = Array.isArray(before)
        ? sameSet(before, (after ?? []) as unknown[])
        : key.endsWith("Doc")
          ? sameDoc(before, after)
          : before === after;
      if (!equal) changed.push(String(key));
    }

    this.profiles.set(partnerId, next);
    return { profile: next, changed, previousEmail: current.email };
  }
}

export const partnerProfileRepository: PartnerProfileRepository = serverSingleton(
  "__rotamovePartnerProfiles",
  () => new InMemoryPartnerProfileRepository(),
);
