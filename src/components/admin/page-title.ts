"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * The title shown in the admin topbar.
 *
 * A view announces its own name and the chrome renders it, so a page that
 * puts its title in the bar does not also print it above the content. The
 * alternative — deriving it in the shell from the pathname — would show a
 * title on every admin page at once, including the nine that still print
 * their own, and duplicate all of them.
 *
 * A module-level store rather than context because the writer is a
 * descendant of the reader: a child cannot set parent state during render,
 * and doing it in an effect is the cascading-render pattern this codebase
 * lints against. Writing to an external store from an effect is exactly
 * what effects are for, and `useSyncExternalStore` is what reads one.
 */

let current: string | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Announce this view's title for as long as it is mounted. */
export function useAdminPageTitle(title: string) {
  useEffect(() => {
    current = title;
    listeners.forEach((fn) => fn());
    return () => {
      current = null;
      listeners.forEach((fn) => fn());
    };
  }, [title]);
}

/** Read it in the chrome. `null` on the server, and until a view claims it. */
export function useAdminTitle(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
