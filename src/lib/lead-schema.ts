import { z } from "zod";
import { CITY_BY_CODE } from "@/lib/geo";
import { LOCALES } from "@/i18n/config";

/**
 * One schema, used by the wizard (per-step validation), the API route and the
 * URL codec. Keeping validation in a single place is what stops a "demo" form
 * and a "real" endpoint from drifting apart.
 */

const cityCode = z
  .string()
  .min(3)
  .max(3)
  .refine((code) => CITY_BY_CODE.has(code), { message: "Choose a city from the list" });

export const addressSchema = z.object({
  cityCode,
  area: z.string().max(80).optional(),
  access: z.enum(["ground", "lift", "stairs_1_2", "stairs_3_plus"]),
  easyParking: z.boolean(),
});

export const specialItemsSchema = z.object({
  piano: z.boolean(),
  vehicle: z.boolean(),
  artwork: z.boolean(),
  safe: z.boolean(),
  gym: z.boolean(),
  plants: z.boolean(),
});

export const extraServicesSchema = z.object({
  packing: z.boolean(),
  unpacking: z.boolean(),
  dismantling: z.boolean(),
  storageWeeks: z.number().int().min(0).max(52),
  insurance: z.boolean(),
  customsClearance: z.boolean(),
  cleaning: z.boolean(),
});

/** Permissive on format, strict on reachability — international numbers vary wildly. */
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a reachable phone number")
  .max(24)
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a reachable phone number");

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us who to address the quotes to").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: phoneSchema,
  channel: z.enum(["phone", "whatsapp", "email", "all"]),
  locale: z.enum(LOCALES),
  /**
   * Plain booleans here, `true` in `contactStepSchema` below.
   *
   * The API has to accept an unverified contact — a future channel (an import,
   * a partner-side entry) may legitimately have no code exchange — while the
   * wizard refuses to submit one. Two schemas, one source.
   */
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
});

export const leadDraftSchema = z
  .object({
    moveType: z.enum(["international", "domestic"]),
    origin: addressSchema,
    destination: addressSchema,
    moveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a move date"),
    flexibility: z.enum(["exact", "plus_minus_3", "within_2_weeks", "flexible"]),
    propertySize: z.enum([
      "few_items",
      "studio",
      "one_bed",
      "two_bed",
      "three_bed",
      "four_bed",
      "villa",
      "office",
    ]),
    volumeM3: z.number().min(2).max(400),
    serviceLevel: z.enum(["full_service", "door_to_door", "transport_only"]),
    specialItems: specialItemsSchema,
    extras: extraServicesSchema,
    contact: contactSchema,
    // Mirrors `MatchCount`: two, five, or every match on the route.
    preferredMatches: z.union([z.literal(2), z.literal(5), z.null()]),
    notes: z.string().max(1200).optional(),
    consent: z.literal(true, { message: "We need your consent to share the enquiry with movers" }),
  })
  .refine((lead) => lead.origin.cityCode !== lead.destination.cityCode, {
    message: "Origin and destination must be different",
    path: ["destination", "cityCode"],
  });

export type LeadDraftInput = z.infer<typeof leadDraftSchema>;

/** Step-scoped schemas so the wizard can validate as the user goes. */
export const routeStepSchema = z
  .object({
    origin: addressSchema.pick({ cityCode: true }),
    destination: addressSchema.pick({ cityCode: true }),
  })
  .refine((v) => v.origin.cityCode !== v.destination.cityCode, {
    message: "Origin and destination must be different",
    path: ["destination", "cityCode"],
  });

export const contactStepSchema = contactSchema.extend({
  emailVerified: z.literal(true, { message: "Verify your email address to continue" }),
  phoneVerified: z.literal(true, { message: "Verify your phone number to continue" }),
  consent: z.literal(true, { message: "Please accept to continue" }),
});
