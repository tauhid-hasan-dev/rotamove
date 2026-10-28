"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlarmClock, ArrowRight, Box, X } from "lucide-react";
import { useLastCall } from "@/components/site/use-last-call";
import { getCity } from "@/lib/geo";
import { stripLocale } from "@/i18n/paths";
import { useI18n } from "@/i18n/provider";

/** Long enough that it reads as a deliberate offer, not a render glitch. */
const APPEAR_AFTER_MS = 900;

/**
 * Where the popup stays out of the way.
 *
 * The board it advertises, and anywhere the visitor is already acting on a
 * request. Someone who has just pressed Send request has taken the offer —
 * putting the same offer back in front of them is interrupting a conversion
 * to advertise the thing they are already doing.
 */
const SILENT_PATHS = ["/last-call", "/quote", "/results"];

/**
 * The last-call offer popup.
 *
 * Shown on every page load rather than once per visitor: the thing it
 * advertises expires in hours, so "you already saw this yesterday" is not a
 * reason to hide today's departures. Dismissal therefore lives in component
 * state only — closing it clears this page view, not the next one.
 *
 * Suppressed on the board it links to (nothing to promote once you are
 * already there) and whenever no offer is actually live, because a popup
 * advertising an empty page is worse than no popup.
 */
export function LastCallPopup() {
  const { dict, t, href } = useI18n();
  const lx = dict.lastCallPopup;
  const router = useRouter();
  const pathname = usePathname();
  const { offers, now, ready } = useLastCall();

  const [dismissed, setDismissed] = useState(false);
  const [armed, setArmed] = useState(false);

  const path = stripLocale(pathname);
  const silent = SILENT_PATHS.some((p) => path.startsWith(p));
  const target = href("/last-call");

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

  const open = armed && ready && !dismissed && !silent && offers.length > 0;

  // The three soonest to expire — enough to show the offer is real without
  // turning the popup into the board it links to.
  const preview = offers.slice(0, 3);

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
            aria-labelledby="last-call-popup-title"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border bg-card shadow-float"
          >
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label={dict.lastCall.dismiss}
              className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>

            {/* The whole card is the link, as on the reference site — the
                button underneath is for keyboard and screen-reader users,
                who should not have to find a clickable <div>. */}
            <div
              role="presentation"
              onClick={() => router.push(target)}
              className="cursor-pointer"
            >
              <div className="relative overflow-hidden bg-lastcall px-6 pb-7 pt-8 text-lastcall-foreground">
                {/* A slow sweep across the header, so the card reads as live
                    without anything blinking at the reader. */}
                <span aria-hidden className="last-call-sheen absolute inset-0" />

                <span className="relative inline-flex items-center gap-1.5 rounded-full bg-lastcall-accent px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink">
                  <AlarmClock className="last-call-ring size-3 motion-reduce:animate-none" />
                  {dict.lastCall.badge}
                </span>

                <h2
                  id="last-call-popup-title"
                  className="relative mt-4 text-[26px] leading-[1.1] tracking-[-0.035em]"
                >
                  {lx.title}
                </h2>
                <p className="relative mt-2 text-[14px] leading-relaxed opacity-80">
                  {t.fill(lx.body, { count: t.number(offers.length) })}
                </p>
              </div>

              <ul className="divide-y border-b">
                {preview.map((offer) => {
                  const from = getCity(offer.fromCode);
                  const to = getCity(offer.toCode);
                  const hoursLeft = Math.max(
                    0,
                    Math.floor((Date.parse(offer.endAt) - now) / 3_600_000),
                  );
                  return (
                    <li
                      key={offer.id}
                      className="flex items-center gap-3 px-6 py-3 text-[13px]"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {from?.name ?? offer.fromCode} → {to?.name ?? offer.toCode}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground tnum">
                        <Box className="size-3.5" />
                        {t.number(offer.capacityM3)} m³
                      </span>
                      <span className="shrink-0 font-medium text-lastcall-foreground tnum">
                        {t.fill(dict.lastCallPage.hoursLeft, { n: hoursLeft })}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="p-5">
                <Link
                  href={target}
                  onClick={(event) => event.stopPropagation()}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-[15px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
                >
                  {lx.cta}
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
                </Link>
                <p className="mt-3 text-center text-[12px] text-muted-foreground">
                  {lx.note}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
