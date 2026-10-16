"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { CityField } from "@/components/search/city-field";
import { cityCountry, getCity } from "@/lib/geo";
import type { LeadDraft } from "@/lib/types";

type Field = "from" | "to" | null;

/**
 * The route arrives from the home-page search, so it sits here as a summary
 * rather than a question. One tap reopens the same picker used on the
 * home page — one city control in the whole product.
 */
export function RouteEditor({
  draft,
  update,
  swapRoute,
}: {
  draft: LeadDraft;
  update: (patch: Partial<LeadDraft> | ((d: LeadDraft) => LeadDraft)) => void;
  swapRoute: () => void;
}) {
  const from = getCity(draft.origin.cityCode);
  const to = getCity(draft.destination.cityCode);
  const [editing, setEditing] = useState(!from || !to);
  const [active, setActive] = useState<Field>(null);

  return (
    <div className="rounded-2xl border bg-card p-1.5">
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="flex flex-col gap-1 sm:flex-row sm:items-center"
          >
            <CityField
              label="From"
              placeholder="Where from?"
              value={draft.origin.cityCode || null}
              exclude={draft.destination.cityCode || null}
              onChange={(code) =>
                update((d) => ({ ...d, origin: { ...d.origin, cityCode: code } }))
              }
              active={active === "from"}
              onActivate={() => setActive("from")}
              onDismiss={() => setActive(null)}
              autoAdvance={() => !draft.destination.cityCode && setActive("to")}
            />

            <div className="relative mx-5 h-px shrink-0 bg-border sm:mx-0 sm:h-7 sm:w-px sm:self-center">
              <button
                type="button"
                onClick={swapRoute}
                aria-label="Swap direction"
                className="absolute right-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border bg-card text-muted-foreground transition-all duration-300 hover:rotate-180 hover:text-foreground sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
              >
                <ArrowLeftRight className="size-3.5 sm:rotate-0 max-sm:rotate-90" />
              </button>
            </div>

            <CityField
              label="To"
              placeholder="Where to?"
              value={draft.destination.cityCode || null}
              exclude={draft.origin.cityCode || null}
              onChange={(code) => {
                update((d) => ({ ...d, destination: { ...d.destination, cityCode: code } }));
                if (draft.origin.cityCode) setEditing(false);
              }}
              active={active === "to"}
              onActivate={() => setActive("to")}
              onDismiss={() => setActive(null)}
              align="end"
            />
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="flex h-[52px] items-center gap-4 px-4"
          >
            <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-[16.5px] font-medium">{from?.name}</span>
              <span className="text-[12.5px] text-muted-foreground">
                {from && cityCountry(from).iso}
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-[16.5px] font-medium">{to?.name}</span>
              <span className="text-[12.5px] text-muted-foreground">
                {to && cityCountry(to).iso}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Change
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
