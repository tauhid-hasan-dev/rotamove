import { isCoreCorridor, resolveCorridor, getCity, cityRegion } from "@/lib/geo";
import type { Lead, PlanId } from "@/lib/types";

/**
 * Partner monetisation.
 *
 * Two ways to buy demand, deliberately kept to two:
 *
 *  1. Pro Unlimited — $100 / month. Unlimited international *and* domestic
 *     leads, and the only tier that appears as an instant match in the
 *     customer's results board. Instant availability is what makes the search
 *     feel like a product rather than a contact form.
 *
 *  2. Pay Per Lead — $0 / month, pay only for leads you unlock. Priced per
 *     lead by corridor value and job size, hard-capped at $7 so a partner can
 *     never be surprised by an invoice.
 *
 * Platform billing is USD. Customers are never shown a price of any kind.
 */

export const LEAD_FEE_CAP_USD = 7;
export const LEAD_FEE_FLOOR_USD = 2;
export const PRO_MONTHLY_USD = 100;

export interface PlanFeature {
  label: string;
  detail?: string;
  included: boolean;
  highlight?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceLabel: string;
  priceSuffix: string;
  priceNote: string;
  badge?: string;
  recommended?: boolean;
  bestFor: string;
  features: PlanFeature[];
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "pro_unlimited",
    name: "Pro Unlimited",
    tagline: "Every lead on the network, one flat fee.",
    priceLabel: "$100",
    priceSuffix: "/month",
    priceNote: "Billed monthly in USD. Cancel any time, no notice period.",
    badge: "Most partners choose this",
    recommended: true,
    bestFor: "Movers running regular groupage on Türkiye ↔ Europe, CIS, Gulf or Central Asia lanes.",
    cta: "Start 14-day free trial",
    features: [
      {
        label: "Unlimited international leads",
        detail: "Every corridor — Türkiye, EU, Balkans, Nordics, CIS, Central Asia, Middle East.",
        included: true,
        highlight: true,
      },
      {
        label: "Unlimited domestic leads",
        detail: "Türkiye-internal and in-country moves across all 53 partner countries.",
        included: true,
        highlight: true,
      },
      {
        label: "Instant-match placement in search",
        detail: "You appear as available the moment a customer searches — before anyone who has to call back.",
        included: true,
        highlight: true,
      },
      { label: "One-tap contact from the results board", included: true },
      { label: "Full customer contact details, unmasked", included: true },
      { label: "Capacity & seasonality rules engine", included: true },
      { label: "Corridor demand analytics & win-rate reporting", included: true },
      { label: "Lead API and webhooks", included: true },
      { label: "Priority dispute handling", included: true },
      { label: "Up to 8 operator seats", included: true },
    ],
  },
  {
    id: "pay_per_lead",
    name: "Pay Per Lead",
    tagline: "No subscription. Buy only the jobs you want.",
    priceLabel: "$2–$7",
    priceSuffix: "/lead",
    priceNote: `Hard cap of $${LEAD_FEE_CAP_USD} per lead. You see the exact price before you unlock.`,
    bestFor: "New partners, seasonal operators, or movers testing a new corridor.",
    cta: "Create free partner account",
    features: [
      { label: "No monthly fee, no minimum spend", included: true, highlight: true },
      {
        label: "Browse the full lead board",
        detail: "Route, volume, dates and quality score are visible before you pay.",
        included: true,
      },
      { label: "Unlock a lead to reveal contact details", included: true },
      { label: "Refund within 24 h on invalid contact details", included: true },
      { label: "Corridor and volume filters", included: true },
      { label: "Instant-match placement in search", included: false },
      { label: "One-tap contact from the results board", included: false },
      { label: "Lead API and webhooks", included: false },
      { label: "Corridor demand analytics", included: false },
      { label: "1 operator seat", included: true },
    ],
  },
];

export const PLAN_BY_ID: Record<PlanId, Plan> = {
  pro_unlimited: PLANS[0],
  pay_per_lead: PLANS[1],
};

/**
 * What a pay-per-lead partner is charged to unlock this lead.
 *
 * The signal we price on is expected job value, not a flat rate: a 68 m³
 * full-service Istanbul → Stockholm relocation is worth far more to a mover
 * than two boxes across Ankara. Still hard-capped at $7.
 */
export function leadFeeUsd(lead: Lead): number {
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return LEAD_FEE_FLOOR_USD;

  const corridor = resolveCorridor(from, to);
  let fee = lead.moveType === "international" ? 3.6 : 2.1;

  // Job size: a bigger load is a bigger invoice for whoever wins it.
  fee += Math.min(1.8, (lead.volumeM3 / 70) * 1.8);

  // Corridors we actively sell convert better, so they are worth more.
  if (isCoreCorridor(corridor)) fee += 0.5;

  // Long-haul and paperwork-heavy destinations carry the richest margins.
  const destRegion = cityRegion(to);
  if (destRegion === "CENTRAL_ASIA" || destRegion === "CIS") fee += 0.7;
  if (destRegion === "MIDDLE_EAST" || destRegion === "NORDICS") fee += 0.4;

  if (lead.serviceLevel === "full_service") fee += 0.6;
  if (lead.extras.storageWeeks > 0) fee += 0.25;
  if (lead.extras.customsClearance) fee += 0.25;
  if (lead.specialItems.vehicle || lead.specialItems.piano) fee += 0.3;

  // Ready-to-move-now beats "sometime next year".
  const daysOut = Math.max(
    0,
    Math.round((new Date(lead.moveDate).getTime() - Date.now()) / 86_400_000),
  );
  if (daysOut <= 30) fee += 0.4;
  else if (daysOut > 120) fee -= 0.5;

  return Math.round(Math.min(LEAD_FEE_CAP_USD, Math.max(LEAD_FEE_FLOOR_USD, fee)) * 100) / 100;
}

/**
 * 0–100 quality score shown on the partner lead board. Keeps the marketplace
 * honest: partners can tell a serious enquiry from a tyre-kick before paying.
 */
export function leadQualityScore(lead: Lead): number {
  let score = 42;
  if (lead.contact.phone.replace(/\D/g, "").length >= 10) score += 14;
  if (lead.contact.email.includes("@")) score += 8;
  if (lead.volumeM3 >= 25) score += 10;
  if (lead.flexibility === "exact" || lead.flexibility === "plus_minus_3") score += 9;
  if (lead.serviceLevel === "full_service") score += 7;
  if (lead.notes && lead.notes.length > 24) score += 5;
  if (lead.extras.insurance) score += 3;

  const daysOut = Math.round((new Date(lead.moveDate).getTime() - Date.now()) / 86_400_000);
  if (daysOut <= 45 && daysOut >= 0) score += 8;
  if (daysOut > 150) score -= 10;

  return Math.max(12, Math.min(99, Math.round(score)));
}

export interface RoiInput {
  leadsPerMonth: number;
  /** 0–1 */
  winRate: number;
  avgJobValueEur: number;
  /** 0–1 */
  grossMargin: number;
}

export interface RoiResult {
  proCostUsd: number;
  pplCostUsd: number;
  jobsWon: number;
  grossProfitEur: number;
  proNetEur: number;
  pplNetEur: number;
  breakEvenLeads: number;
  betterPlan: PlanId;
  savingUsd: number;
}

/** Drives the partner-side plan comparison calculator. */
export function computeRoi(
  input: RoiInput,
  avgLeadFeeUsd = 5.2,
  usdPerEur = 1.08,
): RoiResult {
  const jobsWon = input.leadsPerMonth * input.winRate;
  const grossProfitEur = jobsWon * input.avgJobValueEur * input.grossMargin;
  const proCostUsd = PRO_MONTHLY_USD;
  const pplCostUsd = input.leadsPerMonth * avgLeadFeeUsd;
  const proNetEur = grossProfitEur - proCostUsd / usdPerEur;
  const pplNetEur = grossProfitEur - pplCostUsd / usdPerEur;
  return {
    proCostUsd,
    pplCostUsd,
    jobsWon,
    grossProfitEur,
    proNetEur,
    pplNetEur,
    breakEvenLeads: Math.ceil(PRO_MONTHLY_USD / avgLeadFeeUsd),
    betterPlan: proCostUsd <= pplCostUsd ? "pro_unlimited" : "pay_per_lead",
    savingUsd: Math.abs(proCostUsd - pplCostUsd),
  };
}

export const PARTNER_FAQ = [
  {
    q: "What exactly counts as a lead?",
    a: "A completed enquiry with a verified route, move date, volume and reachable contact details. Enquiries that fail our validation never reach the board, and you are never charged for them.",
  },
  {
    q: "Is Pro Unlimited really unlimited?",
    a: `Yes. $${PRO_MONTHLY_USD} a month covers every international and domestic lead on every corridor, with no cap and no overage. The only limit is your own capacity settings.`,
  },
  {
    q: "Why would I pay per lead instead?",
    a: `If you close fewer than ${Math.ceil(PRO_MONTHLY_USD / 5.2)} leads a month, pay-per-lead is cheaper. Most partners start there and switch to Pro inside two months.`,
  },
  {
    q: "Can a lead cost more than $7?",
    a: `Never. $${LEAD_FEE_CAP_USD} is a hard ceiling regardless of corridor, volume or job value, and the exact price is shown before you unlock.`,
  },
  {
    q: "Do pay-per-lead partners appear in search results?",
    a: "You appear on the results board, but marked as replying later rather than instantly. Instant-match placement is a Pro Unlimited feature.",
  },
  {
    q: "What if the contact details are wrong?",
    a: "Report it within 24 hours and the lead credit is refunded automatically. Pro partners are unaffected since there is no per-lead charge.",
  },
];
