"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { TURNSTILE_SCRIPT } from "@/lib/turnstile";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Minimal typing for the slice of the Turnstile API this uses.
 *
 * Hand-written rather than pulling in `@marsidev/react-turnstile` or the
 * official types package: four methods, and a dependency whose job is to
 * wrap four methods is a dependency that will need updating for reasons
 * that have nothing to do with this form.
 */
interface TurnstileApi {
  /** Fires the callback once the API can actually render. */
  ready?: (cb: () => void) => void;
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstileCallback?: () => void;
  }
}

const TURNSTILE_CALLBACK = "onloadTurnstileCallback" as const;

/** One loader for the page, however many widgets ask for it. */
let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // Already loaded — but still go through `ready`, which fires immediately
  // once the API is usable and defers when it is not quite.
  if (window.turnstile) {
    return new Promise<void>((resolve) => {
      const api = window.turnstile!;
      if (api.ready) api.ready(() => resolve());
      else resolve();
    });
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // The script calls this when it is genuinely ready to render; see
    // `TURNSTILE_SCRIPT` for why the tag's own `onload` is not good enough.
    window[TURNSTILE_CALLBACK] = () => resolve();

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      // Let a later mount try again rather than caching the failure for the
      // life of the tab — this is usually a blocked request, not a dead CDN.
      scriptPromise = null;
      reject(new Error("turnstile-script"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

export type TurnstileState = "loading" | "ready" | "solved" | "error";

/**
 * The Cloudflare challenge.
 *
 * Rendered explicitly rather than by class name so the token has somewhere
 * to go: the implicit renderer writes into a hidden input, which is no use
 * to a form that submits JSON.
 *
 * It reports its own state upward because the submit button depends on it —
 * a form that lets you press Submit before the challenge resolves just
 * fails on the server, which teaches the visitor nothing.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  onStateChange,
  className,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  onStateChange?: (state: TurnstileState) => void;
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [state, setState] = useState<TurnstileState>("loading");
  const domId = `${useId()}-turnstile`;

  /*
   * Callbacks land in a ref so the effect below can depend on nothing but
   * the site key. Listing them as dependencies would re-render the widget —
   * and so reset the challenge — every time the parent re-rendered, which
   * for a form means on every keystroke.
   */
  const handlers = useRef({ onToken, onStateChange });
  useEffect(() => {
    // After commit, not during render: a ref written mid-render is the one
    // thing `react-hooks/refs` will not have, and the callbacks it feeds all
    // fire asynchronously anyway.
    handlers.current = { onToken, onStateChange };
  });

  const move = (next: TurnstileState) => {
    setState(next);
    handlers.current.onStateChange?.(next);
  };

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        // React's development double-mount can leave the first widget's
        // iframe behind; rendering a second into the same host stacks two
        // challenges on top of each other.
        if (hostRef.current.childElementCount > 0) hostRef.current.replaceChildren();
        widgetId.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme: "auto",
          language: locale,
          callback: (token) => {
            handlers.current.onToken(token);
            move("solved");
          },
          // A token is good for five minutes. All three of these mean the
          // one we are holding is no longer worth sending.
          "expired-callback": () => {
            handlers.current.onToken(null);
            move("ready");
          },
          "timeout-callback": () => {
            handlers.current.onToken(null);
            move("ready");
          },
          "error-callback": () => {
            handlers.current.onToken(null);
            move("error");
          },
        });
        move("ready");
      })
      .catch(() => {
        if (!cancelled) move("error");
      });

    return () => {
      cancelled = true;
      const id = widgetId.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // Already gone — React unmounted the host first in dev's double
          // mount. Nothing to clean up and nothing worth reporting.
        }
      }
      widgetId.current = null;
    };
  }, [siteKey, locale]);

  return (
    <div className={className}>
      {/* Cloudflare renders a fixed 300px-wide iframe and offers no way to
          make it narrower at the normal size. On a 320px phone that is wider
          than the card it sits in, so the box scrolls rather than letting the
          widget push the whole page sideways. */}
      <div
        ref={hostRef}
        id={domId}
        className="scrollbar-slim -mx-1 min-h-[65px] overflow-x-auto px-1"
      />

      {state === "loading" && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          {dict.contactPage.verifyLoading}
        </p>
      )}

      {state === "error" && (
        <p
          className={cn(
            "mt-1 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2",
            "text-[12.5px] leading-relaxed text-destructive",
          )}
        >
          {dict.contactPage.verifyError}
        </p>
      )}
    </div>
  );
}
