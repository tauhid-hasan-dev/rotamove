import { CITIES, cityCountry, getCity } from "@/lib/geo";
import { leadFeeUsd, leadQualityScore } from "@/lib/plans";
import { estimateVolume } from "@/lib/pricing";
import { createRng } from "@/lib/rand";
import type { Lead, PropertySize } from "@/lib/types";

/**
 * Demo lead board.
 *
 * Deterministic, seeded sample data for the partner dashboard. Generated from
 * a caller-supplied `now` so the server renders exactly what the client would,
 * with no hydration drift.
 */

export type BoardStatus = "new" | "unlocked" | "contacted" | "won" | "lost";

export interface BoardLead {
  lead: Lead;
  feeUsd: number;
  score: number;
  status: BoardStatus;
  /** Minutes since the enquiry landed. */
  ageMins: number;
  /** How many other partners have already bought this lead. */
  competitors: number;
  routeLabel: string;
}

const LANES: Array<[string, string]> = [
  ["IST", "BER"],
  ["IST", "AMS"],
  ["BER", "IST"],
  ["IST", "STO"],
  ["ESB", "MUC"],
  ["ADB", "LON"],
  ["IST", "DXB"],
  ["MOW", "IST"],
  ["IST", "TAS"],
  ["TAS", "IST"],
  ["SOF", "IST"],
  ["IST", "BEG"],
  ["CPH", "IST"],
  ["IST", "MIL"],
  ["VIE", "ESB"],
  ["IST", "ESB"],
  ["ADB", "AYT"],
  ["GYD", "IST"],
  ["IST", "DOH"],
  ["ALA", "IST"],
  ["HAM", "ADB"],
  ["IST", "OSL"],
  ["BUH", "IST"],
  ["IST", "PAR"],
];

const FIRST_NAMES = [
  "Elif", "Mert", "Lena", "Jonas", "Aylin", "Tomas", "Dilara", "Niklas",
  "Sofia", "Emre", "Anna", "Kerem", "Yasmin", "Lukas", "Zeynep", "Oliver",
  "Nur", "Marek", "Deniz", "Hanna", "Rustam", "Ingrid", "Omar", "Selin",
];

const LAST_NAMES = [
  "Yılmaz", "Kaya", "Schmidt", "Bakker", "Nilsson", "Petrov", "Demir", "Koch",
  "Rossi", "Ahmadi", "Larsen", "Aydın", "Novak", "Hansen", "Karimov", "Weber",
  "Çelik", "Jensen", "Popescu", "Öztürk", "Müller", "Ivanova", "Haddad", "Berg",
];

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

const NOTE_POOL = [
  "Third-floor walk-up at origin, lift at destination. Two large wardrobes need dismantling.",
  "Relocating for work, company covers up to €4,000. Need an invoice addressed to the employer.",
  "Fragile items: a glass dining table and about 40 framed prints.",
  "Flexible on the exact day but the flat must be empty before the handover.",
  "We also need the car shipped — a 2019 estate, currently in storage.",
  "Second move with the same household; previous mover damaged a wardrobe so insurance matters.",
  "",
  "",
];

function maskEmail(name: string, rng: ReturnType<typeof createRng>) {
  const domains = ["gmail.com", "outlook.com", "icloud.com", "proton.me", "yandex.com"];
  const slug = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
  return `${slug}${rng.int(1, 99)}@${rng.pick(domains)}`;
}

function phoneFor(iso: string, rng: ReturnType<typeof createRng>) {
  const dial: Record<string, string> = {
    TR: "+90", DE: "+49", NL: "+31", SE: "+46", GB: "+44", AE: "+971",
    RU: "+7", UZ: "+998", BG: "+359", RS: "+381", DK: "+45", IT: "+39",
    AT: "+43", QA: "+974", KZ: "+7", NO: "+47", RO: "+40", FR: "+33",
    AZ: "+994",
  };
  const prefix = dial[iso] ?? "+49";
  return `${prefix} ${rng.int(500, 599)} ${rng.int(100, 999)} ${rng.int(10, 99)} ${rng.int(10, 99)}`;
}

export function generateLeadBoard(now: number, count = 18): BoardLead[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = createRng("board", i);
    const [fromCode, toCode] = LANES[i % LANES.length];
    const from = getCity(fromCode) ?? CITIES[0];
    const to = getCity(toCode) ?? CITIES[1];
    const size = rng.pick(SIZES);
    const volume = Math.round(estimateVolume(size) * rng.range(0.82, 1.22));
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const fullName = `${first} ${last}`;
    const ageMins = Math.round(rng.range(2, 2600) ** 1.02);
    const createdAt = new Date(now - ageMins * 60_000).toISOString();
    const moveDate = new Date(now + rng.int(9, 140) * 86_400_000).toISOString().slice(0, 10);
    const international = from.country !== to.country;

    const lead: Lead = {
      id: `ld_demo_${String(i + 1).padStart(3, "0")}`,
      createdAt,
      moveType: international ? "international" : "domestic",
      origin: {
        cityCode: from.code,
        access: rng.pick(["ground", "lift", "stairs_1_2", "stairs_3_plus"] as const),
        easyParking: rng.bool(0.6),
      },
      destination: {
        cityCode: to.code,
        access: rng.pick(["ground", "lift", "stairs_1_2", "stairs_3_plus"] as const),
        easyParking: rng.bool(0.65),
      },
      moveDate,
      flexibility: rng.pick(["exact", "plus_minus_3", "within_2_weeks", "flexible"] as const),
      propertySize: size,
      volumeM3: volume,
      serviceLevel: rng.pick(["full_service", "door_to_door", "transport_only"] as const),
      specialItems: {
        piano: rng.bool(0.08),
        vehicle: rng.bool(0.12),
        artwork: rng.bool(0.14),
        safe: rng.bool(0.06),
        gym: rng.bool(0.1),
        plants: rng.bool(0.16),
      },
      extras: {
        packing: rng.bool(0.58),
        unpacking: rng.bool(0.3),
        dismantling: rng.bool(0.46),
        storageWeeks: rng.bool(0.22) ? rng.int(1, 8) : 0,
        insurance: rng.bool(0.52),
        customsClearance: international && rng.bool(0.42),
        cleaning: rng.bool(0.2),
      },
      contact: {
        fullName,
        email: maskEmail(first + last, rng),
        phone: phoneFor(from.country, rng),
        channel: rng.pick(["phone", "whatsapp", "email"] as const),
        locale: from.country === "TR" ? "tr" : "en",
      },
      // Indexed rather than sampled: a pure draw clusters, and two adjacent
      // leads carrying the identical note reads as broken data.
      notes: NOTE_POOL[(i * 3 + 1) % NOTE_POOL.length] || undefined,
      consent: true,
    };

    const status: BoardStatus =
      ageMins < 45
        ? "new"
        : rng.pick([
            "new",
            "unlocked",
            "unlocked",
            "contacted",
            "contacted",
            "won",
            "lost",
          ] as const);

    return {
      lead,
      feeUsd: leadFeeUsd(lead),
      score: leadQualityScore(lead),
      status,
      ageMins,
      competitors: status === "new" ? rng.int(0, 2) : rng.int(1, 5),
      routeLabel: `${from.name}, ${cityCountry(from).iso} → ${to.name}, ${cityCountry(to).iso}`,
    };
  }).sort((a, b) => a.ageMins - b.ageMins);
}

export interface PartnerMetrics {
  leadsThisMonth: number;
  unlocked: number;
  quoted: number;
  won: number;
  winRate: number;
  revenueEur: number;
  spendUsd: number;
  roi: number;
  avgResponseMins: number;
  corridorSplit: Array<{ corridor: string; leads: number; won: number }>;
  weekly: Array<{ week: string; leads: number; won: number; revenue: number }>;
}

export function generatePartnerMetrics(planIsPro: boolean): PartnerMetrics {
  const rng = createRng("metrics", planIsPro ? "pro" : "ppl");
  const leadsThisMonth = planIsPro ? 312 : 47;
  const unlocked = planIsPro ? 312 : 31;
  const quoted = Math.round(unlocked * 0.78);
  const won = Math.round(quoted * (planIsPro ? 0.19 : 0.16));
  const revenueEur = won * rng.int(1900, 2600);
  const spendUsd = planIsPro ? 100 : Math.round(unlocked * 5.2 * 100) / 100;

  return {
    leadsThisMonth,
    unlocked,
    quoted,
    won,
    winRate: won / Math.max(1, quoted),
    revenueEur,
    spendUsd,
    // Return on platform spend measured on gross profit, not turnover — the
    // turnover figure flatters a flat-fee plan to the point of absurdity.
    roi: (revenueEur * 0.26) / Math.max(1, spendUsd / 1.08),
    avgResponseMins: planIsPro ? 12 : 41,
    corridorSplit: [
      { corridor: "TR → EU-West", leads: Math.round(leadsThisMonth * 0.34), won: Math.round(won * 0.36) },
      { corridor: "EU-West → TR", leads: Math.round(leadsThisMonth * 0.22), won: Math.round(won * 0.2) },
      { corridor: "TR → Nordics", leads: Math.round(leadsThisMonth * 0.14), won: Math.round(won * 0.14) },
      { corridor: "TR → Gulf", leads: Math.round(leadsThisMonth * 0.12), won: Math.round(won * 0.12) },
      { corridor: "TR → Central Asia", leads: Math.round(leadsThisMonth * 0.09), won: Math.round(won * 0.08) },
      { corridor: "Domestic TR", leads: Math.round(leadsThisMonth * 0.09), won: Math.round(won * 0.1) },
    ],
    weekly: ["W-5", "W-4", "W-3", "W-2", "W-1", "Now"].map((week, i) => {
      const leads = Math.round((leadsThisMonth / 6) * rng.range(0.78, 1.26) * (1 + i * 0.04));
      const w = Math.round(leads * (planIsPro ? 0.15 : 0.11) * rng.range(0.7, 1.4));
      return { week, leads, won: w, revenue: w * rng.int(1900, 2600) };
    }),
  };
}
