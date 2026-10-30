import { z } from "zod";
import { COUNTRY_BY_ISO } from "@/lib/geo";
import { PLAN_IDS } from "@/lib/plans";
import { LOCALES } from "@/i18n/config";
import type { RegionId } from "@/lib/geo";

/**
 * Carrier onboarding.
 *
 * The field set follows what accreditation bodies and freight marketplaces
 * actually verify, rather than what is easy to ask for: legal entity and
 * registration number, operating licence, insurance *with cover amounts*,
 * fleet composition and ownership, operating regions, and the documents that
 * back all of it. FIDI/FAIM turns on much the same spine — trading history,
 * an insurance declaration, financial stability and a signed conduct charter.
 *
 * Everything here is declared once and reused by the form, the API route and
 * the scoring function, so a field cannot be collected and then quietly
 * ignored downstream.
 */

export const MEMBERSHIPS = [
  "fidi_faim",
  "iam",
  "amo",
  "bar",
  "iata",
  "iso_9001",
  "tobb",
  "none",
] as const;
export type Membership = (typeof MEMBERSHIPS)[number];

/**
 * Accreditation names, which are the same in every language.
 *
 * Not in the locale dictionaries because they are proper nouns — FIDI is
 * FIDI in Arabic — and a translator handed these would have nothing to do
 * but risk mangling them. Lives here rather than in the registration form
 * because the review queue and the partner's own settings now show the same
 * list, and three copies of an acronym table is three chances to drift.
 */
export const MEMBERSHIP_LABELS: Record<Membership, string> = {
  fidi_faim: "FIDI / FAIM",
  iam: "IAM",
  amo: "AMÖ",
  bar: "BAR",
  iata: "IATA",
  iso_9001: "ISO 9001",
  tobb: "TOBB",
  none: "—",
};

export const FLEET_OWNERSHIP = ["owned", "leased", "mixed", "subcontracted"] as const;
export type FleetOwnership = (typeof FLEET_OWNERSHIP)[number];

export const COMPANY_SIZES = ["micro", "small", "medium", "large"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const AVAILABILITY = ["immediate", "within_week", "within_month"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const SERVICE_KEYS = [
  "packing",
  "storage",
  "customs",
  "vehicle",
  "piano",
  "cleaning",
] as const;

export const MODE_KEYS = ["road", "sea", "air", "rail"] as const;

export const REGION_KEYS = [
  "TR",
  "EU_WEST",
  "EU_SOUTH",
  "BALKANS",
  "NORDICS",
  "CIS",
  "CENTRAL_ASIA",
  "MIDDLE_EAST",
] as const satisfies ReadonlyArray<RegionId>;

/* ------------------------------------------------------------- documents -- */

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

/**
 * What the server keeps about an uploaded file.
 *
 * `storageId` is the handle the bytes were filed under by
 * `POST /api/partners/documents` — see `document-store.ts`. It is optional
 * because a record written before file storage existed, or one whose bytes
 * have since been evicted, is still a valid application: the reviewer sees
 * the name, the type and the size, and is told plainly that there is no copy
 * to open. A missing id degrades the row; it does not invalidate the
 * application.
 */
export const documentMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  mimeType: z.enum(ACCEPTED_DOCUMENT_TYPES),
  /** Hex, from `document-store.ts`. Narrow on format so it cannot be a path. */
  storageId: z
    .string()
    .regex(/^[0-9a-f]{32}$/)
    .optional(),
});
export type DocumentMeta = z.infer<typeof documentMetaSchema>;

/* ---------------------------------------------------------------- schema -- */

const currentYear = new Date().getFullYear();

/** Permissive on format, strict on reachability — international numbers vary. */
const phone = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a reachable phone number");

export const companyStepSchema = z.object({
  legalName: z.string().trim().min(2).max(120),
  tradingName: z.string().trim().max(120).optional().or(z.literal("")),
  countryIso: z.string().refine((iso) => COUNTRY_BY_ISO.has(iso), "Choose a country"),
  city: z.string().trim().min(2).max(80),
  foundedYear: z.number().int().min(1900).max(currentYear),
  // Accepts "rotamove.com" as readily as the full URL; normalised on submit.
  website: z.string().trim().max(200).optional().or(z.literal("")),
  size: z.enum(COMPANY_SIZES),
});

export const contactStepSchema = z.object({
  contactName: z.string().trim().min(2).max(80),
  contactRole: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone,
  altPhone: z.string().trim().max(24).optional().or(z.literal("")),
  languages: z.array(z.enum(LOCALES)).min(1, "Pick at least one language"),
  /*
   * Both contact routes are confirmed by a one-time code before the step will
   * advance, and the flags are part of the schema rather than a UI nicety so
   * the API refuses an unverified application too.
   *
   * This is the one field set on the form that exists for our benefit rather
   * than the applicant's. Everything downstream — the reference code, the
   * approval, a request for a missing licence — is delivered to this address
   * and this number, and a vetting queue full of applications we cannot reach
   * is a queue that has to be worked by hand and then thrown away. A typo in
   * an email address is both the likeliest error on the form and the only one
   * that makes every later message silently fail.
   */
  emailVerified: z.literal(true, { message: "Verify your email address" }),
  phoneVerified: z.literal(true, { message: "Verify your phone number" }),
});

export const credentialsStepSchema = z.object({
  registrationNumber: z.string().trim().min(2).max(60),
  vatNumber: z.string().trim().max(60).optional().or(z.literal("")),
  transportLicence: z.string().trim().min(2).max(60),
  // Cover amounts, not a yes/no: "insured" without a figure tells a shipper
  // nothing, and every accreditation body asks for the number.
  cargoCoverEur: z.number().int().min(0).max(10_000_000),
  liabilityCoverEur: z.number().int().min(0).max(10_000_000),
  memberships: z.array(z.enum(MEMBERSHIPS)),
  registrationDoc: documentMetaSchema,
  insuranceDoc: documentMetaSchema,
  // `nullish`, not `optional`: an unattached document is `null` in the form
  // state, and `optional()` only admits `undefined` — which silently blocked
  // the whole step on an input that is not even required.
  licenceDoc: documentMetaSchema.nullish(),
});

export const fleetStepSchema = z.object({
  lorries: z.number().int().min(0).max(5000),
  vans: z.number().int().min(0).max(5000),
  /*
   * Counted separately rather than folded into the services list.
   *
   * A reefer unit and a lorry-mounted crane are capital assets with their own
   * licences and their own day rate, and a carrier with two of each can take
   * work a carrier with none cannot — which is a number, not a tick. They sit
   * beside the lorry and van counts because that is the same question asked
   * about two more kinds of vehicle.
   */
  frigo: z.number().int().min(0).max(5000),
  crane: z.number().int().min(0).max(5000),
  ownership: z.enum(FLEET_OWNERSHIP),
  weeklyCapacityM3: z.number().int().min(1).max(100_000),
  modes: z.array(z.enum(MODE_KEYS)).min(1, "Pick at least one mode"),
  services: z.array(z.enum(SERVICE_KEYS)),
});

export const coverageStepSchema = z.object({
  regions: z.array(z.enum(REGION_KEYS)).min(1, "Pick at least one region"),
  availability: z.enum(AVAILABILITY),
  notes: z.string().trim().max(1200).optional().or(z.literal("")),
  // Mirrors the conduct charters FIDI requires at application.
  declaration: z.literal(true),
});

/**
 * How the applicant intends to pay.
 *
 * Asked at application rather than after approval, and required rather than
 * defaulted: the three plans bill in genuinely different ways — a flat month,
 * per lead assigned, per lead opened — and which one a carrier wants is a
 * commercial decision, not a setting to be guessed on their behalf. An
 * account created without one would have to be chased for it before the
 * first lead could be billed.
 *
 * `PLAN_IDS` is the same list the pricing page and the dashboard read, so a
 * fourth plan appears here the day it is added there.
 */
export const planStepSchema = z.object({
  plan: z.enum(PLAN_IDS),
});

export const partnerApplicationSchema = companyStepSchema
  .extend(contactStepSchema.shape)
  .extend(credentialsStepSchema.shape)
  .extend(fleetStepSchema.shape)
  .extend(coverageStepSchema.shape)
  .extend(planStepSchema.shape)
  .refine((a) => a.lorries + a.vans + a.frigo + a.crane > 0, {
    message: "Tell us about at least one vehicle",
    path: ["lorries"],
  });

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;

/**
 * Where an application sits in vetting.
 *
 * `awaiting_documents` is a hold, not a verdict: the reviewer has asked for
 * something and the application stays in the queue until it arrives. Keeping
 * it distinct from `pending` is what lets the queue be filtered down to "work
 * I can actually do right now" — a reviewer looking at forty applications
 * needs to skip the ones already waiting on somebody else.
 */
export type ApplicationStatus = "pending" | "awaiting_documents" | "approved" | "declined";

export const APPLICATION_STATUSES = [
  "pending",
  "awaiting_documents",
  "approved",
  "declined",
] as const satisfies ReadonlyArray<ApplicationStatus>;

/** One thing a reviewer did to an application. Append-only. */
export interface ReviewEvent {
  status: ApplicationStatus;
  at: string;
  by: string;
  /** The reviewer's words: a decline reason, or a note with a document ask. */
  note?: string;
  /** What was asked for, when the event is a document request. */
  documents?: string[];
}

export interface PartnerApplication extends PartnerApplicationInput {
  /** Quoted back to the applicant; becomes their partner ID once approved. */
  reference: string;
  submittedAt: string;
  /** Internal 0–100 readiness score. Never returned to the applicant. */
  score: number;
  status: ApplicationStatus;
  /**
   * The audit trail. A vetting decision is the kind of thing somebody asks
   * about months later — "who approved this carrier, and on what basis" — and
   * a single mutable status field cannot answer it.
   */
  review: ReviewEvent[];
  /** Still outstanding from the last document request, if any. */
  requestedDocuments?: string[];
}

/** The documents a reviewer can ask for. Labels are translated in the UI. */
export const REQUESTABLE_DOCUMENTS = [
  "insurance_certificate",
  "transport_licence",
  "registration_extract",
  "vat_certificate",
  "fleet_list",
  "bank_details",
  "conduct_charter",
] as const;

export type RequestableDocument = (typeof REQUESTABLE_DOCUMENTS)[number];

/* ------------------------------------------------------------------- ids -- */

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * `RM-TR-7K4QM2` — prefix, country, six characters.
 *
 * The alphabet omits I, O, 0 and 1 because this reference gets read down a
 * phone line and typed back into a support form.
 */
export function applicationReference(countryIso: string, seed = Math.random()): string {
  let n = Math.floor(seed * 0xffffffff);
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += REFERENCE_ALPHABET[n % REFERENCE_ALPHABET.length];
    n = Math.floor(n / REFERENCE_ALPHABET.length) + 7919 * (i + 1);
  }
  return `RM-${countryIso.toUpperCase()}-${out}`;
}

/**
 * A stable partner ID for an existing account.
 *
 * Derived from the internal mover id so the dashboard shows the same number
 * on every render and across restarts, which a random one would not.
 */
export function partnerIdFor(moverId: string, countryIso: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < moverId.length; i += 1) {
    hash ^= moverId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `RM-${countryIso.toUpperCase()}-${String(hash % 100000).padStart(5, "0")}`;
}

/* --------------------------------------------------------------- scoring -- */

/**
 * Internal readiness score, 0–100.
 *
 * Weighted towards the things that actually predict whether a partner can
 * take a job and be trusted with it: verifiable credentials, insurance cover,
 * owned capacity and trading history. Deliberately not shown to the applicant
 * — a visible score is a score people optimise against.
 */
export function scoreApplication(a: PartnerApplicationInput): number {
  let score = 0;

  // Credentials and cover — the half that vetting actually turns on.
  if (a.registrationNumber) score += 8;
  if (a.transportLicence) score += 10;
  if (a.vatNumber) score += 2;
  if (a.insuranceDoc) score += 8;
  if (a.licenceDoc) score += 4;
  score += Math.min(12, Math.round(a.cargoCoverEur / 25_000));
  score += Math.min(6, Math.round(a.liabilityCoverEur / 50_000));

  const accredited = a.memberships.filter((m) => m !== "none");
  score += Math.min(12, accredited.length * 4);

  // Capacity, with owned fleet counting for more than brokered.
  const vehicles = a.lorries + a.vans + a.frigo + a.crane;
  score += Math.min(10, Math.round(vehicles / 3));
  score +=
    a.ownership === "owned" ? 8 : a.ownership === "mixed" ? 5 : a.ownership === "leased" ? 4 : 0;
  score += Math.min(6, Math.round(a.weeklyCapacityM3 / 250));

  // Reach and readiness.
  score += Math.min(6, a.regions.length);
  score += a.availability === "immediate" ? 4 : a.availability === "within_week" ? 2 : 0;
  score += Math.min(4, a.services.length);

  // FIDI asks for two years of continuous trading; so do we.
  const years = currentYear - a.foundedYear;
  if (years >= 10) score += 6;
  else if (years >= 5) score += 4;
  else if (years >= 2) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** "rotamove.com" and "https://rotamove.com" should store identically. */
export function normaliseWebsite(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
