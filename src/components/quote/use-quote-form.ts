"use client";

import { useCallback, useMemo, useState } from "react";
import { cityCountry, getCity, resolveCorridor, roadKm } from "@/lib/geo";
import { matchLead } from "@/lib/matching";
import { estimateVolume } from "@/lib/pricing";
import { addDays, todayIso } from "@/lib/format";
import type { Lead, LeadDraft, MoveType } from "@/lib/types";

export const STEPS = [
  { id: "home", title: "Home" },
  { id: "timing", title: "Date" },
  { id: "services", title: "Help" },
  { id: "contact", title: "Contact" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function createDefaultDraft(overrides?: Partial<LeadDraft>): LeadDraft {
  return {
    moveType: "international",
    origin: { cityCode: "", area: "", access: "lift", easyParking: true },
    destination: { cityCode: "", area: "", access: "lift", easyParking: true },
    moveDate: addDays(todayIso(), 45),
    flexibility: "plus_minus_3",
    propertySize: "two_bed",
    volumeM3: estimateVolume("two_bed"),
    serviceLevel: "door_to_door",
    specialItems: {
      piano: false,
      vehicle: false,
      artwork: false,
      safe: false,
      gym: false,
      plants: false,
    },
    extras: {
      packing: true,
      unpacking: false,
      dismantling: true,
      storageWeeks: 0,
      insurance: true,
      customsClearance: false,
      cleaning: false,
    },
    contact: { fullName: "", email: "", phone: "", channel: "whatsapp", locale: "en" },
    notes: "",
    consent: false,
    ...overrides,
  };
}

export interface LivePreview {
  ready: boolean;
  km: number;
  corridorLabel: string;
  transitDays: [number, number];
  matchCount: number;
  instantCount: number;
  moveType: MoveType;
}

const EMPTY_PREVIEW: LivePreview = {
  ready: false,
  km: 0,
  corridorLabel: "",
  transitDays: [0, 0],
  matchCount: 0,
  instantCount: 0,
  moveType: "international",
};

/**
 * Live match count beside the form. Reuses the real matching engine, so the
 * number narrows honestly as the enquiry gets more specific. No money is
 * derived, displayed or returned.
 */
export function useLivePreview(draft: LeadDraft): LivePreview {
  return useMemo(() => {
    const from = getCity(draft.origin.cityCode);
    const to = getCity(draft.destination.cityCode);
    if (!from || !to || from.code === to.code) return EMPTY_PREVIEW;

    const lead: Lead = {
      ...draft,
      moveType: deriveMoveType(draft.origin.cityCode, draft.destination.cityCode),
      id: "preview",
      createdAt: new Date(0).toISOString(),
    };

    const match = matchLead(lead);
    if (!match) return EMPTY_PREVIEW;
    const corridor = resolveCorridor(from, to);

    return {
      ready: true,
      km: roadKm(from, to),
      corridorLabel: corridor.label,
      transitDays: corridor.transitDays,
      matchCount: match.quotes.length,
      instantCount: match.instantCount,
      moveType: lead.moveType,
    };
  }, [draft]);
}

export function deriveMoveType(originCode: string, destCode: string): MoveType {
  const from = getCity(originCode);
  const to = getCity(destCode);
  if (!from || !to) return "international";
  return cityCountry(from).iso === cityCountry(to).iso ? "domestic" : "international";
}

type Updater = (draft: LeadDraft) => LeadDraft;

export function useQuoteDraft(initial?: Partial<LeadDraft>) {
  const [draft, setDraft] = useState<LeadDraft>(() => createDefaultDraft(initial));

  const update = useCallback((patch: Partial<LeadDraft> | Updater) => {
    setDraft((current) => {
      const next =
        typeof patch === "function" ? patch(current) : { ...current, ...patch };
      // Move type is derived, never asked — one less question on the form.
      return {
        ...next,
        moveType: deriveMoveType(next.origin.cityCode, next.destination.cityCode),
      };
    });
  }, []);

  const swapRoute = useCallback(() => {
    setDraft((current) => ({
      ...current,
      origin: current.destination,
      destination: current.origin,
    }));
  }, []);

  return { draft, update, swapRoute, setDraft };
}

export function isStepValid(step: StepId, draft: LeadDraft): boolean {
  switch (step) {
    case "home":
      return draft.volumeM3 >= 2 && draft.volumeM3 <= 400;
    case "timing":
      return /^\d{4}-\d{2}-\d{2}$/.test(draft.moveDate) && draft.moveDate >= todayIso();
    case "services":
      return true;
    case "contact":
      return (
        draft.contact.fullName.trim().length >= 2 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contact.email.trim()) &&
        draft.contact.phone.replace(/\D/g, "").length >= 7 &&
        draft.consent
      );
    default:
      return false;
  }
}
