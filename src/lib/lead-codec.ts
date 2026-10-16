import type {
  AccessType,
  DateFlexibility,
  ExtraServices,
  Lead,
  MoveType,
  PropertySize,
  ServiceLevel,
  SpecialItems,
} from "@/lib/types";

/**
 * Results-URL codec.
 *
 * A results page has to survive a refresh, a shared link and a cold serverless
 * instance. We therefore encode the *move specification* into the URL — and
 * deliberately nothing else. Name, email and phone stay server-side: putting
 * personal data in a URL leaks it into browser history, referrer headers and
 * analytics, which is exactly the kind of thing a lead marketplace must not do.
 */

const ACCESS: AccessType[] = ["ground", "lift", "stairs_1_2", "stairs_3_plus"];
const FLEX: DateFlexibility[] = ["exact", "plus_minus_3", "within_2_weeks", "flexible"];
const SIZES: PropertySize[] = [
  "few_items",
  "studio",
  "one_bed",
  "two_bed",
  "three_bed",
  "four_bed",
  "villa",
  "office",
];
const LEVELS: ServiceLevel[] = ["full_service", "door_to_door", "transport_only"];
const SPECIAL_KEYS: Array<keyof SpecialItems> = [
  "piano",
  "vehicle",
  "artwork",
  "safe",
  "gym",
  "plants",
];
const EXTRA_FLAGS: Array<keyof Omit<ExtraServices, "storageWeeks">> = [
  "packing",
  "unpacking",
  "dismantling",
  "insurance",
  "customsClearance",
  "cleaning",
];

function packBits(flags: boolean[]): number {
  return flags.reduce((acc, on, i) => (on ? acc | (1 << i) : acc), 0);
}

function unpackBits(value: number, count: number): boolean[] {
  return Array.from({ length: count }, (_, i) => Boolean(value & (1 << i)));
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, "base64").toString("utf8");
}

/** Compact positional tuple — keeps the URL short and stable. */
type Packed = [
  v: 1,
  moveType: 0 | 1,
  originCity: string,
  originAccess: number,
  originParking: 0 | 1,
  destCity: string,
  destAccess: number,
  destParking: 0 | 1,
  moveDate: string,
  flexibility: number,
  size: number,
  volume: number,
  level: number,
  specialBits: number,
  extraBits: number,
  storageWeeks: number,
];

export function encodeMoveSpec(lead: Pick<
  Lead,
  | "moveType"
  | "origin"
  | "destination"
  | "moveDate"
  | "flexibility"
  | "propertySize"
  | "volumeM3"
  | "serviceLevel"
  | "specialItems"
  | "extras"
>): string {
  const packed: Packed = [
    1,
    lead.moveType === "international" ? 1 : 0,
    lead.origin.cityCode,
    ACCESS.indexOf(lead.origin.access),
    lead.origin.easyParking ? 1 : 0,
    lead.destination.cityCode,
    ACCESS.indexOf(lead.destination.access),
    lead.destination.easyParking ? 1 : 0,
    lead.moveDate,
    FLEX.indexOf(lead.flexibility),
    SIZES.indexOf(lead.propertySize),
    Math.round(lead.volumeM3),
    LEVELS.indexOf(lead.serviceLevel),
    packBits(SPECIAL_KEYS.map((k) => lead.specialItems[k])),
    packBits(EXTRA_FLAGS.map((k) => lead.extras[k])),
    lead.extras.storageWeeks,
  ];
  return toBase64Url(JSON.stringify(packed));
}

export interface DecodedMoveSpec {
  moveType: MoveType;
  origin: Lead["origin"];
  destination: Lead["destination"];
  moveDate: string;
  flexibility: DateFlexibility;
  propertySize: PropertySize;
  volumeM3: number;
  serviceLevel: ServiceLevel;
  specialItems: SpecialItems;
  extras: ExtraServices;
}

export function decodeMoveSpec(token: string): DecodedMoveSpec | null {
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as Packed;
    if (!Array.isArray(parsed) || parsed[0] !== 1) return null;
    const [
      ,
      moveType,
      originCity,
      originAccess,
      originParking,
      destCity,
      destAccess,
      destParking,
      moveDate,
      flexibility,
      size,
      volume,
      level,
      specialBits,
      extraBits,
      storageWeeks,
    ] = parsed;

    const specialFlags = unpackBits(specialBits, SPECIAL_KEYS.length);
    const extraFlags = unpackBits(extraBits, EXTRA_FLAGS.length);

    const specialItems = SPECIAL_KEYS.reduce((acc, key, i) => {
      acc[key] = specialFlags[i];
      return acc;
    }, {} as SpecialItems);

    const extras = EXTRA_FLAGS.reduce(
      (acc, key, i) => {
        acc[key] = extraFlags[i];
        return acc;
      },
      { storageWeeks } as ExtraServices,
    );

    return {
      moveType: moveType === 1 ? "international" : "domestic",
      origin: {
        cityCode: originCity,
        access: ACCESS[originAccess] ?? "ground",
        easyParking: originParking === 1,
      },
      destination: {
        cityCode: destCity,
        access: ACCESS[destAccess] ?? "ground",
        easyParking: destParking === 1,
      },
      moveDate,
      flexibility: FLEX[flexibility] ?? "flexible",
      propertySize: SIZES[size] ?? "two_bed",
      volumeM3: volume,
      serviceLevel: LEVELS[level] ?? "door_to_door",
      specialItems,
      extras,
    };
  } catch {
    return null;
  }
}

/** Rehydrate a quotable Lead from a URL token. Contact details stay empty. */
export function leadFromToken(id: string, token: string): Lead | null {
  const spec = decodeMoveSpec(token);
  if (!spec) return null;
  return {
    id,
    createdAt: new Date().toISOString(),
    ...spec,
    contact: {
      fullName: "",
      email: "",
      phone: "",
      channel: "phone",
      locale: "en",
    },
    consent: true,
  };
}
