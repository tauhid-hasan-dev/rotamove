"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Simulated one-time-code verification.
 *
 * No email or SMS is sent. The code is *derived* from the target rather than
 * being a constant, so each address and number gets its own plausible six
 * digits and the flow behaves like the real thing — including the wrong-code
 * path, which a hardcoded "123456" would never exercise.
 *
 * Swapping this for a real provider means replacing `request` and `submit`
 * with network calls; the state machine and every component using it stay as
 * they are.
 */

export const CODE_LENGTH = 6;
export const MAX_ATTEMPTS = 3;
const RESEND_SECONDS = 45;
const SEND_LATENCY_MS = 850;
const CHECK_LATENCY_MS = 650;

export type VerificationStatus =
  | "idle"
  | "sending"
  | "awaiting"
  | "checking"
  | "verified"
  | "locked";

/** Deterministic six digits for a given target. FNV-1a, not a secret. */
export function demoCodeFor(target: string): string {
  let hash = 0x811c9dc5;
  const normalised = target.trim().toLowerCase();
  for (let i = 0; i < normalised.length; i += 1) {
    hash ^= normalised.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return String(hash % 1_000_000).padStart(CODE_LENGTH, "0");
}

export interface Verification {
  status: VerificationStatus;
  /** Shown on screen so nobody gets stuck in a demo with no inbox. */
  code: string;
  attemptsLeft: number;
  resendIn: number;
  wrongCode: boolean;
  request: () => void;
  submit: (entered: string) => void;
  /** Called when the underlying field changes — drops back to unverified. */
  reset: () => void;
}

export function useFakeVerification(
  target: string,
  onVerified: (verified: boolean) => void,
): Verification {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [resendIn, setResendIn] = useState(0);
  const [wrongCode, setWrongCode] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clearing the array as we go means a component that unmounts mid-send does
  // not leave a setState pointed at nothing.
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  /**
   * The verified target is pinned at the moment of success. If the field is
   * edited afterwards, the badge must not keep vouching for a value nobody
   * ever confirmed — that is the bug that makes verification theatre.
   */
  const verifiedTarget = useRef<string | null>(null);

  useEffect(() => {
    if (verifiedTarget.current !== null && verifiedTarget.current !== target.trim()) {
      verifiedTarget.current = null;
      setStatus("idle");
      setAttemptsLeft(MAX_ATTEMPTS);
      setWrongCode(false);
      setResendIn(0);
      onVerified(false);
    }
  }, [target, onVerified]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const request = useCallback(() => {
    if (status === "sending" || status === "checking" || resendIn > 0) return;
    setStatus("sending");
    setWrongCode(false);
    setAttemptsLeft(MAX_ATTEMPTS);
    schedule(() => {
      setStatus("awaiting");
      setResendIn(RESEND_SECONDS);
    }, SEND_LATENCY_MS);
  }, [status, resendIn, schedule]);

  const submit = useCallback(
    (entered: string) => {
      if (entered.length !== CODE_LENGTH || status === "checking") return;
      setStatus("checking");
      setWrongCode(false);

      schedule(() => {
        if (entered === demoCodeFor(target)) {
          verifiedTarget.current = target.trim();
          setStatus("verified");
          onVerified(true);
          return;
        }

        setAttemptsLeft((left) => {
          const remaining = left - 1;
          setStatus(remaining <= 0 ? "locked" : "awaiting");
          setWrongCode(remaining > 0);
          return Math.max(0, remaining);
        });
      }, CHECK_LATENCY_MS);
    },
    [status, target, onVerified, schedule],
  );

  const reset = useCallback(() => {
    verifiedTarget.current = null;
    setStatus("idle");
    setAttemptsLeft(MAX_ATTEMPTS);
    setWrongCode(false);
    setResendIn(0);
    onVerified(false);
  }, [onVerified]);

  return {
    status,
    code: demoCodeFor(target),
    attemptsLeft,
    resendIn,
    wrongCode,
    request,
    submit,
    reset,
  };
}
