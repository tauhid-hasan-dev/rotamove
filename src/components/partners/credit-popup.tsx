"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Gift, X } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { SIGNUP_CREDIT_USD } from "@/lib/plans";

/** Long enough that it reads as a deliberate offer, not a render glitch. */
const APPEAR_AFTER_MS = 700;

/**
 * The sign-up credit, as a modal on the partner pricing page.
 *
 * Every visit, by design and by instruction — unlike the last-call popup,
 * which was deliberately reduced to once per document load because it
 * followed people around the whole site. This one is mounted by a single
 * page, so "every visit" is already its natural scope: it appears when the
 * pricing page does and nowhere else, and dismissing it is scoped to the
 * view rather than remembered.
 *
 * Everything it says is also on the page behind it — the banner above the
 * plans carries the same offer and the same link — so closing it costs the
 * reader nothing.
 */
export function CreditPopup() {
  const { dict, t, href } = useI18n();
  const page = dict.partnersPage;

  const [dismissed, setDismissed] = useState(false);
  const [armed, setArmed] = useState(false);

  const target = href("/partners/register");

  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), APPEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  // Escape closes it, like any other modal on the site.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDismissed(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = armed && !dismissed;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label={dict.lastCall.dismiss}
            onClick={() => setDismissed(true)}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-popup-title"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[460px] overflow-hidden rounded-3xl bg-lastcall text-lastcall-foreground shadow-float"
          >
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label={dict.lastCall.dismiss}
              className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-lastcall-accent/70 transition-colors hover:bg-lastcall-accent"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>

            <div className="px-7 pb-7 pt-8 text-center sm:px-9">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-lastcall-accent">
                <Gift className="size-7" strokeWidth={2} />
              </span>

              <h2
                id="credit-popup-title"
                className="mt-5 text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-[1.1] tracking-[-0.03em]"
              >
                {t.fill(page.creditTitle, { credit: t.usd(SIGNUP_CREDIT_USD) })}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-[15.5px] leading-relaxed opacity-80">
                {page.creditBody}
              </p>

              <Link
                href={target}
                onClick={() => setDismissed(true)}
                className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15.5px] font-medium text-background transition-all duration-200 hover:opacity-90 active:scale-[0.985]"
              >
                {dict.plans.getStarted}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </Link>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="mt-3 text-[13px] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
              >
                {page.creditDismiss}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
