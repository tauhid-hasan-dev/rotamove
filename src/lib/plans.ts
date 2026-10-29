import { isCoreCorridor, resolveCorridor, getCity, cityRegion } from "@/lib/geo";
import type { Lead, PlanId } from "@/lib/types";

/**
 * Partner monetisation. Three ways to buy demand:
 *
 *  1. Pro Unlimited — $100 / month. Unlimited international *and* domestic
 *     leads, and the only tier that appears as an instant match in the
 *     customer's results board. Instant availability is what makes the search
 *     feel like a product rather than a contact form.
 *
 *  2. Pay Per Lead — $0 / month, billed per lead assigned. Priced by corridor
 *     value and job size, hard-capped at $7 so a partner can never be
 *     surprised by an invoice.
 *
 *  3. Pay Per Seen — $0 / month, billed per lead opened. Leads arrive masked;
 *     the fee lands on the unlock, not the match.
 *
 * The first two are billed on the match, so those partners get the lead in
 * full the moment it arrives. Only the third has anything to unlock — see
 * `seesMaskedLeads`.
 *
 * Platform billing is USD. Customers are never shown a price of any kind.
 */

export const LEAD_FEE_CAP_USD = 7;
export const LEAD_FEE_FLOOR_USD = 2;
export const PRO_MONTHLY_USD = 100;

/**
 * Credited to a partner's account when they sign up.
 *
 * A number rather than a string in the copy, because it is a billing fact
 * and the pricing page states it in the reader's own currency formatting.
 * At the current fee cap it is worth at least fourteen leads, and a month of
 * Pro — which is the comparison the sign-up banner is inviting.
 */
export const SIGNUP_CREDIT_USD = 100;

/** The blended fee a pay-per-lead partner pays, used for break-even maths. */
export const AVG_LEAD_FEE_USD = 5.2;

/**
 * Share of the board a pay-per-seen partner actually opens.
 *
 * They see volume, access and route before paying, so they skip the loads
 * that do not suit their fleet. That selectivity is the entire pitch of the
 * plan, and it is why it can be cheaper than pay-per-lead on the same flow
 * of enquiries.
 */
export const PPS_OPEN_RATE = 0.35;

/**
 * Is this plan charged per unlock?
 *
 * Everything that is not Pro Unlimited is. Written once because the three
 * places that used to ask this each tested `=== "pay_per_lead"`, which
 * silently billed pay-per-seen partners nothing the moment that plan
 * existed.
 */
export const paysPerUnlock = (plan: PlanId): boolean => plan !== "pro_unlimited";

/**
 * Every plan, in the order they are presented everywhere.
 *
 * Exported so the plan API can validate against the same list the UI offers,
 * rather than a second copy that drifts the day a fourth plan appears.
 */
export const PLAN_IDS = ["pro_unlimited", "pay_per_lead", "pay_per_seen"] as const;

/**
 * Plan names in English.
 *
 * The UI reads plan names from the locale dictionaries and should keep doing
 * so. This map exists for the one channel that has no locale to read from:
 * outbound mail, composed on the server for an inbox that will be opened
 * later and elsewhere. Anything rendered inside a page must not use it.
 */
export const PLAN_NAMES_EN: Record<PlanId, string> = {
  pro_unlimited: "Pro Unlimited",
  pay_per_lead: "Pay Per Lead",
  pay_per_seen: "Pay Per Seen",
};

/**
 * Does this plan see leads masked until it pays to open one?
 *
 * Pro and Pay Per Lead are billed on the match itself, so the lead is theirs
 * the moment it arrives and nothing is hidden. Pay Per Seen is billed on the
 * open, so the lead has to stay masked for the open to mean anything.
 */
export const seesMaskedLeads = (plan: PlanId): boolean => plan === "pay_per_seen";

/** Leads a partner must close before Pro Unlimited is the cheaper option. */
export const BREAK_EVEN_LEADS = Math.ceil(PRO_MONTHLY_USD / AVG_LEAD_FEE_USD);

/**
 * Which Pay Per Lead features are actually included.
 *
 * Positionally aligned with `dict.plans.pplFeatures` — the words are
 * translated, the entitlements are not. Pro Unlimited includes everything, so
 * it needs no equivalent list.
 */
export const PPL_FEATURE_INCLUDED: readonly boolean[] = [
  true, // no monthly fee
  true, // browse the board
  true, // unlock to reveal contacts
  true, // 24h refund
  true, // corridor and volume filters
  false, // instant-match placement — Pro only
  false, // one-tap contact — Pro only
  false, // lead API and webhooks — Pro only
  false, // corridor analytics — Pro only
  true, // 1 operator seat
];

/**
 * Which Pay Per Seen features are actually included.
 *
 * Positionally aligned with `dict.plans.ppsFeatures`, same contract as
 * `PPL_FEATURE_INCLUDED` above.
 */
export const PPS_FEATURE_INCLUDED: readonly boolean[] = [
  true, // no monthly fee
  true, // masked board: volume, access, route visible free
  true, // unlock to reveal the full lead
  true, // charged only on unlock
  true, // confirmation email per unlock
  true, // 24h refund
  false, // instant-match placement — Pro only
  false, // one-tap contact — Pro only
  false, // lead API and webhooks — Pro only
  true, // 1 operator seat
];

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
  ppsCostUsd: number;
  jobsWon: number;
  grossProfitEur: number;
  proNetEur: number;
  pplNetEur: number;
  ppsNetEur: number;
  breakEvenLeads: number;
  betterPlan: PlanId;
  /** Gap between the cheapest plan and the next cheapest. */
  savingUsd: number;
}

/** Drives the partner-side plan comparison calculator. */
export function computeRoi(
  input: RoiInput,
  avgLeadFeeUsd = AVG_LEAD_FEE_USD,
  usdPerEur = 1.08,
): RoiResult {
  const jobsWon = input.leadsPerMonth * input.winRate;
  const grossProfitEur = jobsWon * input.avgJobValueEur * input.grossMargin;
  const proCostUsd = PRO_MONTHLY_USD;
  const pplCostUsd = input.leadsPerMonth * avgLeadFeeUsd;
  // Pay per seen is pay per lead over the share they choose to open.
  const ppsCostUsd = input.leadsPerMonth * PPS_OPEN_RATE * avgLeadFeeUsd;

  const costs: Array<[PlanId, number]> = [
    ["pro_unlimited", proCostUsd],
    ["pay_per_lead", pplCostUsd],
    ["pay_per_seen", ppsCostUsd],
  ];
  // Cheapest first; ties keep the declared order, so Pro wins a dead heat —
  // at equal money the unlimited plan is the better deal.
  const ranked = [...costs].sort((a, b) => a[1] - b[1]);

  return {
    proCostUsd,
    pplCostUsd,
    ppsCostUsd,
    jobsWon,
    grossProfitEur,
    proNetEur: grossProfitEur - proCostUsd / usdPerEur,
    pplNetEur: grossProfitEur - pplCostUsd / usdPerEur,
    ppsNetEur: grossProfitEur - ppsCostUsd / usdPerEur,
    breakEvenLeads: Math.ceil(PRO_MONTHLY_USD / avgLeadFeeUsd),
    betterPlan: ranked[0][0],
    savingUsd: ranked[1][1] - ranked[0][1],
  };
}

