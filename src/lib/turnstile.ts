/**
 * Cloudflare Turnstile.
 *
 * Two keys: a site key the widget renders with, and a secret the server
 * exchanges the resulting token for a verdict. Both come from environment
 * variables, and both fall back to Cloudflare's published *test* keys so the
 * form works the moment you clone the repo.
 *
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   — public, shipped to the browser
 *   TURNSTILE_SECRET_KEY             — server only, never bundled
 *
 * The test keys always pass. That is the right default for a demo and the
 * wrong one for production: without real keys this challenge stops nothing.
 * `usingTestKeys()` reports which pair is live so the UI can say so out loud
 * rather than implying a protection that is not there.
 */

/** Cloudflare's documented always-passes pair. */
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * `onload=` matters as much as `render=explicit`.
 *
 * `window.turnstile` is assigned before the API is actually ready to render,
 * so hanging the first `render()` off the script tag's own `onload` is a
 * race: it wins often enough to look correct and loses often enough to leave
 * a blank box where the challenge should be. The documented ready signal is
 * this callback, which the script invokes when it genuinely can render.
 */
export const TURNSTILE_CALLBACK = "onloadTurnstileCallback";

export const TURNSTILE_SCRIPT =
  `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${TURNSTILE_CALLBACK}`;

export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
}

function turnstileSecret(): string {
  return process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY;
}

/** True while either half is still Cloudflare's test key. */
export function usingTestKeys(): boolean {
  return (
    (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY) === TEST_SITE_KEY ||
    (process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY) === TEST_SECRET_KEY
  );
}

export interface TurnstileVerdict {
  ok: boolean;
  /** Cloudflare's own error codes, for the server log. Never shown to a user. */
  errors: string[];
}

/**
 * Exchange a widget token for a verdict.
 *
 * A network failure is reported as a failure rather than waved through: this
 * is the only thing standing between the inbox and a bot, and "the check was
 * unreachable so we accepted it" is how that protection quietly stops
 * existing. The caller turns it into a retryable 503.
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string | null,
): Promise<TurnstileVerdict> {
  const body = new URLSearchParams({ secret: turnstileSecret(), response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, errors: [`http-${response.status}`] };

    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    return { ok: data.success === true, errors: data["error-codes"] ?? [] };
  } catch {
    return { ok: false, errors: ["network-error"] };
  }
}
