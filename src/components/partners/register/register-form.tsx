"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  StepCompany,
  StepContact,
  StepCoverage,
  StepCredentials,
  StepFleet,
  StepPlan,
} from "@/components/partners/register/steps";
import {
  useApplicationDraft,
  type ApplicationDraft,
} from "@/components/partners/register/use-application-draft";
import {
  companyStepSchema,
  contactStepSchema,
  coverageStepSchema,
  credentialsStepSchema,
  fleetStepSchema,
  normaliseWebsite,
  planStepSchema,
} from "@/lib/partner-application";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { z } from "zod";

/**
 * Carrier onboarding, as five steps rather than one page.
 *
 * Multi-step is not decoration here: split forms complete substantially
 * better than a single long page, and a labelled progress indicator ("Step 3
 * of 5 · Credentials") does better again than a bare bar, because it tells
 * the applicant both where they are and what is still coming.
 *
 * Validation runs per step on Continue, not per keystroke — flagging an email
 * as malformed while someone is still typing it is the classic way to make a
 * form feel hostile.
 */

const SCHEMAS = [
  companyStepSchema,
  contactStepSchema,
  credentialsStepSchema,
  fleetStepSchema,
  coverageStepSchema,
  planStepSchema,
] as const;

type Issue = z.ZodIssue;

export function RegisterForm() {
  const { dict, locale, href, rtl, t } = useI18n();
  const R = dict.register;

  const { draft, update, clear, restored, dismissRestored } = useApplicationDraft(locale);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [touched, setTouched] = useState(false);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  // Captured before `clear()` wipes the draft, so the confirmation can name
  // the inbox the acknowledgement went to.
  const [sentTo, setSentTo] = useState("");
  const [copied, setCopied] = useState(false);

  const titles = [R.s1, R.s2, R.s3, R.s4, R.s5, R.s6];
  const ledes = [R.s1Lede, R.s2Lede, R.s3Lede, R.s4Lede, R.s5Lede, R.s6Lede];
  const total = SCHEMAS.length;
  const last = index === total - 1;
  const slide = rtl ? -1 : 1;

  /** Validates only the step in view, and returns the fields that failed. */
  const validateStep = useCallback(
    (step: number): Set<string> => {
      const result = SCHEMAS[step].safeParse(draft);
      if (result.success) return new Set();
      return new Set(result.error.issues.map((i: Issue) => String(i.path[0])));
    },
    [draft],
  );

  const stepValid = useMemo(() => validateStep(index).size === 0, [validateStep, index]);

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(total - 1, next)));
    setTouched(false);
    setInvalid(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const failed = validateStep(index);
    setTouched(true);
    setInvalid(failed);
    if (failed.size) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, website: normaliseWebsite(draft.website) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ message: string }> }
          | null;
        throw new Error(data?.issues?.[0]?.message ?? data?.error ?? R.errorTitle);
      }
      const data = (await res.json()) as { reference: string };
      setSentTo(draft.email.trim());
      setReference(data.reference);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : R.errorTitle);
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (last) return void submit();
    const failed = validateStep(index);
    if (failed.size) {
      setTouched(true);
      setInvalid(failed);
      return;
    }
    go(index + 1);
  };

  /* ------------------------------------------------------- submitted -- */

  if (reference) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-verify/12 text-verify">
          <Check className="size-6" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.1] tracking-[-0.035em]">
          {R.doneTitle}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">{R.doneBody}</p>

        <div className="mt-7 rounded-2xl border bg-surface p-5">
          <p className="eyebrow">{R.doneRef}</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <p className="code text-[22px] font-semibold tracking-[0.06em]">{reference}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(reference);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover:bg-muted"
            >
              {copied ? <Check className="size-3.5 text-verify" /> : <Copy className="size-3.5" />}
              {copied ? R.doneCopied : R.doneCopy}
            </button>
          </div>

          {/* Names the inbox, so an applicant who mistyped and verified a
              different address than they meant to can see it here rather
              than discover it when nothing ever arrives. */}
          <p className="mt-4 flex items-center justify-center gap-2 border-t pt-4 text-[13px] text-muted-foreground">
            <Mail className="size-3.5 shrink-0 text-verify" aria-hidden />
            <span>{t.fill(R.doneEmailed, { email: sentTo })}</span>
          </p>
        </div>

        <Link
          href={href("/partners")}
          className="mt-7 inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[14.5px] transition-colors hover:bg-muted"
        >
          {R.doneNext}
        </Link>
      </div>
    );
  }

  /* ----------------------------------------------------------- form -- */

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[clamp(1.8rem,3.4vw,2.5rem)] leading-[1.08] tracking-[-0.04em]">
        {R.title}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{R.lede}</p>

      {restored && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand bg-brand-soft p-3.5 text-[13.5px] dark:bg-accent">
          <RotateCcw className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{R.restored}</span>
          <button
            type="button"
            onClick={() => {
              clear();
              setIndex(0);
            }}
            className="underline underline-offset-4 hover:no-underline"
          >
            {R.discard}
          </button>
          <button
            type="button"
            onClick={dismissRestored}
            className="rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"
            aria-label={R.discard}
          >
            ✕
          </button>
        </div>
      )}

      {/* progress ------------------------------------------------- */}
      <div className="mt-8 flex items-center gap-2">
        {titles.map((title, i) => (
          <button
            key={title}
            type="button"
            disabled={i > index}
            onClick={() => i <= index && go(i)}
            className="group flex flex-1 flex-col gap-2"
            aria-label={title}
            aria-current={i === index ? "step" : undefined}
          >
            <span className="h-[3px] w-full overflow-hidden rounded-full bg-border">
              <motion.span
                className="block h-full rounded-full bg-brand"
                initial={false}
                animate={{ width: i < index ? "100%" : i === index ? "45%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span
              className={cn(
                "truncate text-start text-[12px] transition-colors",
                i <= index ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {title}
            </span>
          </button>
        ))}
      </div>

      {/* Position *and* purpose, which is what makes a labelled indicator
          outperform a bare progress bar. */}
      <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {dict.register.stepOf
          .replace("{current}", String(index + 1))
          .replace("{total}", String(total))}
      </p>
      <h2 className="mt-1.5 text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.1] tracking-[-0.03em]">
        {ledes[index]}
      </h2>

      {/*
        Padded for the same reason as the quote wizard: `overflow` clips at
        the padding box, so a flush wrapper slices the focus ring off every
        field at the container's edges. The negative margin keeps the layout
        identical.
      */}
      <div className="mt-7">
        <div className="relative -m-2 overflow-hidden p-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, x: direction * slide * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * slide * -24 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderStep(index, { draft, update, touched, invalid })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {touched && invalid.size > 0 && (
        <p role="alert" className="mt-5 text-[13.5px] text-destructive">
          {/* "Fix the errors below" is no help when the only thing wrong is
              that a well-formed field has not been confirmed yet — there is
              nothing on screen to fix, and the applicant hunts for a typo
              that is not there. Named only when it is the sole blocker;
              otherwise the real errors take precedence. */}
          {[...invalid].every((k) => k === "emailVerified" || k === "phoneVerified")
            ? R.verifyRequired
            : R.fixErrors}
        </p>
      )}

      {/* footer --------------------------------------------------- */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-10 flex items-center gap-3 border-t bg-background/92 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        {index > 0 && (
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {R.back}
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className={cn(
            "group ms-auto inline-flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[15.5px] font-medium text-ink transition-all duration-200 active:scale-[0.985]",
            "hover:brightness-[0.97] disabled:opacity-70",
            !stepValid && "opacity-60",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {R.submitting}
            </>
          ) : (
            <>
              {last ? R.submit : R.next}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </>
          )}
        </button>
      </div>

      <p className="mt-5 text-[12.5px] text-muted-foreground">{R.draftSaved}</p>
    </div>
  );
}

function renderStep(
  index: number,
  props: {
    draft: ApplicationDraft;
    update: (patch: Partial<ApplicationDraft>) => void;
    touched: boolean;
    invalid: Set<string>;
  },
) {
  switch (index) {
    case 0:
      return <StepCompany {...props} />;
    case 1:
      return <StepContact {...props} />;
    case 2:
      return <StepCredentials {...props} />;
    case 3:
      return <StepFleet {...props} />;
    case 4:
      return <StepCoverage {...props} />;
    default:
      return <StepPlan {...props} />;
  }
}
