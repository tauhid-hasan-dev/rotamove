"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CODE_LENGTH,
  useFakeVerification,
} from "@/components/quote/use-fake-verification";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A contact field that has to be confirmed by a one-time code.
 *
 * The code entry opens inline rather than in a dialog: the wizard is one
 * question per screen and a modal on top of that is one layer too many.
 *
 * Editing a verified value clears the tick — see `use-fake-verification.ts`.
 */
export function VerifyField({
  id,
  kind,
  label,
  placeholder,
  value,
  onChange,
  verified,
  onVerifiedChange,
  invalid,
  valid,
  autoComplete,
  inputMode,
  type = "text",
  className,
}: {
  id: string;
  kind: "email" | "phone";
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  /** Field has been touched and the value itself is wrong. */
  invalid?: boolean;
  /** Value is well-formed, so verification can be offered. */
  valid: boolean;
  autoComplete?: string;
  inputMode?: "email" | "tel";
  type?: string;
  className?: string;
}) {
  const { dict, t } = useI18n();
  const verification = useFakeVerification(value, onVerifiedChange);
  const { status } = verification;

  const open = status === "sending" || status === "awaiting" || status === "checking" || status === "locked";

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-[13.5px]">
          {label}
        </Label>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-verify">
            <BadgeCheck className="size-3.5" strokeWidth={2.5} />
            {dict.verify.verified}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-2xl",
            kind === "phone" && "tnum",
            invalid && "border-destructive",
            verified && "border-verify/50",
          )}
        />

        {!verified && (
          <button
            type="button"
            onClick={verification.request}
            disabled={!valid || status === "sending" || status === "checking" || verification.resendIn > 0}
            className={cn(
              "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl border px-4 text-[14px] font-medium transition-colors",
              "hover:border-foreground/25 hover:bg-muted",
              "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent",
            )}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {dict.verify.sending}
              </>
            ) : (
              dict.verify.verifyAction
            )}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="code"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border bg-surface p-4">
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {t.fill(
                  kind === "email" ? dict.verify.codeSentEmail : dict.verify.codeSentPhone,
                  { target: value },
                )}
              </p>

              <CodeInput
                disabled={status === "sending" || status === "checking" || status === "locked"}
                onComplete={verification.submit}
                invalid={verification.wrongCode}
                label={dict.verify.codeLabel}
                digitLabel={dict.verify.digitLabel}
                resetKey={status}
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                {/* Shown on purpose: there is no inbox to check in a demo, and
                    a code you cannot obtain is a dead end, not a feature. */}
                <p className="text-[12px] text-muted-foreground tnum">
                  {t.fill(dict.verify.demoHint, { code: verification.code })}
                </p>

                {verification.resendIn > 0 ? (
                  <p className="text-[12px] text-muted-foreground tnum">
                    {t.fill(dict.verify.resendIn, {
                      seconds: t.number(verification.resendIn),
                    })}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={verification.request}
                    className="text-[12.5px] underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    {dict.verify.resend}
                  </button>
                )}
              </div>

              {status === "checking" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  {dict.verify.checking}
                </p>
              )}

              {verification.wrongCode && (
                <p className="mt-2 text-[12.5px] text-destructive">
                  {t.fill(dict.verify.wrongCode, {
                    attempts: t.count(dict.units.attempts, verification.attemptsLeft),
                  })}
                </p>
              )}

              {status === "locked" && (
                <p className="mt-2 text-[12.5px] text-destructive">{dict.verify.locked}</p>
              )}
            </div>
          </motion.div>
        )}

        {verified && (
          <motion.p
            key="done"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-verify"
          >
            <Check className="size-3.5" strokeWidth={3} />
            {dict.verify.verified}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Six single-character boxes.
 *
 * Typing advances, Backspace on an empty box steps back, and a pasted code
 * fills the row — the three behaviours people actually expect from an OTP
 * field and the three that are usually missing.
 */
function CodeInput({
  disabled,
  onComplete,
  invalid,
  label,
  digitLabel,
  resetKey,
}: {
  disabled: boolean;
  onComplete: (code: string) => void;
  invalid: boolean;
  label: string;
  digitLabel: string;
  resetKey: string;
}) {
  const { t } = useI18n();
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // A fresh code means a fresh row: clearing after a wrong answer saves the
  // user deleting six characters before retrying.
  //
  // Adjusted during render rather than in an effect. Resetting in an effect
  // would paint the stale digits first and then immediately re-render — a
  // visible flicker of the rejected code, plus a cascading render.
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    if (resetKey === "awaiting" || resetKey === "sending") {
      setDigits(Array(CODE_LENGTH).fill(""));
    }
  }

  const commit = useCallback(
    (next: string[]) => {
      setDigits(next);
      const joined = next.join("");
      if (joined.length === CODE_LENGTH && !next.includes("")) onComplete(joined);
    },
    [onComplete],
  );

  const setAt = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      commit(digits.map((d, i) => (i === index ? "" : d)));
      return;
    }

    // A paste lands entirely in one box; spread it across the row from here.
    const next = [...digits];
    for (let i = 0; i < cleaned.length && index + i < CODE_LENGTH; i += 1) {
      next[index + i] = cleaned[i];
    }
    commit(next);

    const landed = Math.min(index + cleaned.length, CODE_LENGTH - 1);
    refs.current[landed]?.focus();
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
      commit(digits.map((d, i) => (i === index - 1 ? "" : d)));
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={label}
      // Codes are read left-to-right in every locale, including Arabic — the
      // sequence is a number, not prose.
      dir="ltr"
      className="mt-3 flex gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(e) => setAt(index, e.target.value)}
          onKeyDown={onKeyDown(index)}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={t.fill(digitLabel, { n: index + 1 })}
          maxLength={CODE_LENGTH}
          className={cn(
            // rounded-lg, not -xl: at 40px wide the larger radius is almost
            // half the box and the row reads as pills rather than digit cells.
            "h-12 w-10 rounded-lg border bg-background text-center text-[17px] font-medium tnum outline-none transition-colors",
            "focus:border-brand focus:ring-[3px] focus:ring-brand/20",
            "disabled:opacity-55",
            invalid && "border-destructive",
          )}
        />
      ))}
    </div>
  );
}
