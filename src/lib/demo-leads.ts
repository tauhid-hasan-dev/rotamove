import { CITIES, cityCountry, getCity } from "@/lib/geo";
import { AVG_LEAD_FEE_EUR, PRO_MONTHLY_EUR, leadFeeEur, leadQualityScore } from "@/lib/plans";
import { estimateVolume } from "@/lib/pricing";
import { createRng } from "@/lib/rand";
import type { Lead, PlanId, PropertySize } from "@/lib/types";

/**
 * Demo lead board.
 *
 * Deterministic, seeded sample data for the partner dashboard. Generated from
 * a caller-supplied `now` so the server renders exactly what the client would,
 * with no hydration drift.
 */

/**
 * A lead is either waiting to be opened, or opened.
 *
 * The board used to carry "quoted", "won" and "lost" as well, which implied an
 * outcome pipeline nothing in the product actually updates. What it can
 * measure honestly is how quickly a partner acts on a lead, so unlocking is
 * the only transition.
 */
export type BoardStatus = "new" | "unlocked";

export interface BoardLead {
  lead: Lead;
  feeEur: number;
  score: number;
  status: BoardStatus;
  /** Minutes since the enquiry landed. */
  ageMins: number;
  /** How many other partners have already bought this lead. */
  competitors: number;
  routeLabel: string;
}

/**
 * The corridors this demo account works.
 *
 * Exported because the archive draws on it too: a partner's filed leads have
 * to run the same lanes as the ones on their board today, and two lists would
 * drift the first time one of them gained a route.
 */
export const DEMO_LANES: ReadonlyArray<readonly [string, string]> = [
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
  "project",
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
    const [fromCode, toCode] = DEMO_LANES[i % DEMO_LANES.length];
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
        // Seed leads represent enquiries that already came through the wizard,
        // which cannot submit without both codes confirmed.
        emailVerified: true,
        phoneVerified: true,
      },
      // Seed enquiries came through the wizard, where five is the default.
      preferredMatches: rng.pick([2, 5, null] as const),
      // Indexed rather than sampled: a pure draw clusters, and two adjacent
      // leads carrying the identical note reads as broken data.
      notes: NOTE_POOL[(i * 3 + 1) % NOTE_POOL.length] || undefined,
      consent: true,
    };

    // Anything under 45 minutes old is still fresh; older leads are a mix, so
    // the board shows both states on first load.
    const status: BoardStatus =
      ageMins < 45 ? "new" : rng.pick(["new", "unlocked", "unlocked"] as const);

    return {
      lead,
      feeEur: leadFeeEur(lead),
      score: leadQualityScore(lead),
      status,
      ageMins,
      competitors: status === "new" ? rng.int(0, 2) : rng.int(1, 5),
      routeLabel: `${from.name}, ${cityCountry(from).iso} → ${to.name}, ${cityCountry(to).iso}`,
    };
  }).sort((a, b) => a.ageMins - b.ageMins);
}

/**
 * What the dashboard can state as fact.
 *
 * Win rates, revenue and ROI came out of this type along with the charts that
 * displayed them: the platform never sees whether a partner won the job, so
 * every one of those figures was invented. What is left is what the lead board
 * genuinely knows.
 *
 * `avgResponseMins` went the same way. It drove an "Avg. reply time" card on
 * the overview, and the platform does not observe when a partner replies —
 * only when they open a lead. A number inferred from the second and labelled
 * as the first is the one kind of figure this type exists to keep out.
 */
export interface PartnerMetrics {
  leadsThisMonth: number;
  unlocked: number;
  spendEur: number;
}

export function generatePartnerMetrics(plan: PlanId): PartnerMetrics {
  if (plan === "pro_unlimited") {
    return { leadsThisMonth: 312, unlocked: 312, spendEur: PRO_MONTHLY_EUR };
  }
  // Pay-per-seen partners browse a masked board, so they open fewer leads
  // than pay-per-lead partners who see the full details up front.
  const unlocked = plan === "pay_per_seen" ? 9 : 31;
  return {
    leadsThisMonth: plan === "pay_per_seen" ? 54 : 47,
    unlocked,
    spendEur: Math.round(unlocked * AVG_LEAD_FEE_EUR * 100) / 100,
  };
}
