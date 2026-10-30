import { cityRegion, getCity, type TransportMode } from "@/lib/geo";
import { MOVERS, NETWORK_PARTNER_CLAIM } from "@/lib/movers";
import { leadFeeEur } from "@/lib/plans";
import {
  brokerAnchor,
  buildQuoteBasis,
  referenceQuote,
  transitDaysFor,
  type QuoteBasis,
} from "@/lib/pricing";
import { createRng } from "@/lib/rand";
import { addDays } from "@/lib/format";
import { bestLaneFor, windowOverlap, type LaneMatch } from "@/lib/lanes";
import type { LaneIndex } from "@/lib/lane-store";
import type {
  DateRange,
  Lead,
  Mover,
  PublicQuote,
  Quote,
  QuoteFilters,
  SortKey,
} from "@/lib/types";

/**
 * Matching engine.
 *
 * Turns one lead into a ranked set of movers. Three rules shape everything:
 *
 *  - Price is computed and used for ranking, but never leaves the server.
 *    See `toPublicQuote`.
 *  - Pro Unlimited partners are "instant" — they confirm availability straight
 *    away. Pay-per-lead partners are "bid": they pick the lead up and reply
 *    within a few hours.
 *  - Results are deterministic for a given lead id, so the page can be
 *    refreshed, re-sorted and shared without the order shifting.
 *
 * Partner-declared lanes enter here as an argument rather than an import.
 * This module runs in the browser as well as on the server — the wizard uses
 * it for a preview — so it cannot reach for a repository. Callers that have
 * the lane index pass it; callers that do not get exactly the behaviour they
 * had before lanes existed.
 */

type ServiceKey = "packing" | "storage" | "customs" | "vehicle" | "piano" | "cleaning";

export function leadServiceNeeds(lead: Lead): ServiceKey[] {
  const needs: ServiceKey[] = [];
  if (lead.extras.packing || lead.extras.unpacking) needs.push("packing");
  if (lead.extras.storageWeeks > 0) needs.push("storage");
  if (lead.extras.customsClearance) needs.push("customs");
  if (lead.specialItems.vehicle) needs.push("vehicle");
  if (lead.specialItems.piano) needs.push("piano");
  if (lead.extras.cleaning) needs.push("cleaning");
  return needs;
}

const NO_LANES: LaneIndex = new Map();

export interface EligibleMover {
  mover: Mover;
  /** true when the partner covers both ends of the route directly. */
  fullCoverage: boolean;
  missingServices: ServiceKey[];
  /** A run the partner has declared on this exact route, if they have one. */
  laneMatch: LaneMatch | null;
}

export function eligibleMovers(lead: Lead, lanes: LaneIndex = NO_LANES): EligibleMover[] {
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return [];

  const fromRegion = cityRegion(from);
  const toRegion = cityRegion(to);
  const needs = leadServiceNeeds(lead);

  const scored = MOVERS.map((mover) => {
    const set = new Set(mover.regions);
    const fullCoverage = set.has(fromRegion) && set.has(toRegion);
    const partial = set.has(fromRegion) || set.has(toRegion);
    const missingServices = needs.filter((n) => !mover.services[n]);
    const laneMatch = bestLaneFor(lanes.get(mover.id) ?? [], lead);
    return { mover, fullCoverage, partial, missingServices, laneMatch };
  });

  // A declared run on this exact route qualifies a partner on its own. The
  // region map is our model of where a carrier operates; a lane is the carrier
  // telling us a vehicle is going there on these dates, which is better
  // evidence than the model it would otherwise be judged by.
  const strong = scored.filter(
    (s) => (s.fullCoverage || s.laneMatch) && s.missingServices.length === 0,
  );
  // Keep the board healthy: if strict matching is thin, widen in controlled steps.
  const relaxed =
    strong.length >= 6
      ? strong
      : scored.filter(
          (s) => s.fullCoverage || s.laneMatch || (s.partial && s.missingServices.length <= 1),
        );

  return relaxed.map(({ mover, fullCoverage, missingServices, laneMatch }) => ({
    mover,
    fullCoverage,
    missingServices,
    laneMatch,
  }));
}

function chooseMode(
  mover: Mover,
  basis: QuoteBasis,
  rng: ReturnType<typeof createRng>,
  laneMatch: LaneMatch | null,
): TransportMode {
  // No need to guess when the carrier has already said what is running.
  if (laneMatch && basis.modes.includes(laneMatch.lane.mode)) return laneMatch.lane.mode;

  const shared = basis.modes.filter((m) => mover.modes.includes(m));
  const options = shared.length ? shared : [basis.modes[0] ?? "road"];
  if (options.length === 1) return options[0];

  // Cheap operators lean to sea/rail, premium operators lean to road/air.
  const bias = mover.priceIndex < 0.95 ? "cost" : mover.priceIndex > 1.15 ? "speed" : "balanced";
  const weights: Record<TransportMode, number> = {
    road: bias === "speed" ? 4 : 3,
    rail: bias === "cost" ? 3 : 1,
    sea: bias === "cost" ? 3.4 : 1,
    air: bias === "speed" ? 1.8 : 0.4,
  };
  const pool = options.flatMap((m) => Array(Math.max(1, Math.round(weights[m] * 2))).fill(m));
  return rng.pick(pool) as TransportMode;
}

function pickupWindow(lead: Lead): { pickup: string; range: DateRange } {
  const slack =
    lead.flexibility === "exact"
      ? 0
      : lead.flexibility === "plus_minus_3"
        ? 3
        : lead.flexibility === "within_2_weeks"
          ? 7
          : 12;
  return {
    pickup: lead.moveDate,
    range:
      slack === 0
        ? [lead.moveDate, lead.moveDate]
        : [addDays(lead.moveDate, -slack), addDays(lead.moveDate, slack)],
  };
}

interface Scored {
  quote: Quote;
  mover: Mover;
  laneMatch: LaneMatch | null;
}

export interface MatchResult {
  quotes: Quote[];
  basis: QuoteBasis;
  partnersScanned: number;
  instantCount: number;
  bidCount: number;
}

export function matchLead(lead: Lead, lanes: LaneIndex = NO_LANES): MatchResult | null {
  const basis = buildQuoteBasis(lead);
  if (!basis) return null;

  const eligible = eligibleMovers(lead, lanes);
  const window = pickupWindow(lead);
  const feeEur = leadFeeEur(lead);

  const raw: Scored[] = eligible.map(({ mover, fullCoverage, missingServices, laneMatch }) => {
    const rng = createRng(lead.id, mover.id);
    const mode = chooseMode(mover, basis, rng, laneMatch);
    const ref = referenceQuote(lead, basis, mode);

    // Partner-specific commercial position, plus a small stable jitter so two
    // partners with the same index do not land on an identical number.
    const jitter = 0.96 + rng.next() * 0.08;
    // A partner reached only through a declared lane is not a stretch for
    // them, so there is nothing to surcharge.
    const coveragePenalty = fullCoverage || laneMatch ? 1 : 1.07;
    const total = Math.round((ref.total * mover.priceIndex * jitter * coveragePenalty) / 5) * 5;

    const transitDays = transitDaysFor(basis.corridor, mode, mover.speedIndex);
    const isInstant = mover.plan === "pro_unlimited";

    // A dated run replaces the customer's whole flexible window with the days
    // the vehicle is actually on the road. That narrowing is the point: the
    // customer sees real departure dates instead of a band we invented, and
    // it can only ever be a subset of what they said they could do.
    const declared = laneMatch?.lane.window ?? null;
    const collection = (declared && windowOverlap(window.range, declared)) || window.range;
    const departs = declared ? collection[0] : window.pickup;

    const quote: Quote = {
      id: `q_${lead.id}_${mover.id}`,
      leadId: lead.id,
      moverId: mover.id,
      kind: isInstant ? "instant" : "bid",
      currency: "EUR",
      total,
      anchor: brokerAnchor(total, basis.crossBorder),
      lines: ref.lines.map((l) => ({
        ...l,
        amount: Math.round(l.amount * mover.priceIndex * jitter),
      })),
      mode,
      transitDays,
      pickupWindow: collection,
      deliveryWindow: [addDays(departs, transitDays[0]), addDays(departs, transitDays[1])],
      validUntilDays: isInstant ? 14 : 7,
      matchScore: 0,
      matchReasons: [],
      co2Kg: ref.co2Kg,
      depositPct: mover.priceIndex > 1.15 ? 25 : 15,
      lane: laneMatch
        ? {
            vehicle: laneMatch.lane.vehicle,
            window: laneMatch.lane.window,
            capacityM3: laneMatch.lane.capacityM3,
            fits: laneMatch.fits,
          }
        : undefined,
      leadFeeEur: isInstant ? undefined : feeEur,
    };

    if (missingServices.length) {
      quote.matchReasons.push(
        `Does not cover: ${missingServices.join(", ")} — arranged with a local sub-contractor`,
      );
    }

    return { quote, mover, laneMatch };
  });

  if (!raw.length) return null;

  const prices = raw.map((r) => r.quote.total).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const spread = Math.max(1, maxPrice - minPrice);

  const speeds = raw.map((r) => r.quote.transitDays[1]);
  const minDays = Math.min(...speeds);
  const maxDays = Math.max(...speeds);
  const daySpread = Math.max(1, maxDays - minDays);

  for (const { quote, mover, laneMatch } of raw) {
    const priceScore = 1 - (quote.total - minPrice) / spread;
    const speedScore = 1 - (quote.transitDays[1] - minDays) / daySpread;
    const ratingScore = (mover.rating - 3.8) / 1.2;
    const reliabilityScore = (mover.onTimeRate - 0.8) / 0.2;
    const responseScore = 1 - Math.min(1, mover.responseMins / 120);

    const composite =
      priceScore * 0.36 +
      ratingScore * 0.24 +
      reliabilityScore * 0.16 +
      speedScore * 0.14 +
      responseScore * 0.1;

    // Confirmed availability is worth more to the customer than a callback.
    const kindBoost = quote.kind === "instant" ? 0.06 : 0;

    // A vehicle already going there outranks every modelled signal, so it is
    // the largest single boost in the formula — but still a boost, not an
    // override: a declared run on a 3-star carrier does not beat a 4.8-star
    // one outright. A dated run counts for more than a timetable entry, and
    // only one with room for the load gets the full weight.
    const laneBoost = laneMatch
      ? (laneMatch.dated ? 0.1 : 0.05) + (laneMatch.fits ? 0.02 : 0)
      : 0;

    quote.matchScore = Math.round(
      Math.max(1, Math.min(100, (composite + kindBoost + laneBoost) * 100)),
    );

    // Standout traits first, then always-true facts — every card has to be able
    // to explain its own position, including the unremarkable ones in the middle.
    const standout: string[] = [];
    if (laneMatch) {
      const vehicle = laneMatch.lane.vehicle === "lorry" ? "Lorry" : "Van";
      standout.push(
        laneMatch.dated
          ? `${vehicle} already running this lane, ${laneMatch.lane.capacityM3} m³ free`
          : `Scheduled service on this lane, ${laneMatch.lane.capacityM3} m³ per departure`,
      );
    }
    if (quote.transitDays[1] === minDays) standout.push("Fastest delivery window");
    if (mover.plan === "pro_unlimited" && mover.responseMins <= 20)
      standout.push("Confirms availability instantly");
    if (mover.rating >= 4.7)
      standout.push(`${mover.rating.toFixed(1)}★ from ${mover.reviewCount.toLocaleString("en-GB")} reviews`);
    if (mover.onTimeRate >= 0.95)
      standout.push(`${Math.round(mover.onTimeRate * 100)}% on-time delivery`);
    if (mover.responseMins <= 15)
      standout.push(`Replies in about ${mover.responseMins} minutes`);
    if (mover.certifications.includes("FIDI/FAIM")) standout.push("FIDI/FAIM accredited");
    if (mover.badges.includes("eco_fleet")) standout.push("Low-emission routing on this lane");

    const fallback: string[] = [
      `${quote.matchScore}/100 match for this route`,
      `${mover.completedMoves.toLocaleString("en-GB")} moves completed since ${mover.since}`,
      `Runs this corridor with its own ${mover.fleetTrucks}-vehicle fleet`,
      `${Math.round(mover.onTimeRate * 100)}% on-time · ${(mover.claimRate * 100).toFixed(1)}% claim rate`,
    ];

    quote.matchReasons = [...standout, ...quote.matchReasons, ...fallback]
      .filter((reason, i, all) => all.indexOf(reason) === i)
      .slice(0, 4);
  }

  const quotes = raw
    .map((r) => r.quote)
    .sort((a, b) => b.matchScore - a.matchScore || a.total - b.total);

  return {
    quotes,
    basis,
    partnersScanned: NETWORK_PARTNER_CLAIM,
    instantCount: quotes.filter((q) => q.kind === "instant").length,
    bidCount: quotes.filter((q) => q.kind === "bid").length,
  };
}

/**
 * Client-side sorting. Operates on the price-free payload — "cheapest" is not
 * an option here because no money value ever reaches the browser.
 */
export function sortQuotes(quotes: PublicQuote[], key: SortKey): PublicQuote[] {
  const byMover = (id: string) => MOVERS.find((m) => m.id === id);
  const copy = [...quotes];
  switch (key) {
    case "fastest":
      return copy.sort(
        (a, b) => a.transitDays[1] - b.transitDays[1] || b.matchScore - a.matchScore,
      );
    case "rating":
      return copy.sort((a, b) => {
        const ra = byMover(a.moverId)?.rating ?? 0;
        const rb = byMover(b.moverId)?.rating ?? 0;
        return rb - ra || b.matchScore - a.matchScore;
      });
    case "replies":
      return copy.sort((a, b) => a.responseMins - b.responseMins || b.matchScore - a.matchScore);
    case "best":
    default:
      return copy.sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const DEFAULT_FILTERS: QuoteFilters = {
  modes: [],
  minRating: 0,
  instantOnly: false,
  needs: [],
};

export function applyFilters(quotes: PublicQuote[], filters: QuoteFilters): PublicQuote[] {
  return quotes.filter((q) => {
    const mover = MOVERS.find((m) => m.id === q.moverId);
    if (!mover) return false;
    if (filters.modes.length && !filters.modes.includes(q.mode)) return false;
    if (mover.rating < filters.minRating) return false;
    if (filters.instantOnly && q.kind !== "instant") return false;
    if (filters.needs.some((need) => !mover.services[need])) return false;
    return true;
  });
}

export interface ResultsSummary {
  count: number;
  instant: number;
  fastestDays: number;
  avgRating: number;
  fastestReplyMins: number;
}

export function summarise(quotes: PublicQuote[]): ResultsSummary {
  if (!quotes.length) {
    return { count: 0, instant: 0, fastestDays: 0, avgRating: 0, fastestReplyMins: 0 };
  }
  const ratings = quotes
    .map((q) => MOVERS.find((m) => m.id === q.moverId)?.rating ?? 0)
    .filter(Boolean);
  return {
    count: quotes.length,
    instant: quotes.filter((q) => q.kind === "instant").length,
    fastestDays: Math.min(...quotes.map((q) => q.transitDays[1])),
    avgRating: ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length),
    fastestReplyMins: Math.min(...quotes.map((q) => q.responseMins)),
  };
}
