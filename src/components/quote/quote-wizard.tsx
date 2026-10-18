"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { RouteEditor } from "@/components/quote/route-editor";
import { CollectionWindow } from "@/components/quote/collection-window";
import { StepContact, StepHome, StepServices } from "@/components/quote/steps";
import {
  STEPS,
  isStepValid,
  useLivePreview,
  useQuoteDraft,
} from "@/components/quote/use-quote-form";
import { getCity, resolveCorridor } from "@/lib/geo";
import { useI18n } from "@/i18n/provider";
import { corridorLabel } from "@/i18n/geo-labels";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LeadDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuoteWizard({ initial }: { initial?: Partial<LeadDraft> }) {
  const router = useRouter();
  const { dict, locale, t, href, rtl } = useI18n();
  const { draft, update, swapRoute } = useQuoteDraft(initial, locale);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const step = STEPS[index];
  const preview = useLivePreview(draft);
  const valid = isStepValid(step.id, draft);
  const last = index === STEPS.length - 1;
  // Steps slide towards the reading direction, so "next" never animates
  // backwards in Arabic.
  const slide = rtl ? -1 : 1;

  const go = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
    setTouched(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  const submit = useCallback(async () => {
    setTouched(true);
    if (!isStepValid("contact", draft)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ message: string }> }
          | null;
        throw new Error(data?.issues?.[0]?.message ?? data?.error ?? dict.quote.sendFailed);
      }
      const data = (await res.json()) as { id: string; token: string };
      const matches = draft.preferredMatches === null ? "all" : String(draft.preferredMatches);
      startTransition(() =>
        router.push(
          href(
            `/results/${data.id}?d=${data.token}&c=${draft.contact.channel}&n=${matches}`,
          ),
        ),
      );
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : dict.quote.somethingWrong);
    }
  }, [draft, router, href, dict]);

  const onNext = () => {
    if (last) return void submit();
    if (!valid) return setTouched(true);
    go(index + 1);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <RouteEditor draft={draft} update={update} swapRoute={swapRoute} />
      <CollectionWindow draft={draft} update={update} />

      {/* progress ------------------------------------------------- */}
      <div className="mt-10 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            disabled={i > index}
            onClick={() => i <= index && go(i)}
            className="group flex flex-1 flex-col gap-2"
            aria-label={dict.quote.steps[s.id]}
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
                "text-start text-[12px] transition-colors",
                i <= index ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {dict.quote.steps[s.id]}
            </span>
          </button>
        ))}
      </div>

      <h1 className="mt-10 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.05]">
        {dict.quote.headings[step.id]}
      </h1>

      <div className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: direction * slide * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * slide * -24 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {step.id === "home" && <StepHome draft={draft} update={update} />}
            {step.id === "services" && <StepServices draft={draft} update={update} />}
            {step.id === "contact" && (
              <StepContact draft={draft} update={update} touched={touched} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer --------------------------------------------------- */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-12 flex items-center gap-3 border-t bg-background/92 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        {index > 0 && (
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {dict.common.back}
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className={cn(
            "group ml-auto inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[15.5px] font-medium text-ink transition-all duration-200 active:scale-[0.985]",
            "hover:brightness-[0.97] disabled:opacity-70",
            !valid && "opacity-60",
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {dict.quote.matching}
            </>
          ) : (
            <>
              {last ? dict.quote.findMovers : dict.common.continue}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </>
          )}
        </button>
      </div>

      {/* reassurance + live match count --------------------------- */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Lock className="size-3.5" />
          {dict.common.free}
        </span>
        {preview.ready && (
          <span className="inline-flex items-center gap-2">
            <Check className="size-3.5 text-verify" />
            <span className="font-medium text-foreground">
              {t.fill(dict.quote.moversMatch, {
                count: t.count(dict.units.movers, preview.matchCount),
              })}
            </span>
            <span aria-hidden>·</span>
            {t.days(preview.transitDays)}
          </span>
        )}
      </div>

      {preview.ready && (
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          {resolveCorridorLabel(dict, draft)} · {t.dateLong(draft.moveDate)} ·{" "}
          {t.volume(draft.volumeM3)}
        </p>
      )}
    </div>
  );
}

function resolveCorridorLabel(dict: Dictionary, draft: LeadDraft) {
  const from = getCity(draft.origin.cityCode);
  const to = getCity(draft.destination.cityCode);
  if (!from || !to) return "";
  return corridorLabel(dict, resolveCorridor(from, to));
}
