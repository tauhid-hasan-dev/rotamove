"use client";

import { useEffect, useState } from "react";
import type { LastCallOffer } from "@/lib/last-call-offers";

/**
 * Live last-call offers, for the public chrome.
 *
 * Three separate pieces of furniture advertise the same board — the strip,
 * the nav pill and the popup — and all three mount inside a prerendered
 * layout that cannot read the store. One module-level promise means they
 * share a single request instead of making three identical ones.
 *
 * Deliberately not revalidated on an interval: offers expire in hours, not
 * seconds, and a header that re-fetches forever is a cost with no payoff.
 */
interface LastCallFeed {
  /** The server's clock when the feed was built. */
  now: number;
  offers: LastCallOffer[];
}

let pending: Promise<LastCallFeed> | null = null;

function load(): Promise<LastCallFeed> {
  pending ??= fetch("/api/last-call", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data: Partial<LastCallFeed> | null) => ({
      now: data?.now ?? 0,
      offers: data?.offers ?? [],
    }))
    .catch(() => {
      // Let the next mount try again rather than caching a network blip.
      pending = null;
      return { now: 0, offers: [] };
    });
  return pending;
}

/**
 * `now` comes back with the feed rather than being read at render time:
 * countdowns derived from it are then pure, and they agree with the clock
 * that decided which offers were still live in the first place.
 */
export function useLastCall(): { offers: LastCallOffer[]; now: number; ready: boolean } {
  const [feed, setFeed] = useState<LastCallFeed>({ now: 0, offers: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    // Deferred into a callback so the effect body itself writes no state.
    const timer = setTimeout(() => {
      void load().then((next) => {
        if (!live) return;
        setFeed(next);
        setReady(true);
      });
    }, 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, []);

  return { offers: feed.offers, now: feed.now, ready };
}
