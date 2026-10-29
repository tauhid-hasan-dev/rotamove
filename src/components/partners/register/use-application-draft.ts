"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { DocumentMeta } from "@/lib/partner-application";
import type { Locale } from "@/i18n/config";

/**
 * The application draft, with save-and-resume.
 *
 * A five-step vetting form is exactly the kind of thing people start at their
 * desk and finish after digging out an insurance certificate, so the draft is
 * mirrored to `localStorage` and offered back on return.
 */

export interface ApplicationDraft {
  legalName: string;
  tradingName: string;
  countryIso: string;
  city: string;
  foundedYear: number;
  website: string;
  size: string;

  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  altPhone: string;
  languages: Locale[];
  /** Set by the one-time-code field, and never restored from storage. */
  emailVerified: boolean;
  phoneVerified: boolean;

  registrationNumber: string;
  vatNumber: string;
  transportLicence: string;
  cargoCoverEur: number;
  liabilityCoverEur: number;
  memberships: string[];
  registrationDoc: DocumentMeta | null;
  insuranceDoc: DocumentMeta | null;
  licenceDoc: DocumentMeta | null;

  lorries: number;
  vans: number;
  ownership: string;
  weeklyCapacityM3: number;
  modes: string[];
  services: string[];

  regions: string[];
  availability: string;
  notes: string;
  declaration: boolean;

  /** `""` until chosen — the plan step has no default on purpose. */
  plan: string;
}

const STORAGE_KEY = "rotamove.partner.application";

export function emptyDraft(locale: Locale): ApplicationDraft {
  return {
    legalName: "",
    tradingName: "",
    countryIso: "",
    city: "",
    foundedYear: new Date().getFullYear() - 5,
    website: "",
    size: "small",

    contactName: "",
    contactRole: "",
    email: "",
    phone: "",
    altPhone: "",
    // Seeded with the language they are reading the form in — almost always
    // one of the languages they actually work in.
    languages: [locale],
    emailVerified: false,
    phoneVerified: false,

    registrationNumber: "",
    vatNumber: "",
    transportLicence: "",
    cargoCoverEur: 100_000,
    liabilityCoverEur: 250_000,
    memberships: [],
    registrationDoc: null,
    insuranceDoc: null,
    licenceDoc: null,

    lorries: 4,
    vans: 2,
    ownership: "owned",
    weeklyCapacityM3: 240,
    modes: ["road"],
    services: [],

    regions: [],
    availability: "within_week",
    notes: "",
    declaration: false,

    // Deliberately empty. Pre-selecting a plan would mean most accounts
    // arrive on whichever one we happened to list first, which is a pricing
    // decision made by a default rather than by the carrier.
    plan: "",
  };
}

/* ------------------------------------------------------- stored draft -- */

/**
 * `localStorage` is an external store, so it is read through the API built
 * for external stores rather than through an effect.
 *
 * The important part is `getServerSnapshot`: it returns `null`, so the server
 * render and the first client render agree on "no draft", and the real value
 * arrives on the next render. That is what makes resume possible without a
 * hydration mismatch — and without the cascading `setState`-in-an-effect this
 * otherwise needs.
 */
const storageListeners = new Set<() => void>();

function subscribeToStorage(onChange: () => void) {
  storageListeners.add(onChange);
  // Picks up a draft saved in another tab.
  window.addEventListener("storage", onChange);
  return () => {
    storageListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

const notifyStorage = () => storageListeners.forEach((fn) => fn());

function readStoredDraft(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useApplicationDraft(locale: Locale) {
  const stored = useSyncExternalStore(
    subscribeToStorage,
    readStoredDraft,
    () => null, // server: never a draft
  );

  const [draft, setDraft] = useState<ApplicationDraft>(() => emptyDraft(locale));
  const [restored, setRestored] = useState(false);
  // State rather than a ref: this participates in the render-time decision
  // below, and refs must not be read during render.
  const [dirty, setDirty] = useState(false);

  /**
   * Adjusting state during render as the snapshot changes — the pattern React
   * sanctions for "derive from a changing input", and the reason this hook
   * needs no restore effect at all.
   *
   * Tracking the *last seen* snapshot rather than "have I applied one yet"
   * matters: the first client render replays the server snapshot (`null`), so
   * a once-only guard would record that as applied and lock out the real
   * value arriving on the very next render.
   */
  const [lastSnapshot, setLastSnapshot] = useState<string | null | undefined>(undefined);
  if (lastSnapshot !== stored) {
    setLastSnapshot(stored);
    // Never clobber edits in progress — a write from another tab must not
    // overwrite what someone is typing here.
    if (stored && !dirty) {
      try {
        const parsed = JSON.parse(stored) as Partial<ApplicationDraft>;
        // Merged over a fresh draft, so a copy stored before a field existed
        // cannot leave that field undefined.
        //
        // The verification flags are forced back to false whatever storage
        // says. A restored `true` would be a tick with nothing behind it: the
        // code field pins the address it verified in its own state, which a
        // new session does not have, so the flag would survive an edit to the
        // address underneath it — exactly the "verified" badge that vouches
        // for a value nobody ever confirmed. Re-sending a code costs the
        // applicant one click.
        setDraft((current) => ({
          ...current,
          ...parsed,
          emailVerified: false,
          phoneVerified: false,
        }));
        setRestored(true);
      } catch {
        // Corrupt storage is not worth blocking the form over.
      }
    }
  }

  // Writing is a genuine side effect on an external system, which is exactly
  // what an effect is for.
  useEffect(() => {
    if (!dirty) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* quota, or private mode */
    }
  }, [draft, dirty]);

  const update = useCallback((patch: Partial<ApplicationDraft>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setDirty(false);
    setLastSnapshot(null);
    setDraft(emptyDraft(locale));
    setRestored(false);
    notifyStorage();
  }, [locale]);

  return { draft, update, clear, restored, dismissRestored: () => setRestored(false) };
}
