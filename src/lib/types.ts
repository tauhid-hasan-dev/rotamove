import type { Locale } from "@/i18n/config";
import type { RegionId, TransportMode } from "@/lib/geo";

/* ------------------------------------------------------------------ *
 * Lead
 * ------------------------------------------------------------------ */

export type MoveType = "international" | "domestic";

export type PropertySize =
  | "few_items"
  | "studio"
  | "one_bed"
  | "two_bed"
  | "three_bed"
  | "four_bed"
  | "villa"
  | "office"
  /** Out-of-gauge one-offs: a turbine, a yacht, a boat, cars. */
  | "project";

export type ServiceLevel = "full_service" | "door_to_door" | "transport_only";

export type DateFlexibility = "exact" | "plus_minus_3" | "within_2_weeks" | "flexible";

export type AccessType = "ground" | "lift" | "stairs_1_2" | "stairs_3_plus";

/**
 * How a carrier may make contact.
 *
 * `all` is not a fourth channel — it means the customer is happy on any of
 * the three. Modelling it as a value rather than a separate boolean keeps one
 * field to validate, store and display.
 */
export type ContactChannel = "phone" | "whatsapp" | "email" | "all";

/**
 * How many carriers the enquiry goes to.
 *
 * `null` means every match on the route. A number caps it — the customer is
 * choosing how many replies they are willing to field, which is the single
 * biggest complaint about lead marketplaces.
 */
export type MatchCount = 2 | 5 | null;

export const MATCH_COUNTS: readonly MatchCount[] = [2, 5, null];

/** Owned by the i18n layer; re-exported so the domain model has one source. */
export type { Locale };

export interface AddressDetail {
  cityCode: string;
  /** Free-text neighbourhood / district. Optional: we only need it to price access. */
  area?: string;
  access: AccessType;
  /** Truck can park within 20 m of the entrance. */
  easyParking: boolean;
}

export interface SpecialItems {
  piano: boolean;
  vehicle: boolean;
  artwork: boolean;
  safe: boolean;
  gym: boolean;
  plants: boolean;
}

export interface ExtraServices {
  packing: boolean;
  unpacking: boolean;
  dismantling: boolean;
  /** Weeks of storage at origin or destination. 0 = none. */
  storageWeeks: number;
  insurance: boolean;
  customsClearance: boolean;
  cleaning: boolean;
}

export interface LeadContact {
  fullName: string;
  email: string;
  phone: string;
  channel: ContactChannel;
  locale: Locale;
  /** Confirmed by the one-time code on the contact step. */
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface Lead {
  id: string;
  createdAt: string;
  moveType: MoveType;
  origin: AddressDetail;
  destination: AddressDetail;
  moveDate: string; // yyyy-mm-dd
  flexibility: DateFlexibility;
  propertySize: PropertySize;
  /** Declared or estimated loading volume in m³ — the unit the whole trade prices in. */
  volumeM3: number;
  serviceLevel: ServiceLevel;
  specialItems: SpecialItems;
  extras: ExtraServices;
  contact: LeadContact;
  /** How many carriers to contact. `null` = all matches. */
  preferredMatches: MatchCount;
  notes?: string;
  consent: boolean;
}

/** The subset we encode into a shareable results URL. */
export type LeadDraft = Omit<Lead, "id" | "createdAt">;

/* ------------------------------------------------------------------ *
 * Partner (mover)
 * ------------------------------------------------------------------ */

export type PlanId = "pro_unlimited" | "pay_per_lead" | "pay_per_seen";

export type Certification = "FIDI/FAIM" | "IAM" | "IATA" | "AMÖ" | "ISO 9001" | "TOBB" | "BAR";

export type MoverBadge =
  | "instant_quote"
  | "top_rated"
  | "fast_responder"
  | "best_value"
  | "eco_fleet"
  | "customs_expert"
  | "fragile_specialist";

export interface Mover {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  monogram: string;
  /** Brand accent used for the generated logo tile. */
  accent: string;
  hqCity: string;
  since: number;
  plan: PlanId;
  regions: RegionId[];
  corridors: string[];
  modes: TransportMode[];
  rating: number;
  reviewCount: number;
  completedMoves: number;
  /** Multiplier on the engine's reference price. 0.86 = aggressive, 1.24 = premium. */
  priceIndex: number;
  /** Multiplier on corridor transit days. <1 = faster. */
  speedIndex: number;
  /** 0-1. Share of moves delivered inside the promised window. */
  onTimeRate: number;
  /** Median minutes to first human reply. */
  responseMins: number;
  claimRate: number;
  insuranceUpToEur: number;
  fleetTrucks: number;
  crewSize: number;
  languages: string[];
  certifications: Certification[];
  badges: MoverBadge[];
  services: {
    packing: boolean;
    storage: boolean;
    customs: boolean;
    vehicle: boolean;
    piano: boolean;
    cleaning: boolean;
  };
  blurb: string;
  freeCancellationDays: number;
}

/* ------------------------------------------------------------------ *
 * Quote
 * ------------------------------------------------------------------ */

export interface PriceLine {
  key: string;
  label: string;
  amount: number;
  /** Shown with a muted tone and no amount when the mover bundles it in. */
  included?: boolean;
}

/**
 * An ISO date range, carried as data rather than a formatted string.
 *
 * The matching engine runs on the server with no locale, so pre-rendering
 * "29 Nov – 5 Dec" there froze every quote into English. Shipping the two
 * dates lets the client format them in the reader's language and calendar.
 */
export type DateRange = [string, string];

/**
 * A run the carrier has declared on this exact route.
 *
 * Attached to a quote when the partner's own lane board says a vehicle is
 * already going — the backload. It is the only part of a quote that comes
 * from the carrier rather than from our model of them, which is precisely why
 * it is worth showing the customer.
 */
export interface QuoteLane {
  vehicle: "lorry" | "van";
  /** ISO `[start, end]` for a single dated run; `null` for a standing service. */
  window: DateRange | null;
  /** Space the carrier says is still free on it, m³. */
  capacityM3: number;
  /** That space covers this whole load. */
  fits: boolean;
}

export type QuoteKind =
  /** Pro Unlimited partner: availability is confirmed straight away. */
  | "instant"
  /** Pay-per-lead partner: they pick the lead up, then get in touch. */
  | "bid";

export interface Quote {
  id: string;
  leadId: string;
  moverId: string;
  kind: QuoteKind;
  currency: "EUR";
  total: number;
  /** What a typical traditional broker would charge for the same job. */
  anchor: number;
  lines: PriceLine[];
  mode: TransportMode;
  transitDays: [number, number];
  /** ISO [from, to]; both ends equal for a fixed date. */
  pickupWindow: DateRange;
  deliveryWindow: DateRange;
  validUntilDays: number;
  /** 0-100 composite used for the default "Best match" sort. */
  matchScore: number;
  /** Human sentence explaining the score. Trust is built by showing the why. */
  matchReasons: string[];
  co2Kg: number;
  depositPct: number;
  /** Set when the partner has declared a vehicle already running this lane. */
  lane?: QuoteLane;
  /** Only populated for pay-per-lead partners — what Rotamove charges them (USD). */
  leadFeeUsd?: number;
}

/**
 * What actually leaves the server.
 *
 * The engine still prices every job — ranking depends on it — but no money
 * value is ever serialised to the client. Customers choose a mover on
 * coverage, speed and track record, then talk to them directly.
 */
export interface PublicQuote {
  id: string;
  leadId: string;
  moverId: string;
  kind: QuoteKind;
  mode: TransportMode;
  transitDays: [number, number];
  pickupWindow: DateRange;
  deliveryWindow: DateRange;
  matchScore: number;
  matchReasons: string[];
  co2Kg: number;
  /** Median minutes to a first human reply, copied from the partner record. */
  responseMins: number;
  /** Carries no money, so it crosses the boundary unchanged. */
  lane?: QuoteLane;
}

export function toPublicQuote(quote: Quote, responseMins: number): PublicQuote {
  return {
    id: quote.id,
    leadId: quote.leadId,
    moverId: quote.moverId,
    kind: quote.kind,
    mode: quote.mode,
    transitDays: quote.transitDays,
    pickupWindow: quote.pickupWindow,
    deliveryWindow: quote.deliveryWindow,
    matchScore: quote.matchScore,
    matchReasons: quote.matchReasons,
    co2Kg: quote.co2Kg,
    responseMins,
    lane: quote.lane,
  };
}

export type SortKey = "best" | "fastest" | "rating" | "replies";

export interface QuoteFilters {
  modes: TransportMode[];
  minRating: number;
  instantOnly: boolean;
  needs: Array<"packing" | "storage" | "customs" | "vehicle" | "piano" | "cleaning">;
}

/* ------------------------------------------------------------------ *
 * Search stream protocol
 * ------------------------------------------------------------------ */

/**
 * Values a stage's text is built from.
 *
 * The route handler has no locale — route handlers cannot read root params —
 * so it ships the *ingredients* rather than only the finished English
 * sentence, and the client assembles the narration in the reader's language.
 * `label` and `detail` remain as an English fallback for any consumer that is
 * not the UI (logs, a future webhook) and for stage ids the client does not
 * recognise.
 */
export interface StageParams {
  fromCode?: string;
  toCode?: string;
  fromCountry?: string;
  toCountry?: string;
  corridorId?: string;
  corridorLabel?: string;
  coreCorridor?: boolean;
  transitDays?: [number, number];
  count?: number;
  date?: string;
}

export type SearchEvent =
  | { type: "open"; leadId: string; corridor: string; partnersScanned: number; startedAt: number }
  | {
      type: "stage";
      id: string;
      label: string;
      detail: string;
      progress: number;
      params?: StageParams;
    }
  | { type: "quote"; quote: PublicQuote; index: number; total: number }
  | {
      type: "done";
      total: number;
      instant: number;
      fastestDays: number;
      elapsedMs: number;
    };
