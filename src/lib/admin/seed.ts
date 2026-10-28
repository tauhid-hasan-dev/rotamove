import { CITIES, cityCountry, cityRegion, getCity, isCoreCorridor, resolveCorridor } from "@/lib/geo";
import { MOVERS } from "@/lib/movers";
import {
  LEAD_FEE_CAP_USD,
  LEAD_FEE_FLOOR_USD,
  PRO_MONTHLY_USD,
  paysPerUnlock,
} from "@/lib/plans";
import { estimateVolume } from "@/lib/pricing";
import { createRng, type Rng } from "@/lib/rand";
import type { Lead, Mover, PropertySize } from "@/lib/types";
import type {
  AcquisitionChannel,
  AdminCompany,
  AdminDataset,
  AdminLead,
  AuditEntry,
  Campaign,
  ChannelDayStats,
  CompanyStatus,
  CreditEntry,
  DeliveryStatus,
  Invoice,
  InvoiceLine,
  LeadAssignment,
  LeadStatus,
  Payment,
  PermissionKey,
  RoleDef,
  StatusEvent,
  TeamMember,
  TrafficDay,
} from "@/lib/admin/types";
import { ADMIN_ROLE_ID, CHANNELS, PERMISSION_KEYS } from "@/lib/admin/types";

/* ======================================================================== *
 *  Seeded prototype dataset — DEMO DATA, no backend behind it.
 *
 *  Deterministic for a given anchor date: the server and the client build
 *  byte-identical data, so there is no hydration drift and no payload to
 *  serialise. Everything derives from the real domain layer — the same
 *  cities, corridors, partners and fee rules the public site uses — so the
 *  admin numbers reconcile with the product they claim to describe.
 * ======================================================================== */

const DAY = 86_400_000;
const WINDOW_DAYS = 365;

const ACTOR_SYSTEM = "System";
const ACTOR_ADMIN = "Demo Admin";

/** yyyy-mm-dd in UTC — all seed math runs in UTC so every machine agrees. */
function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function isoAt(ms: number): string {
  return new Date(ms).toISOString();
}

/* ------------------------------------------------------------------ *
 * Lead generation
 * ------------------------------------------------------------------ */

const LANES: Array<[string, string]> = [
  ["IST", "BER"], ["IST", "AMS"], ["BER", "IST"], ["ESB", "MUC"],
  ["ADB", "LON"], ["IST", "DXB"], ["IST", "MIL"], ["VIE", "ESB"],
  ["IST", "ESB"], ["ADB", "AYT"], ["IST", "PAR"], ["HAM", "ADB"],
  ["IST", "FRA"], ["MUC", "IST"], ["IST", "ZRH"], ["AYT", "BER"],
  ["IST", "ROM"], ["BTZ", "CGN"], ["IST", "BCN"], ["ESB", "VIE"],
  ["IST", "ATH"], ["ADB", "RTM"], ["IST", "BRU"], ["GZT", "IST"],
];

const FIRST_NAMES = [
  "Elif", "Mert", "Lena", "Jonas", "Aylin", "Tomas", "Dilara", "Niklas",
  "Sofia", "Emre", "Anna", "Kerem", "Yasmin", "Lukas", "Zeynep", "Oliver",
  "Nur", "Marek", "Deniz", "Hanna", "Rustam", "Ingrid", "Omar", "Selin",
  "Mateo", "Clara", "Baran", "Petra", "Timur", "Eva",
];

const LAST_NAMES = [
  "Yilmaz", "Kaya", "Schmidt", "Bakker", "Nilsson", "Petrov", "Demir", "Koch",
  "Rossi", "Ahmadi", "Larsen", "Aydin", "Novak", "Hansen", "Karimov", "Weber",
  "Celik", "Jensen", "Popescu", "Ozturk", "Muller", "Ivanova", "Haddad", "Berg",
];

const SIZES: PropertySize[] = [
  "few_items", "studio", "one_bed", "two_bed",
  "three_bed", "four_bed", "villa", "office", "project",
];

const NOTE_POOL = [
  "Third-floor walk-up at origin, lift at destination. Two large wardrobes need dismantling.",
  "Relocating for work, company covers up to 4,000 EUR. Need an invoice addressed to the employer.",
  "Fragile items: a glass dining table and about 40 framed prints.",
  "Flexible on the exact day but the flat must be empty before the handover.",
  "We also need the car shipped - a 2019 estate, currently in storage.",
  "Second move with the same household; insurance matters this time.",
  "",
  "",
  "",
];

export const LANDING_PAGES = ["/quote", "/", "/coverage", "/how-it-works", "/partners"] as const;

export const SEED_CAMPAIGNS: Campaign[] = [
  { id: "cmp_tr_de", name: "TR to DE - Search", channel: "paid_search", startedAt: "2025-01-14" },
  { id: "cmp_umzug", name: "Umzug Istanbul", channel: "paid_search", startedAt: "2025-03-02" },
  { id: "cmp_dubai", name: "Move to Dubai", channel: "paid_search", startedAt: "2025-06-20" },
  { id: "cmp_spring", name: "Spring Moves", channel: "social", startedAt: "2025-02-10" },
  { id: "cmp_expat", name: "Expat Stories", channel: "social", startedAt: "2025-08-01" },
];

/** Channel mix (weights sum to 1) and the visit-to-lead rate each converts at. */
const CHANNEL_PROFILE: Record<AcquisitionChannel, { weight: number; conversion: number }> = {
  organic: { weight: 0.34, conversion: 0.024 },
  paid_search: { weight: 0.26, conversion: 0.036 },
  referral: { weight: 0.12, conversion: 0.041 },
  direct: { weight: 0.18, conversion: 0.016 },
  social: { weight: 0.1, conversion: 0.011 },
};

function pickChannel(rng: Rng): AcquisitionChannel {
  const roll = rng.next();
  let cumulative = 0;
  for (const channel of CHANNELS) {
    cumulative += CHANNEL_PROFILE[channel].weight;
    if (roll < cumulative) return channel;
  }
  return "organic";
}

function maskEmail(name: string, rng: Rng): string {
  const domains = ["gmail.com", "outlook.com", "icloud.com", "proton.me", "yandex.com"];
  const slug = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
  return `${slug}${rng.int(1, 99)}@${rng.pick(domains)}`;
}

function phoneFor(iso: string, rng: Rng): string {
  const dial: Record<string, string> = {
    TR: "+90", DE: "+49", NL: "+31", SE: "+46", GB: "+44", AE: "+971",
    RU: "+7", UZ: "+998", BG: "+359", RS: "+381", DK: "+45", IT: "+39",
    AT: "+43", QA: "+974", KZ: "+7", NO: "+47", RO: "+40", FR: "+33",
    CH: "+41", ES: "+34", GR: "+30", BE: "+32",
  };
  const prefix = dial[iso] ?? "+49";
  return `${prefix} ${rng.int(500, 599)} ${rng.int(100, 999)} ${rng.int(10, 99)} ${rng.int(10, 99)}`;
}

/**
 * Anchored twin of `plans.leadFeeUsd`: same rules, but "now" is the dataset
 * anchor rather than the wall clock, so the seed never shifts mid-session.
 */
function feeFor(lead: Lead, anchorMs: number): number {
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return LEAD_FEE_FLOOR_USD;

  const corridor = resolveCorridor(from, to);
  let fee = lead.moveType === "international" ? 3.6 : 2.1;
  fee += Math.min(1.8, (lead.volumeM3 / 70) * 1.8);
  if (isCoreCorridor(corridor)) fee += 0.5;

  const destRegion = cityRegion(to);
  if (destRegion === "CENTRAL_ASIA" || destRegion === "CIS") fee += 0.7;
  if (destRegion === "MIDDLE_EAST" || destRegion === "NORDICS") fee += 0.4;

  if (lead.serviceLevel === "full_service") fee += 0.6;
  if (lead.extras.storageWeeks > 0) fee += 0.25;
  if (lead.extras.customsClearance) fee += 0.25;
  if (lead.specialItems.vehicle || lead.specialItems.piano) fee += 0.3;

  const daysOut = Math.max(0, Math.round((Date.parse(lead.moveDate) - anchorMs) / DAY));
  if (daysOut <= 30) fee += 0.4;
  else if (daysOut > 120) fee -= 0.5;

  return Math.round(Math.min(LEAD_FEE_CAP_USD, Math.max(LEAD_FEE_FLOOR_USD, fee)) * 100) / 100;
}

/** Anchored twin of `plans.leadQualityScore`. */
function scoreFor(lead: Lead, anchorMs: number): number {
  let score = 42;
  if (lead.contact.phone.replace(/\D/g, "").length >= 10) score += 14;
  if (lead.contact.email.includes("@")) score += 8;
  if (lead.volumeM3 >= 25) score += 10;
  if (lead.flexibility === "exact" || lead.flexibility === "plus_minus_3") score += 9;
  if (lead.serviceLevel === "full_service") score += 7;
  if (lead.notes && lead.notes.length > 24) score += 5;
  if (lead.extras.insurance) score += 3;

  const daysOut = Math.round((Date.parse(lead.moveDate) - anchorMs) / DAY);
  if (daysOut <= 45 && daysOut >= 0) score += 8;
  if (daysOut > 150) score -= 10;

  return Math.max(12, Math.min(99, Math.round(score)));
}

/** How many enquiries land on a given day: growth + weekday + summer shape. */
function leadsOnDay(dayIndex: number, dayMs: number, rng: Rng): number {
  const date = new Date(dayMs);
  const weekday = date.getUTCDay();
  const month = date.getUTCMonth();

  const growth = 0.8 + (dayIndex / WINDOW_DAYS) * 0.8; // the platform is growing
  const weekdayFactor = [0.55, 1.25, 1.2, 1.05, 1.0, 0.95, 0.7][weekday];
  const seasonFactor = month >= 4 && month <= 8 ? 1.35 : 1.0;

  const expected = 1.15 * growth * weekdayFactor * seasonFactor;
  const whole = Math.floor(expected);
  return whole + (rng.next() < expected - whole ? 1 : 0) + (rng.bool(0.08) ? 1 : 0);
}

interface GeneratedLead {
  adminLead: AdminLead;
  dayIndex: number;
}

function generateLeads(anchorMs: number, companies: AdminCompany[]): GeneratedLead[] {
  const startMs = anchorMs - (WINDOW_DAYS - 1) * DAY;
  const out: GeneratedLead[] = [];
  let serial = 0;

  for (let dayIndex = 0; dayIndex < WINDOW_DAYS; dayIndex++) {
    const dayMs = startMs + dayIndex * DAY;
    const countRng = createRng("admin-day", dayIndex);
    const count = leadsOnDay(dayIndex, dayMs, countRng);

    for (let k = 0; k < count; k++) {
      serial += 1;
      const rng = createRng("admin-lead", dayIndex, k);
      const id = `ld_${String(serial).padStart(4, "0")}`;

      const [fromCode, toCode] = rng.bool(0.85)
        ? rng.pick(LANES)
        : [rng.pick(CITIES).code, rng.pick(CITIES).code];
      const from = getCity(fromCode) ?? CITIES[0];
      const to = getCity(toCode === fromCode ? "BER" : toCode) ?? CITIES[1];

      const size = rng.pick(SIZES);
      const volume = Math.max(2, Math.round(estimateVolume(size) * rng.range(0.82, 1.22)));
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);
      const createdMs = dayMs + rng.int(7 * 60, 22 * 60) * 60_000;
      const moveMs = createdMs + rng.int(9, 140) * DAY;
      const international = from.country !== to.country;

      const lead: Lead = {
        id,
        createdAt: isoAt(createdMs),
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
        moveDate: isoDay(moveMs),
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
          fullName: `${first} ${last}`,
          email: maskEmail(first + last, rng),
          phone: phoneFor(from.country, rng),
          channel: rng.pick(["phone", "whatsapp", "email", "all"] as const),
          locale: from.country === "TR" ? "tr" : "en",
          emailVerified: true,
          phoneVerified: rng.bool(0.92),
        },
        preferredMatches: rng.pick([2, 5, null] as const),
        notes: NOTE_POOL[(serial * 3 + 1) % NOTE_POOL.length] || undefined,
        consent: true,
      };

      const channel = pickChannel(rng);
      const campaign =
        channel === "paid_search" || channel === "social"
          ? rng.pick(SEED_CAMPAIGNS.filter((c) => c.channel === channel)).id
          : undefined;

      const { status, statusHistory } = statusFor(lead, anchorMs, rng);
      const assignments = assignmentsFor(lead, status, companies, anchorMs, rng);

      out.push({
        dayIndex,
        adminLead: {
          lead,
          status,
          source: {
            channel,
            campaignId: campaign,
            landingPage:
              channel === "paid_search"
                ? rng.pick(["/quote", "/"] as const)
                : rng.pick(LANDING_PAGES),
            country: cityCountry(from).iso,
          },
          qualityScore: scoreFor(lead, anchorMs),
          feeUsd: feeFor(lead, anchorMs),
          assignments,
          statusHistory,
        },
      });
    }
  }

  markDuplicates(out);
  return out;
}

/** Pipeline position depends mostly on how old the enquiry is. */
function statusFor(
  lead: Lead,
  anchorMs: number,
  rng: Rng,
): { status: LeadStatus; statusHistory: StatusEvent[] } {
  const createdMs = Date.parse(lead.createdAt);
  const ageDays = (anchorMs + DAY - createdMs) / DAY;

  let status: LeadStatus;
  if (ageDays < 1.2) {
    status = rng.bool(0.6) ? "new" : "contacted";
  } else if (ageDays < 7) {
    const roll = rng.next();
    status = roll < 0.18 ? "new" : roll < 0.52 ? "contacted" : roll < 0.82 ? "qualified" : "lost";
  } else {
    const roll = rng.next();
    status =
      roll < 0.06 ? "new"
      : roll < 0.2 ? "contacted"
      : roll < 0.38 ? "qualified"
      : roll < 0.58 ? "converted"
      : "lost";
  }

  const history: StatusEvent[] = [
    { status: "new", at: lead.createdAt, by: ACTOR_SYSTEM },
  ];
  const order: LeadStatus[] = ["contacted", "qualified", "converted"];
  const terminal = status === "lost" ? rng.pick(["contacted", "qualified"] as const) : status;
  let cursor = createdMs;
  for (const step of order) {
    if (status === "lost" && order.indexOf(step) > order.indexOf(terminal)) break;
    if (status !== "lost" && order.indexOf(step) > order.indexOf(status)) break;
    if (step === "converted" && status !== "converted") break;
    cursor += rng.int(2, 72) * 3_600_000;
    history.push({ status: step, at: isoAt(Math.min(cursor, anchorMs)), by: ACTOR_ADMIN });
    if (step === terminal && status === "lost") break;
  }
  if (status === "lost") {
    cursor += rng.int(12, 120) * 3_600_000;
    history.push({ status: "lost", at: isoAt(Math.min(cursor, anchorMs)), by: ACTOR_ADMIN });
  }

  return { status, statusHistory: history };
}

function assignmentsFor(
  lead: Lead,
  status: LeadStatus,
  companies: AdminCompany[],
  anchorMs: number,
  rng: Rng,
): LeadAssignment[] {
  if (status === "new") return [];

  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return [];
  const fromRegion = cityRegion(from);
  const toRegion = cityRegion(to);

  const covers = (m: Mover) => m.regions.includes(fromRegion) && m.regions.includes(toRegion);
  const touches = (m: Mover) => m.regions.includes(fromRegion) || m.regions.includes(toRegion);

  const active = companies.filter((c) => c.status === "active");
  let pool = active.filter((c) => covers(c.mover));
  if (pool.length === 0) pool = active.filter((c) => touches(c.mover));
  if (pool.length === 0) return [];

  const cap = lead.preferredMatches ?? 5;
  const want = Math.min(pool.length, cap, rng.int(1, 5));
  const shuffled = [...pool].sort(
    (a, b) => createRng(lead.id, a.mover.id).next() - createRng(lead.id, b.mover.id).next(),
  );

  const createdMs = Date.parse(lead.createdAt);
  const fee = feeFor(lead, anchorMs);

  return shuffled.slice(0, want).map((company, i) => {
    const aRng = createRng("assign", lead.id, company.mover.id);
    const assignedMs = Math.min(createdMs + aRng.int(10, 36 * 60) * 60_000, anchorMs);
    const ageDays = (anchorMs - assignedMs) / DAY;
    let delivery: DeliveryStatus;
    if (ageDays < 0.1) delivery = "pending";
    else if (aRng.bool(0.04)) delivery = "bounced";
    else delivery = aRng.bool(0.72) ? "opened" : "sent";
    // A converted lead was reached through at least one partner.
    if (status === "converted" && i === 0) delivery = "opened";
    return {
      companyId: company.mover.id,
      assignedAt: isoAt(assignedMs),
      feeUsd: paysPerUnlock(company.mover.plan) ? fee : 0,
      delivery,
    };
  });
}

/**
 * Roughly one lead in twenty-five repeats an earlier enquiry: same person,
 * same route, days apart. The admin surfaces these rather than hiding them.
 */
function markDuplicates(all: GeneratedLead[]): void {
  for (let i = 40; i < all.length; i += 25) {
    const target = all[i];
    const sourceIndex = i - createRng("dup", i).int(2, 10);
    const source = all[sourceIndex];
    if (!source || source.adminLead.duplicateOf) continue;
    const src = source.adminLead.lead;
    const dst = target.adminLead.lead;
    dst.contact = { ...src.contact };
    dst.origin = { ...src.origin };
    dst.destination = { ...src.destination };
    dst.moveType = src.moveType;
    target.adminLead.duplicateOf = src.id;
  }
}

/* ------------------------------------------------------------------ *
 * Companies
 * ------------------------------------------------------------------ */

const CONTACT_FIRST = [
  "Murat", "Sabine", "Jeroen", "Astrid", "Kaan", "Paolo", "Linda", "Viktor",
  "Burak", "Maria", "Stefan", "Leyla", "Johan", "Irem", "Davide", "Gul",
];
const CONTACT_LAST = [
  "Erden", "Vogel", "de Vries", "Lindqvist", "Sahin", "Bianchi", "Maas",
  "Horvat", "Acar", "Fischer", "Nilsen", "Kurt", "Berg", "Costa",
];

function generateCompanies(anchorMs: number): AdminCompany[] {
  return MOVERS.map((mover, i) => {
    const rng = createRng("admin-company", mover.id);
    // A handful of non-active accounts so the management states are real.
    let status: CompanyStatus = "active";
    if (i === 7 || i === 19) status = "suspended";
    else if (i === 13) status = "deactivated";
    else if (i >= MOVERS.length - 2) status = "pending";

    const joinedMs =
      status === "pending"
        ? anchorMs - rng.int(3, 20) * DAY
        : anchorMs - rng.int(200, 1900) * DAY;

    const first = rng.pick(CONTACT_FIRST);
    const last = rng.pick(CONTACT_LAST);

    return {
      mover,
      status,
      joinedAt: isoDay(joinedMs),
      contactName: `${first} ${last}`,
      contactEmail: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + `@${mover.slug}.example`,
      contactPhone: phoneFor("TR", rng),
      creditBalanceUsd:
        paysPerUnlock(mover.plan) && rng.bool(0.4) ? rng.int(2, 12) * 5 : 0,
      notes:
        status === "suspended"
          ? "Suspended pending verification of insurance documents."
          : undefined,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

interface BillingResult {
  invoices: Invoice[];
  payments: Payment[];
  credits: CreditEntry[];
}

function generateBilling(
  anchorMs: number,
  companies: AdminCompany[],
  leads: AdminLead[],
): BillingResult {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const credits: CreditEntry[] = [];

  // Pre-bucket pay-per-lead fees: companyId → "yyyy-mm" → { count, totalUsd }
  const feeBuckets = new Map<string, Map<string, { count: number; totalUsd: number }>>();
  for (const al of leads) {
    for (const a of al.assignments) {
      if (a.feeUsd <= 0) continue;
      const month = a.assignedAt.slice(0, 7);
      const byMonth = feeBuckets.get(a.companyId) ?? new Map();
      const cell = byMonth.get(month) ?? { count: 0, totalUsd: 0 };
      cell.count += 1;
      cell.totalUsd += a.feeUsd;
      byMonth.set(month, cell);
      feeBuckets.set(a.companyId, byMonth);
    }
  }

  const anchor = new Date(anchorMs);
  const months: string[] = [];
  for (let back = 11; back >= 0; back--) {
    const d = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - back, 1));
    months.push(d.toISOString().slice(0, 7));
  }

  let invoiceSerial = 0;
  let paymentSerial = 0;
  let creditSerial = 0;

  for (const company of companies) {
    if (company.status === "pending") continue;
    const joined = company.joinedAt.slice(0, 7);

    for (const month of months) {
      if (month < joined) continue;

      const monthStartMs = Date.parse(`${month}-01T00:00:00Z`);
      const nextMonthMs = Date.UTC(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)), // month index of the NEXT month
        1,
      );
      const periodEndMs = nextMonthMs - DAY;
      const isCurrentMonth = month === months[months.length - 1];

      const lines: InvoiceLine[] = [];
      if (company.mover.plan === "pro_unlimited") {
        lines.push({
          id: `li_${company.mover.id}_${month}_sub`,
          description: "Pro Unlimited subscription",
          kind: "subscription",
          quantity: 1,
          amountUsd: PRO_MONTHLY_USD,
        });
      } else {
        const cell = feeBuckets.get(company.mover.id)?.get(month);
        if (!cell) continue; // no unlocks, no invoice
        lines.push({
          id: `li_${company.mover.id}_${month}_fees`,
          description: `Lead unlocks (${cell.count})`,
          kind: "lead_fee",
          quantity: cell.count,
          amountUsd: Math.round(cell.totalUsd * 100) / 100,
        });
      }

      const rng = createRng("invoice", company.mover.id, month);
      const totalUsd = Math.round(lines.reduce((s, l) => s + l.amountUsd, 0) * 100) / 100;
      const issuedMs = nextMonthMs; // billed at period close
      if (issuedMs > anchorMs && !isCurrentMonth) continue;

      invoiceSerial += 1;
      const number = `RM-${month.slice(0, 4)}-${String(invoiceSerial).padStart(4, "0")}`;
      const dueMs = issuedMs + 14 * DAY;

      let status: Invoice["status"];
      let paidAt: string | undefined;
      let refund: Invoice["refund"];

      if (isCurrentMonth || issuedMs > anchorMs) {
        // Current period: accruing, nothing due yet.
        status = "open";
      } else if (dueMs < anchorMs && rng.bool(0.05)) {
        status = "overdue";
      } else if (rng.bool(0.03)) {
        status = "refunded";
        const paidMs = issuedMs + rng.int(1, 10) * DAY;
        paidAt = isoAt(paidMs);
        refund = {
          amountUsd: totalUsd,
          at: isoAt(paidMs + rng.int(2, 20) * DAY),
          reason: rng.pick([
            "Duplicate charge",
            "Disputed lead quality",
            "Goodwill - onboarding issue",
          ] as const),
          by: ACTOR_ADMIN,
        };
      } else {
        status = "paid";
        paidAt = isoAt(Math.min(issuedMs + rng.int(1, 12) * DAY, anchorMs));
      }

      const invoice: Invoice = {
        id: `inv_${String(invoiceSerial).padStart(4, "0")}`,
        number,
        companyId: company.mover.id,
        plan: company.mover.plan,
        periodStart: isoDay(monthStartMs),
        periodEnd: isoDay(periodEndMs),
        issuedAt: isoDay(Math.min(issuedMs, anchorMs)),
        dueAt: isoDay(dueMs),
        status,
        lines,
        totalUsd,
        paidAt,
        refund,
      };
      invoices.push(invoice);

      if (paidAt) {
        paymentSerial += 1;
        payments.push({
          id: `pay_${String(paymentSerial).padStart(4, "0")}`,
          invoiceId: invoice.id,
          companyId: company.mover.id,
          at: paidAt,
          amountUsd: totalUsd,
          method: rng.bool(0.7) ? "card" : "bank_transfer",
        });
      }
    }

    // Credit ledger for companies holding a balance.
    if (company.creditBalanceUsd > 0) {
      const rng = createRng("credit", company.mover.id);
      creditSerial += 1;
      credits.push({
        id: `cr_${String(creditSerial).padStart(3, "0")}`,
        companyId: company.mover.id,
        at: isoAt(anchorMs - rng.int(5, 60) * DAY),
        deltaUsd: company.creditBalanceUsd,
        reason: rng.pick([
          "Goodwill credit - bounced lead",
          "Promo: referral bonus",
          "Make-good for duplicate lead",
        ] as const),
        by: ACTOR_ADMIN,
      });
    }
  }

  return { invoices, payments, credits };
}

/* ------------------------------------------------------------------ *
 * Traffic
 * ------------------------------------------------------------------ */

/** Baseline countries that browse without necessarily converting that day. */
const BASE_COUNTRIES = ["TR", "DE", "NL", "GB", "SE", "FR", "AT", "CH", "AE", "IT"];

function generateTraffic(anchorMs: number, leads: AdminLead[]): TrafficDay[] {
  const startMs = anchorMs - (WINDOW_DAYS - 1) * DAY;

  // Bucket leads by day first so traffic always contains them.
  const byDay = new Map<string, AdminLead[]>();
  for (const al of leads) {
    const day = al.lead.createdAt.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(al);
    byDay.set(day, list);
  }

  const out: TrafficDay[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const dayMs = startMs + i * DAY;
    const date = isoDay(dayMs);
    const dayLeads = byDay.get(date) ?? [];
    const rng = createRng("traffic", date);

    const growth = 0.8 + (i / WINDOW_DAYS) * 0.8;
    const weekday = new Date(dayMs).getUTCDay();
    const weekdayFactor = [0.6, 1.2, 1.15, 1.05, 1.0, 0.95, 0.75][weekday];

    const channels = {} as Record<AcquisitionChannel, ChannelDayStats>;
    for (const channel of CHANNELS) {
      const profile = CHANNEL_PROFILE[channel];
      const channelLeads = dayLeads.filter((l) => l.source.channel === channel).length;
      const base = Math.round(
        58 * profile.weight * growth * weekdayFactor * rng.range(0.75, 1.3),
      );
      // Sessions can never undercut the leads they produced.
      const floor = Math.ceil(channelLeads / profile.conversion / 2.2);
      const sessions = Math.max(base, floor, channelLeads + 1);
      channels[channel] = {
        sessions,
        visitors: Math.max(channelLeads, Math.round(sessions * rng.range(0.72, 0.84))),
        leads: channelLeads,
      };
    }

    const totalSessions = CHANNELS.reduce((s, c) => s + channels[c].sessions, 0);

    // Landing pages: every lead credits its page; the rest of the sessions
    // spread over the catalogue with fixed weights.
    const pages: TrafficDay["pages"] = {};
    const pageWeights = [0.38, 0.3, 0.12, 0.12, 0.08];
    LANDING_PAGES.forEach((page, idx) => {
      pages[page] = {
        sessions: Math.round(totalSessions * pageWeights[idx] * rng.range(0.85, 1.15)),
        leads: 0,
      };
    });
    for (const al of dayLeads) {
      const page = (pages[al.source.landingPage] ??= { sessions: 1, leads: 0 });
      page.leads += 1;
      page.sessions = Math.max(page.sessions, page.leads);
    }

    const countries: TrafficDay["countries"] = {};
    BASE_COUNTRIES.forEach((iso, idx) => {
      countries[iso] = {
        sessions: Math.round((totalSessions * (10 - idx)) / 68 * rng.range(0.7, 1.3)),
        leads: 0,
      };
    });
    for (const al of dayLeads) {
      const cell = (countries[al.source.country] ??= { sessions: 1, leads: 0 });
      cell.leads += 1;
      cell.sessions = Math.max(cell.sessions, cell.leads);
    }

    const campaigns: TrafficDay["campaigns"] = {};
    for (const campaign of SEED_CAMPAIGNS) {
      if (Date.parse(campaign.startedAt) > dayMs) continue;
      const channelSessions = channels[campaign.channel].sessions;
      campaigns[campaign.id] = {
        sessions: Math.round(channelSessions * rng.range(0.25, 0.55)),
        leads: 0,
      };
    }
    for (const al of dayLeads) {
      if (!al.source.campaignId) continue;
      const cell = (campaigns[al.source.campaignId] ??= { sessions: 1, leads: 0 });
      cell.leads += 1;
      cell.sessions = Math.max(cell.sessions, cell.leads);
    }

    out.push({ date, channels, pages, countries, campaigns });
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Team, roles, audit, settings
 * ------------------------------------------------------------------ */

function generateTeam(anchorMs: number): TeamMember[] {
  const member = (
    id: string,
    name: string,
    email: string,
    roleId: string,
    activeDaysAgo: number,
    invitedDaysAgo: number,
    locked = false,
  ): TeamMember => ({
    id,
    name,
    email,
    roleId,
    lastActiveAt: isoAt(anchorMs - activeDaysAgo * DAY),
    invitedAt: isoDay(anchorMs - invitedDaysAgo * DAY),
    ...(locked ? { locked } : {}),
  });

  return [
    member("tm_01", "Demo Admin", "admin@rotamove.demo", ADMIN_ROLE_ID, 0, 900, true),
    member("tm_02", "Ayse Korkmaz", "ayse@rotamove.demo", "sales_manager", 0, 740),
    member("tm_03", "Jonas Richter", "jonas@rotamove.demo", "sales_executive", 1, 520),
    member("tm_04", "Meline Avetisyan", "meline@rotamove.demo", "support_manager", 2, 310),
    member("tm_05", "Tom Verhoeven", "tom@rotamove.demo", "analytics_executive", 6, 150),
    member("tm_06", "Deniz Aksoy", "deniz@rotamove.demo", "accounts_manager", 1, 280),
  ];
}

/**
 * The roles the console ships with.
 *
 * Four departments, each with a manager who can act and an executive who
 * mostly reads — plus the locked Admin role. The admin can rename, re-grant,
 * add and delete any of these except Admin; this is only the starting point.
 */
function defaultRoles(): RoleDef[] {
  const grant = (keys: PermissionKey[]): Record<PermissionKey, boolean> => {
    const row = {} as Record<PermissionKey, boolean>;
    for (const key of PERMISSION_KEYS) row[key] = keys.includes(key);
    return row;
  };

  const role = (id: string, name: string, keys: PermissionKey[]): RoleDef => ({
    id,
    name,
    locked: false,
    permissions: grant(keys),
  });

  return [
    { id: ADMIN_ROLE_ID, name: "Admin", locked: true, permissions: grant([...PERMISSION_KEYS]) },

    role("sales_manager", "Sales — Manager", [
      "leads.view", "leads.manage", "companies.view", "companies.manage",
      "reports.view", "analytics.view",
    ]),
    role("sales_executive", "Sales — Executive", [
      "leads.view", "leads.manage", "companies.view", "reports.view",
    ]),

    role("accounts_manager", "Accounts — Manager", [
      "billing.view", "billing.manage", "companies.view", "companies.manage",
      "reports.view",
    ]),
    role("accounts_executive", "Accounts — Executive", [
      "billing.view", "companies.view", "reports.view",
    ]),

    role("support_manager", "Support — Manager", [
      "leads.view", "leads.manage", "companies.view", "companies.manage", "billing.view",
    ]),
    role("support_executive", "Support — Executive", [
      "leads.view", "companies.view", "billing.view",
    ]),

    role("analytics_manager", "Analytics — Manager", [
      "leads.view", "companies.view", "reports.view", "analytics.view", "billing.view",
    ]),
    role("analytics_executive", "Analytics — Executive", [
      "reports.view", "analytics.view",
    ]),
  ];
}

function generateAudit(
  anchorMs: number,
  leads: AdminLead[],
  companies: AdminCompany[],
  invoices: Invoice[],
): AuditEntry[] {
  const entries: AuditEntry[] = [];
  let serial = 0;
  const push = (at: string, actor: string, action: string, entity: string, entityId: string | undefined, detail: string) => {
    serial += 1;
    entries.push({ id: `au_${String(serial).padStart(4, "0")}`, at, actor, action, entity, entityId, detail });
  };

  // Recent lead pipeline events, straight from the histories.
  const recentLeads = leads.slice(-120);
  for (const al of recentLeads) {
    for (const event of al.statusHistory) {
      if (event.status === "new") continue;
      push(event.at, event.by, `lead.${event.status}`, "lead", al.lead.id,
        `${al.lead.contact.fullName} marked ${event.status}`);
    }
    if (al.assignments.length > 0) {
      const first = al.assignments[0];
      push(first.assignedAt, ACTOR_SYSTEM, "lead.assigned", "lead", al.lead.id,
        `Offered to ${al.assignments.length} ${al.assignments.length === 1 ? "company" : "companies"}`);
    }
  }

  for (const company of companies) {
    if (company.status === "suspended") {
      push(isoAt(anchorMs - 12 * DAY), ACTOR_ADMIN, "company.suspended", "company",
        company.mover.id, `${company.mover.name} suspended: insurance documents expired`);
    }
  }

  for (const invoice of invoices) {
    if (invoice.refund) {
      push(invoice.refund.at, invoice.refund.by, "invoice.refunded", "invoice",
        invoice.id, `${invoice.number} refunded: ${invoice.refund.reason}`);
    }
  }

  push(isoAt(anchorMs - 30 * DAY), ACTOR_ADMIN, "settings.updated", "settings", undefined,
    "Duplicate window changed from 7 to 14 days");
  push(isoAt(anchorMs - 150 * DAY), ACTOR_ADMIN, "team.invited", "team", "tm_05",
    "Tom Verhoeven invited as Analyst");

  return entries
    .filter((e) => Date.parse(e.at) <= anchorMs + DAY)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 400);
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

/**
 * Build the full prototype dataset for a given anchor day ("yyyy-mm-dd").
 * Pure and deterministic: same anchor, same dataset, on any machine.
 */
export function generateAdminDataset(anchorDate: string): AdminDataset {
  const anchorMs = Date.parse(`${anchorDate}T00:00:00Z`);
  const companies = generateCompanies(anchorMs);
  const generated = generateLeads(anchorMs, companies);
  const leads = generated.map((g) => g.adminLead);
  const { invoices, payments, credits } = generateBilling(anchorMs, companies, leads);
  const traffic = generateTraffic(anchorMs, leads);
  const audit = generateAudit(anchorMs, leads, companies, invoices);

  return {
    anchorMs,
    leads,
    companies,
    invoices,
    payments,
    credits,
    traffic,
    campaigns: SEED_CAMPAIGNS,
    team: generateTeam(anchorMs),
    roles: defaultRoles(),
    audit,
    settings: {
      leadFeeFloorUsd: LEAD_FEE_FLOOR_USD,
      leadFeeCapUsd: LEAD_FEE_CAP_USD,
      proMonthlyUsd: PRO_MONTHLY_USD,
      defaultMatchCount: 5,
      duplicateWindowDays: 14,
      autoAssignLeads: false,
      notifyNewLead: true,
      notifyOverdueInvoice: true,
      requireTwoFactor: false,
    },
  };
}
