import {
  cityCountry,
  getCity,
  resolveCorridor,
  roadKm,
  type City,
  type Corridor,
  type TransportMode,
} from "@/lib/geo";
import type { AccessType, Lead, PriceLine, PropertySize } from "@/lib/types";

/**
 * Quote engine.
 *
 * Produces a *reference* price for a move — the number a well-run mover with a
 * neutral rate card would charge. Each partner then applies their own price
 * index on top (see matching.ts). Every rate below is expressed per m³, which
 * is how the household-goods trade actually quotes.
 *
 * All money in EUR.
 */

export const VOLUME_BY_SIZE: Record<PropertySize, number> = {
  few_items: 8,
  studio: 16,
  one_bed: 24,
  two_bed: 38,
  three_bed: 55,
  four_bed: 72,
  villa: 95,
  office: 60,
  ltl: 30,
  ftl: 90,
  project: 50,
  reefer: 40,
};

export const PROPERTY_SIZES: Array<{
  id: PropertySize;
  label: string;
  hint: string;
  volume: number;
}> = [
  { id: "few_items", label: "A few items", hint: "Boxes, a bed, no furniture set", volume: 8 },
  { id: "studio", label: "Studio / 1+0", hint: "~45 m² home", volume: 16 },
  { id: "one_bed", label: "1 bedroom / 1+1", hint: "~65 m² home", volume: 24 },
  { id: "two_bed", label: "2 bedrooms / 2+1", hint: "~95 m² home", volume: 38 },
  { id: "three_bed", label: "3 bedrooms / 3+1", hint: "~130 m² home", volume: 55 },
  { id: "four_bed", label: "4+ bedrooms", hint: "~170 m² home", volume: 72 },
  { id: "villa", label: "Villa / detached", hint: "220 m² and up", volume: 95 },
  { id: "office", label: "Office / commercial", hint: "Desks, IT, archive", volume: 60 },
  {
    id: "ltl",
    label: "LTL — Less than truckload",
    hint: "Part load, pays for the space it uses",
    volume: 30,
  },
  { id: "ftl", label: "FTL — Full truckload", hint: "A dedicated trailer, direct run", volume: 90 },
  {
    id: "project",
    label: "Specialized Project Transport",
    hint: "Turbine, yacht, boat, cars",
    volume: 50,
  },
  {
    id: "reefer",
    label: "Refrigerated Transport (Frigo)",
    hint: "Chilled or frozen, temperature logged",
    volume: 40,
  },
];

/** Per m³, per 1 000 km. */
const MODE_RATES: Record<TransportMode, { perM3Per1000Km: number; fixed: number; minKm: number }> = {
  road: { perM3Per1000Km: 13.4, fixed: 180, minKm: 0 },
  rail: { perM3Per1000Km: 9.6, fixed: 390, minKm: 2200 },
  sea: { perM3Per1000Km: 7.2, fixed: 460, minKm: 1800 },
  air: { perM3Per1000Km: 88, fixed: 310, minKm: 600 },
};

/** kg CO₂e per m³ per km. */
const CO2_FACTOR: Record<TransportMode, number> = {
  road: 0.017,
  rail: 0.0042,
  sea: 0.0031,
  air: 0.17,
};

const ACCESS_SURCHARGE: Record<AccessType, number> = {
  ground: 0,
  lift: 0.4,
  stairs_1_2: 2.6,
  stairs_3_plus: 5.4,
};

export const ACCESS_OPTIONS: Array<{ id: AccessType; label: string; hint: string }> = [
  { id: "ground", label: "Ground floor", hint: "No stairs at all" },
  { id: "lift", label: "Lift available", hint: "Goods lift or passenger lift" },
  { id: "stairs_1_2", label: "Stairs, 1–2 floors", hint: "No lift" },
  { id: "stairs_3_plus", label: "Stairs, 3+ floors", hint: "No lift, high floor" },
];

const CUSTOMS_FEE = [0, 120, 240, 420];

export const SPECIAL_ITEM_PRICES = {
  piano: 320,
  vehicle: 980,
  artwork: 210,
  safe: 260,
  gym: 150,
  plants: 60,
} as const;

export const SPECIAL_ITEM_LABELS = {
  piano: "Piano",
  vehicle: "Car or motorbike",
  artwork: "Art or antiques",
  safe: "Safe over 100 kg",
  gym: "Gym equipment",
  plants: "Large plants",
} as const;

/** June–September is peak across every corridor we run. */
function seasonalityMultiplier(moveDate: string): { factor: number; reason: string | null } {
  const month = new Date(moveDate).getMonth();
  if (Number.isNaN(month)) return { factor: 1, reason: null };
  if (month >= 5 && month <= 8) return { factor: 1.12, reason: "Peak season (Jun–Sep)" };
  if (month === 11) return { factor: 1.06, reason: "Year-end demand" };
  if (month === 0 || month === 1) return { factor: 0.94, reason: "Off-peak discount" };
  return { factor: 1, reason: null };
}

function urgencyMultiplier(moveDate: string): { factor: number; reason: string | null } {
  const days = Math.round((new Date(moveDate).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return { factor: 1, reason: null };
  if (days <= 10) return { factor: 1.14, reason: "Short notice (under 10 days)" };
  if (days <= 21) return { factor: 1.06, reason: "Tight lead time" };
  if (days >= 120) return { factor: 0.95, reason: "Booked well ahead" };
  return { factor: 1, reason: null };
}

export function pickModes(corridor: Corridor, km: number, volumeM3: number): TransportMode[] {
  const viable = corridor.modes.filter((mode) => km >= MODE_RATES[mode].minKm);
  // Air only makes commercial sense for small consignments.
  const filtered = viable.filter((mode) => (mode === "air" ? volumeM3 <= 22 : true));
  const list = filtered.length ? filtered : ["road" as TransportMode];
  return [...new Set(list)];
}

export interface QuoteBasis {
  from: City;
  to: City;
  corridor: Corridor;
  km: number;
  volumeM3: number;
  modes: TransportMode[];
  seasonality: { factor: number; reason: string | null };
  urgency: { factor: number; reason: string | null };
  customsEur: number;
  crossBorder: boolean;
}

export function buildQuoteBasis(lead: Lead): QuoteBasis | null {
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return null;

  const corridor = resolveCorridor(from, to);
  const km = Math.max(18, roadKm(from, to));
  const volumeM3 = Math.max(4, Math.round(lead.volumeM3));
  const fromCountry = cityCountry(from);
  const toCountry = cityCountry(to);
  const crossBorder = fromCountry.iso !== toCountry.iso;
  const bothEu = fromCountry.eu && toCountry.eu;

  const customsEur = !crossBorder
    ? 0
    : bothEu
      ? 0
      : CUSTOMS_FEE[fromCountry.customs] * 0.4 + CUSTOMS_FEE[toCountry.customs] * 0.6;

  return {
    from,
    to,
    corridor,
    km,
    volumeM3,
    modes: pickModes(corridor, km, volumeM3),
    seasonality: seasonalityMultiplier(lead.moveDate),
    urgency: urgencyMultiplier(lead.moveDate),
    customsEur: Math.round(customsEur),
    crossBorder,
  };
}

export interface ReferenceQuote {
  lines: PriceLine[];
  subtotal: number;
  total: number;
  co2Kg: number;
  notes: string[];
}

/**
 * Reference price for one transport mode. Partner-specific indexing happens
 * later so that the breakdown the customer sees stays explainable.
 */
export function referenceQuote(
  lead: Lead,
  basis: QuoteBasis,
  mode: TransportMode,
): ReferenceQuote {
  const { volumeM3, km } = basis;
  const rate = MODE_RATES[mode];
  const lines: PriceLine[] = [];
  const notes: string[] = [];

  const lineHaul = Math.round(volumeM3 * rate.perM3Per1000Km * (km / 1000) + rate.fixed);
  lines.push({
    key: "linehaul",
    label:
      mode === "road"
        ? "Road line-haul"
        : mode === "sea"
          ? "Ocean freight (LCL)"
          : mode === "air"
            ? "Air freight"
            : "Rail block train",
    amount: lineHaul,
  });

  // Loading / unloading crew, trolleys, protection, floor runners.
  const handlingBase = volumeM3 * 9.2;
  const accessExtra =
    volumeM3 *
    (ACCESS_SURCHARGE[lead.origin.access] + ACCESS_SURCHARGE[lead.destination.access]);
  const parkingExtra =
    (lead.origin.easyParking ? 0 : 95) + (lead.destination.easyParking ? 0 : 95);
  const handling = Math.round(handlingBase + accessExtra + parkingExtra);
  lines.push({ key: "handling", label: "Loading, carry & unloading crew", amount: handling });
  if (accessExtra > 40) notes.push("Stair carry surcharge applied");
  if (parkingExtra > 0) notes.push("Shuttle van needed — restricted parking");

  if (lead.serviceLevel !== "transport_only") {
    const materials = Math.round(volumeM3 * 4.1 + 48);
    lines.push({ key: "materials", label: "Export wrap & materials", amount: materials });
  }

  if (basis.customsEur > 0) {
    lines.push({
      key: "customs",
      label: "Customs documentation & border fees",
      amount: basis.customsEur,
    });
  }

  if (lead.extras.packing) {
    lines.push({
      key: "packing",
      label: "Professional packing",
      amount: Math.round(volumeM3 * 11.5),
    });
  }
  if (lead.extras.unpacking) {
    lines.push({ key: "unpacking", label: "Unpacking & debris removal", amount: Math.round(volumeM3 * 6.2) });
  }
  if (lead.extras.dismantling) {
    lines.push({
      key: "dismantling",
      label: "Furniture dismantle & rebuild",
      amount: Math.round(95 + volumeM3 * 1.8),
    });
  }
  if (lead.extras.storageWeeks > 0) {
    lines.push({
      key: "storage",
      label: `Bonded storage, ${lead.extras.storageWeeks} week${lead.extras.storageWeeks > 1 ? "s" : ""}`,
      amount: Math.round(volumeM3 * 3.4 * lead.extras.storageWeeks + 60),
    });
  }
  if (lead.extras.insurance) {
    lines.push({
      key: "insurance",
      label: "All-risk transit cover",
      amount: Math.round(Math.max(90, volumeM3 * 7.4)),
    });
  }
  if (lead.extras.customsClearance) {
    lines.push({ key: "clearance", label: "Customs brokerage (both ends)", amount: 185 });
  }
  if (lead.extras.cleaning) {
    lines.push({ key: "cleaning", label: "End-of-tenancy cleaning", amount: 140 });
  }

  let specialTotal = 0;
  (Object.keys(SPECIAL_ITEM_PRICES) as Array<keyof typeof SPECIAL_ITEM_PRICES>).forEach((key) => {
    if (lead.specialItems[key]) specialTotal += SPECIAL_ITEM_PRICES[key];
  });
  if (specialTotal > 0) {
    lines.push({ key: "special", label: "Specialist item handling", amount: specialTotal });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

  const multiplier = basis.seasonality.factor * basis.urgency.factor;
  if (basis.seasonality.reason) notes.push(basis.seasonality.reason);
  if (basis.urgency.reason) notes.push(basis.urgency.reason);

  const total = Math.round(subtotal * multiplier);
  const co2Kg = Math.round(volumeM3 * km * CO2_FACTOR[mode]);

  return { lines, subtotal, total, co2Kg, notes };
}

export function transitDaysFor(
  corridor: Corridor,
  mode: TransportMode,
  speedIndex: number,
): [number, number] {
  const [lo, hi] = corridor.transitDays;
  const modeFactor = mode === "air" ? 0.3 : mode === "sea" ? 1.75 : mode === "rail" ? 1.25 : 1;
  const min = Math.max(1, Math.round(lo * modeFactor * speedIndex));
  const max = Math.max(min + 1, Math.round(hi * modeFactor * speedIndex));
  return [min, max];
}

export function estimateVolume(size: PropertySize): number {
  return VOLUME_BY_SIZE[size];
}

/** Rough national-average benchmark used for the "you save" anchor. */
export function brokerAnchor(total: number, crossBorder: boolean): number {
  return Math.round(total * (crossBorder ? 1.31 : 1.22));
}
